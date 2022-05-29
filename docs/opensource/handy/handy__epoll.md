---
title: "handy的epoll反应堆模型实现"
date: 2020-04-30T20:42:52+08:00
lastmod: 2020-04-30T20:42:52+08:00
description: ""
tags: ["c++11", "c++", "源码分析", "handy"]
categories: ["源码分析"]
author: "xGdl"
comment: true
toc: true
autoCollapseToc: true
postMetaInFooter: false
hiddenFromHomePage: false
contentCopyright: true
reward: true
mathjax: true
mathjaxEnableSingleDollar: false
mathjaxEnableAutoNumber: false
---


```cpp
const int kMaxEvents = 2000;
const int kReadEvent = POLLIN;
const int kWriteEvent = POLLOUT;
```

# Channel

## Channel定义

```cpp
//通道，封装了可以进行epoll的一个fd
struct Channel : private noncopyable {
    // base为事件管理器，fd为通道内部的fd，events为通道关心的事件
    Channel(EventBase *base, int fd, int events);
    ~Channel();
    EventBase *getBase() { return base_; }
    int fd() { return fd_; }
    //通道id
    int64_t id() { return id_; }
    short events() { return events_; }
    //关闭通道
    void close();

    //挂接事件处理器
    void onRead(const Task &readcb) { readcb_ = readcb; }
    void onWrite(const Task &writecb) { writecb_ = writecb; }
    void onRead(Task &&readcb) { readcb_ = std::move(readcb); }
    void onWrite(Task &&writecb) { writecb_ = std::move(writecb); }

    //启用读写监听
    void enableRead(bool enable);
    void enableWrite(bool enable);
    void enableReadWrite(bool readable, bool writable);
    bool readEnabled();
    bool writeEnabled();

    //处理读写事件
    void handleRead() { readcb_(); }
    void handleWrite() { writecb_(); }

   protected:
    EventBase *base_;// 事件派发器
    PollerBase *poller_;//Channel管理器
    int fd_;
    short events_;
    int64_t id_;
    std::function<void()> readcb_, writecb_, errorcb_;
};
```

## Channel实现

```cpp
Channel::Channel(EventBase *base, int fd, int events) : base_(base), fd_(fd), events_(events) {
    fatalif(net::setNonBlock(fd_) < 0, "channel set non block failed");
    static atomic<int64_t> id(0);//static局部静态变量是线程安全的
    id_ = ++id;                                                             
    poller_ = base_->imp_->poller_;//初始化Channel的管理器Poller
    poller_->addChannel(this);                                             
}

Channel::~Channel() {
    close();
}

void Channel::enableRead(bool enable) {
    if (enable) {
        events_ |= kReadEvent;
    } else {
        events_ &= ~kReadEvent;
    }
    poller_->updateChannel(this);
}

void Channel::enableWrite(bool enable) {
    if (enable) {
        events_ |= kWriteEvent;
    } else {
        events_ &= ~kWriteEvent;
    }
    poller_->updateChannel(this);
}

void Channel::enableReadWrite(bool readable, bool writable) {
    if (readable) {
        events_ |= kReadEvent;
    } else {
        events_ &= ~kReadEvent;
    }
    if (writable) {
        events_ |= kWriteEvent;
    } else {
        events_ &= ~kWriteEvent;
    }
    //enableRead(readable);
    //enableWrite(writable);
    poller_->updateChannel(this);
}

void Channel::close() {
    if (fd_ >= 0) {
        trace("close channel %ld fd %d", (long) id_, fd_);
        poller_->removeChannel(this);//移除Channel的追踪
        ::close(fd_);//并关闭tcp协议连接
        fd_ = -1;
        handleRead();//==================??????????????????????????????????????????
    }
}

bool Channel::readEnabled() {
    return events_ & kReadEvent;
}
bool Channel::writeEnabled() {
    return events_ & kWriteEvent;
}
```


# Poller

## Poller定义

```cpp
//抽象类，linux下使用epoll，mac下使用kqueue
struct PollerBase : private noncopyable {
    int64_t id_;
    int lastActive_;
    PollerBase() : lastActive_(-1) {
        static std::atomic<int64_t> id(0);
        id_ = ++id;
    }
    virtual void addChannel(Channel *ch) = 0;//向Poller加入Channel
    virtual void removeChannel(Channel *ch) = 0;//从Poller中移除Channel
    virtual void updateChannel(Channel *ch) = 0;//更新某Channel的状态
    virtual void loop_once(int waitMs) = 0;//监视Channel的状态
    virtual ~PollerBase(){};
};

PollerBase *createPoller();

struct PollerEpoll : public PollerBase {
    int fd_;
    std::set<Channel *> liveChannels_;//连接集合
    // for epoll selected active events
    struct epoll_event activeEvs_[kMaxEvents];//有活动的Channel
    PollerEpoll();
    ~PollerEpoll();
    void addChannel(Channel *ch) override;
    void removeChannel(Channel *ch) override;
    void updateChannel(Channel *ch) override;
    void loop_once(int waitMs) override;
};
```

## Poller的实现

```cpp
PollerBase *createPoller() {
    return new PollerEpoll();
}

PollerEpoll::PollerEpoll() {
    fd_ = epoll_create1(EPOLL_CLOEXEC);//创建一个epoll对象
    fatalif(fd_ < 0, "epoll_create error %d %s", errno, strerror(errno));
    info("poller epoll %d created", fd_);
}

PollerEpoll::~PollerEpoll() {
    info("destroying poller %d", fd_);
    while (liveChannels_.size()) {
        (*liveChannels_.begin())->close();//将所有Channel关闭连接
    }
    ::close(fd_);
    info("poller %d destroyed", fd_);
}

void PollerEpoll::addChannel(Channel *ch) {
    struct epoll_event ev;
    memset(&ev, 0, sizeof(ev));
    ev.events = ch->events();
    ev.data.ptr = ch;
    trace("adding channel %lld fd %d events %d epoll %d", (long long) ch->id(), ch->fd(), ev.events, fd_);
    int r = epoll_ctl(fd_, EPOLL_CTL_ADD, ch->fd(), &ev);
    fatalif(r, "epoll_ctl add failed %d %s", errno, strerror(errno));
    liveChannels_.insert(ch);//加入管理
}

void PollerEpoll::updateChannel(Channel *ch) {
    struct epoll_event ev;
    memset(&ev, 0, sizeof(ev));
    ev.events = ch->events();
    ev.data.ptr = ch;
    trace("modifying channel %lld fd %d events read %d write %d epoll %d", (long long) ch->id(), ch->fd(), ev.events & POLLIN, ev.events & POLLOUT, fd_);
    int r = epoll_ctl(fd_, EPOLL_CTL_MOD, ch->fd(), &ev);//更新Channel的状态
    fatalif(r, "epoll_ctl mod failed %d %s", errno, strerror(errno));
}

void PollerEpoll::removeChannel(Channel *ch) {
    trace("deleting channel %lld fd %d epoll %d", (long long) ch->id(), ch->fd(), fd_);
    liveChannels_.erase(ch);
    for (int i = lastActive_; i >= 0; i--) {
        if (ch == activeEvs_[i].data.ptr) {
            activeEvs_[i].data.ptr = NULL;//删除Channel即可，因为Channel的持有者不是Poller，而是Conn对象。
            break;
        }
    }
}

void PollerEpoll::loop_once(int waitMs) {
    int64_t ticks = util::timeMilli();
    lastActive_ = epoll_wait(fd_, activeEvs_, kMaxEvents, waitMs);
    int64_t used = util::timeMilli() - ticks;
    trace("epoll wait %d return %d errno %d used %lld millsecond", waitMs, lastActive_, errno, (long long) used);
    fatalif(lastActive_ == -1 && errno != EINTR, "epoll return error %d %s", errno, strerror(errno));
    while (--lastActive_ >= 0) {
    	//处理活动Channel的回调过程，这里是一次性处理所有的活动Channel，是否会在这里出现拥塞的可能？<我以前的处理方法是将回调过程封装成task投递到线程池>
        int i = lastActive_;
        Channel *ch = (Channel *) activeEvs_[i].data.ptr;
        int events = activeEvs_[i].events;
        if (ch) {
            if (events & kWriteEvent) {
                trace("channel %lld fd %d handle write", (long long) ch->id(), ch->fd());
                ch->handleWrite();
            }
            if (events & (kReadEvent | POLLERR)) {
                trace("channel %lld fd %d handle read", (long long) ch->id(), ch->fd());
                ch->handleRead();
            }
            if (!(events & (kReadEvent | kWriteEvent | POLLERR))){
                fatal("unexpected poller events");
            }
        }
    }
}
```

# EventBase

## EventBase

```cpp
typedef std::shared_ptr<TcpConn> TcpConnPtr;
typedef std::shared_ptr<TcpServer> TcpServerPtr;
typedef std::function<void(const TcpConnPtr &)> TcpCallBack;
typedef std::function<void(const TcpConnPtr &, Slice msg)> MsgCallBack;

struct EventBases : private noncopyable {
    virtual EventBase *allocBase() = 0;
};

//事件派发器，可管理定时器，连接，超时连接
struct EventBase : public EventBases {
    // taskCapacity指定任务队列的大小，0无限制
    EventBase(int taskCapacity = 0);
    ~EventBase();
    //处理已到期的事件,waitMs表示若无当前需要处理的任务，需要等待的时间
    void loop_once(int waitMs);
    //进入事件处理循环
    void loop();
    //取消定时任务，若timer已经过期，则忽略
    bool cancel(TimerId timerid);
    //添加定时任务，interval=0表示一次性任务，否则为重复任务，时间为毫秒
    TimerId runAt(int64_t milli, const Task &task, int64_t interval = 0) { return runAt(milli, Task(task), interval); }
    TimerId runAt(int64_t milli, Task &&task, int64_t interval = 0);
    TimerId runAfter(int64_t milli, const Task &task, int64_t interval = 0) { return runAt(util::timeMilli() + milli, Task(task), interval); }
    TimerId runAfter(int64_t milli, Task &&task, int64_t interval = 0) { return runAt(util::timeMilli() + milli, std::move(task), interval); }

    //下列函数为线程安全的

    //退出事件循环
    EventBase &exit();
    //是否已退出
    bool exited();
    //唤醒事件处理
    void wakeup();
    //添加任务
    void safeCall(Task &&task);
    void safeCall(const Task &task) { safeCall(Task(task)); }
    //分配一个事件派发器
    virtual EventBase *allocBase() { return this; }

   public:
    std::unique_ptr<EventsImp> imp_;
};

//多线程的事件派发器
struct MultiBase : public EventBases {
    MultiBase(int sz) : id_(0), bases_(sz) {}
    virtual EventBase *allocBase() {
        int c = id_++;
        return &bases_[c % bases_.size()];
    }
    void loop();
    MultiBase &exit() {
        for (auto &b : bases_) {
            b.exit();
        }
        return *this;
    }

   private:
    std::atomic<int> id_;
    std::vector<EventBase> bases_;
};

```

## EventBase的实现

```cpp
EventBase::EventBase(int taskCapacity) {
    imp_.reset(new EventsImp(this, taskCapacity));
    imp_->init();
}

EventBase::~EventBase() {}

EventBase &EventBase::exit() {
    return imp_->exit();
}

bool EventBase::exited() {
    return imp_->exited();
}

void EventBase::safeCall(Task &&task) {
    imp_->safeCall(move(task));
}

void EventBase::wakeup() {
    imp_->wakeup();
}

void EventBase::loop() {
    imp_->loop();
}

void EventBase::loop_once(int waitMs) {
    imp_->loop_once(waitMs);
}

bool EventBase::cancel(TimerId timerid) {
    return imp_ && imp_->cancel(timerid);
}

TimerId EventBase::runAt(int64_t milli, Task &&task, int64_t interval) {
    return imp_->runAt(milli, std::move(task), interval);
}

void MultiBase::loop() {
    int sz = bases_.size();
    vector<thread> ths(sz - 1);
    for (int i = 0; i < sz - 1; i++) {
        thread t([this, i] { bases_[i].loop(); });
        ths[i].swap(t);
    }
    bases_.back().loop();
    for (int i = 0; i < sz - 1; i++) {
        ths[i].join();
    }
}
```

可以看得出来EventBase和MultiBase只是代理类，底层实现是EventsImp，那就来看一看吧。


## EventsImp定义

```cpp
typedef std::unique_ptr<IdleIdImp> IdleId;
typedef std::pair<int64_t, int64_t> TimerId;
```

```cpp
struct TimerRepeatable {
    int64_t at;  // current timer timeout timestamp
    int64_t interval;//task重启的时间间隔
    TimerId timerid;//定时任务ID
    Task cb;//task
};

struct IdleNode {
    TcpConnPtr con_;//连接对象指针
    int64_t updated_;//连接最后活动时间
    TcpCallBack cb_;//连接回调函数
};//空闲连接对象


struct IdleIdImp {
    IdleIdImp() {}
    typedef list<IdleNode>::iterator Iter;
    IdleIdImp(list<IdleNode> *lst, Iter iter) : lst_(lst), iter_(iter) {}
    list<IdleNode> *lst_;//空闲连接所在链表指针
    Iter iter_;//指向空闲连接
};//一个空闲TcpConn的句柄

struct EventsImp {
    EventBase *base_;
    PollerBase *poller_;
    std::atomic<bool> exit_;
    int wakeupFds_[2];
    int nextTimeout_;
    SafeQueue<Task> tasks_;

    std::map<TimerId, TimerRepeatable> timerReps_;  //定时任务重复执行
    std::map<TimerId, Task> timers_;                //定时任务执行一次
    std::atomic<int64_t> timerSeq_;
    // 记录每个idle时间（单位秒）下所有的连接。链表中的所有连接，最新的插入到链表末尾。连接若有活动，会把连接从链表中移到链表尾部，做法参考memcache
    std::map<int, std::list<IdleNode>> idleConns_;//空闲连接池。std::list<IdleNode>保存空闲连接，执行连接超时回调（可能是关闭，可能是保持连接，可能是关闭连接）
    std::set<TcpConnPtr> reconnectConns_;//重连的集合
    bool idleEnabled;

    EventsImp(EventBase *base, int taskCap);
    ~EventsImp();
    void init();
    void callIdles();                   //检测连接超时，对超时的连接调用连接回调
    IdleId registerIdle(int idle, const TcpConnPtr &con, const TcpCallBack &cb);
    void unregisterIdle(const IdleId &id);
    void updateIdle(const IdleId &id);
    void handleTimeouts();
    void refreshNearest(const TimerId *tid = NULL);
    void repeatableTimeout(TimerRepeatable *tr);

    // eventbase functions
    EventBase &exit() {
        exit_ = true;
        wakeup();
        return *base_;
    }
    bool exited() { return exit_; }
    void safeCall(Task &&task) {
        tasks_.push(move(task));
        wakeup();
    }
    void loop();
    void loop_once(int waitMs) {
        poller_->loop_once(std::min(waitMs, nextTimeout_));
        handleTimeouts();
    }
    void wakeup() {
        int r = write(wakeupFds_[1], "", 1);
        fatalif(r <= 0, "write error wd %d %d %s", r, errno, strerror(errno));
    }

    bool cancel(TimerId timerid);
    TimerId runAt(int64_t milli, Task &&task, int64_t interval);
};
```

## EventsImp实现

```cpp
EventsImp::EventsImp(EventBase *base, int taskCap)
    : base_(base), poller_(createPoller()), exit_(false), nextTimeout_(1 << 30), tasks_(taskCap), timerSeq_(0), idleEnabled(false) {
    	//EventBase是依赖poller的，因为epoll分装在poller中。
    	//nextTimeout_初始化为无穷大
    }

void EventsImp::loop() {
    while (!exit_)
        loop_once(10000);//10s
    timerReps_.clear();
    timers_.clear();
    idleConns_.clear();
    for (auto recon : reconnectConns_) {  //重连的连接无法通过channel清理，因此单独清理
        recon->cleanup(recon);
    }
    loop_once(0);
}

void EventsImp::init() {
    int r = pipe(wakeupFds_);//创建管道，用于驱动tasks_的运转
    fatalif(r, "pipe failed %d %s", errno, strerror(errno));
    r = util::addFdFlag(wakeupFds_[0], FD_CLOEXEC);
    fatalif(r, "addFdFlag failed %d %s", errno, strerror(errno));
    r = util::addFdFlag(wakeupFds_[1], FD_CLOEXEC);
    fatalif(r, "addFdFlag failed %d %s", errno, strerror(errno));
    trace("wakeup pipe created %d %d", wakeupFds_[0], wakeupFds_[1]);
    Channel *ch = new Channel(base_, wakeupFds_[0], kReadEvent);
    ch->onRead([=] {
        char buf[1024];
        int r = ch->fd() >= 0 ? ::read(ch->fd(), buf, sizeof buf) : 0;
        if (r > 0) {
            Task task;
            while (tasks_.pop_wait(&task, 0)) {//取出并执行tasks_中的所有任务包
                task();
            }
        } else if (r == 0) {
            delete ch;//关闭管道
        } else if (errno == EINTR) {
            //linux内核2.6以下版本没有自动中断重启功能
        } else {
            fatal("wakeup channel read error %d %d %s", r, errno, strerror(errno));
        }
    });
}

void EventsImp::handleTimeouts() {//扫描超时定时器并执行超时回调
    int64_t now = util::timeMilli();
    TimerId tid{now, 1L << 62};
    while (timers_.size() && timers_.begin()->first < tid) {//将timers_中的超时task执行并移除
        Task task = move(timers_.begin()->second);
        timers_.erase(timers_.begin());
        task();
    }
    refreshNearest();
}

EventsImp::~EventsImp() {
    delete poller_;
    ::close(wakeupFds_[1]);
}

void EventsImp::callIdles() {
    int64_t now = util::timeMilli() / 1000;
    for (auto &l : idleConns_) {
        int idle = l.first;
        auto lst = l.second;
        while (lst.size()) {
            IdleNode &node = lst.front();
            if (node.updated_ + idle > now) {
                break;
            }
            node.updated_ = now;
            lst.splice(lst.end(), lst, lst.begin());    //c++11的链表元素转移操作，没有迭代器非法化
            node.cb_(node.con_);
        }
    }
}

IdleId EventsImp::registerIdle(int idle, const TcpConnPtr &con, const TcpCallBack &cb) {
    if (!idleEnabled) {
        base_->runAfter(1000, [this] { callIdles(); }, 1000);//1000ms之后检测超时，1000为一个检测周期
        idleEnabled = true;//使能空闲队列
    }
    auto &lst = idleConns_[idle];
    lst.push_back(IdleNode{con, util::timeMilli() / 1000, move(cb)});
    trace("register idle");
    return IdleId(new IdleIdImp(&lst, --lst.end()));  //该空闲连接的句柄。
}

void EventsImp::unregisterIdle(const IdleId &id) {
    trace("unregister idle");
    id->lst_->erase(id->iter_);
}

void EventsImp::updateIdle(const IdleId &id) {
    trace("update idle");
    id->iter_->updated_ = util::timeMilli() / 1000;
    id->lst_->splice(id->lst_->end(), *id->lst_, id->iter_);
}

void EventsImp::refreshNearest(const TimerId *tid) {
    if (timers_.empty()) {
        nextTimeout_ = 1 << 30;
    } else {
        const TimerId &t = timers_.begin()->first;
        nextTimeout_ = t.first - util::timeMilli();
        nextTimeout_ = nextTimeout_ < 0 ? 0 : nextTimeout_;//epoll_wait的阻塞时间
    }
}

void EventsImp::repeatableTimeout(TimerRepeatable *tr) {
    tr->at += tr->interval;
    tr->timerid = {tr->at, ++timerSeq_};
    timers_[tr->timerid] = [this, tr] { repeatableTimeout(tr); };
    refreshNearest(&tr->timerid);
    tr->cb();
}

TimerId EventsImp::runAt(int64_t milli, Task &&task, int64_t interval) {
    if (exit_) {
        return TimerId();
    }
    if (interval) {
        TimerId tid{-milli, ++timerSeq_};
        TimerRepeatable &rtr = timerReps_[tid];
        rtr = {milli, interval, {milli, ++timerSeq_}, move(task)};//应当注意这里{milli, ++timerSeq_}是正值时间
        TimerRepeatable *tr = &rtr;
        timers_[tr->timerid] = [this, tr] { repeatableTimeout(tr); };
        refreshNearest(&tr->timerid);
        return tid;
    } else {
        TimerId tid{milli, ++timerSeq_};
        timers_.insert({tid, move(task)});
        refreshNearest(&tid);
        return tid;
    }
}

bool EventsImp::cancel(TimerId timerid) {
    if (timerid.first < 0) {
        auto p = timerReps_.find(timerid);
        auto ptimer = timers_.find(p->second.timerid);
        if (ptimer != timers_.end()) {
            timers_.erase(ptimer);
        }
        timerReps_.erase(p);
        return true;
    } else {
        auto p = timers_.find(timerid);
        if (p != timers_.end()) {
            timers_.erase(p);
            return true;
        }
        return false;
    }
}
```


&emsp;&emsp;连接Conn有超时机制（为了减轻服务器的压力），而是用`map<int, std::list>`可以对超时做等级划分，动态设置连接的超时机制。如当服务器压力大，连接数量多的时候timeOut小一点，反之。 还有TimerRepeatable的定时器任务，其实从实现和抽象逻辑上来看，都是依赖timers_定时器的。


Poller管理底层Channel并处理其回调，EventBase管理逻辑层的TcpConn连接对象。TcpConn是Channel的持有者，具有所有权。