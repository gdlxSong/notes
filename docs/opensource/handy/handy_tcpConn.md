---
title: "handy的TcpConn模块解析"
date: 2020-05-01T11:22:20+08:00
lastmod: 2020-05-01T11:22:20+08:00
description: ""
tags: ["源码分析", "handy", "cpp", "cpp11"]
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
// Tcp连接，使用引用计数
struct TcpConn : public std::enable_shared_from_this<TcpConn>, private noncopyable {//继承enable_shared_from_this，已实现引用计数shared_from_this();
    // Tcp连接的个状态
    enum State {
        Invalid = 1,
        Handshaking,
        Connected,
        Closed,
        Failed,
    };
    // Tcp构造函数，实际可用的连接应当通过createConnection创建
    TcpConn();
    virtual ~TcpConn();
    //可传入连接类型，返回智能指针
    template <class C = TcpConn>
    static TcpConnPtr createConnection(EventBase *base, const std::string &host, unsigned short port, int timeout = 0, const std::string &localip = "") {
        TcpConnPtr con(new C);
        con->connect(base, host, port, timeout, localip);
        return con;
    }
    template <class C = TcpConn>
    static TcpConnPtr createConnection(EventBase *base, int fd, Ip4Addr local, Ip4Addr peer) {
        TcpConnPtr con(new C);
        con->attach(base, fd, local, peer);
        return con;
    }

    bool isClient() { return destPort_ > 0; }
    // automatically managed context. allocated when first used, deleted when destruct
    template <class T>
    T &context() {
        return ctx_.context<T>();
    }

    EventBase *getBase() { return base_; }
    State getState() { return state_; }
    // TcpConn的输入输出缓冲区
    Buffer &getInput() { return input_; }
    Buffer &getOutput() { return output_; }

    Channel *getChannel() { return channel_; }
    bool writable() { return channel_ ? channel_->writeEnabled() : false; }

    //发送数据
    void sendOutput() { send(output_); }
    void send(Buffer &msg);
    void send(const char *buf, size_t len);
    void send(const std::string &s) { send(s.data(), s.size()); }
    void send(const char *s) { send(s, strlen(s)); }

    //数据到达时回调
    void onRead(const TcpCallBack &cb) {
        assert(!readcb_);
        readcb_ = cb;
    };
    //当tcp缓冲区可写时回调
    void onWritable(const TcpCallBack &cb) { writablecb_ = cb; }
    // tcp状态改变时回调
    void onState(const TcpCallBack &cb) { statecb_ = cb; }
    // tcp空闲回调
    void addIdleCB(int idle, const TcpCallBack &cb);

    //消息回调，此回调与onRead回调冲突，只能够调用一个
    // codec所有权交给onMsg
    void onMsg(CodecBase *codec, const MsgCallBack &cb);
    //发送消息
    void sendMsg(Slice msg);

    // conn会在下个事件周期进行处理
    void close();
    //设置重连时间间隔，-1: 不重连，0:立即重连，其它：等待毫秒数，未设置不重连
    void setReconnectInterval(int milli) { reconnectInterval_ = milli; }

    //!慎用。立即关闭连接，清理相关资源，可能导致该连接的引用计数变为0，从而使当前调用者引用的连接被析构
    void closeNow() {
        if (channel_)
            channel_->close();
    }

    //远程地址的字符串
    std::string str() { return peer_.toString(); }

   public:
    EventBase *base_;//所属EventBase
    Channel *channel_;//底层Channel
    Buffer input_, output_;//读写缓冲区
    Ip4Addr local_, peer_;
    State state_;//连接对象的状态
    TcpCallBack readcb_, writablecb_, statecb_;//回调
    std::list<IdleId> idleIds_;//空闲句柄
    TimerId timeoutId_;//ID
    AutoContext ctx_, internalCtx_;//上下文环境
    std::string destHost_, localIp_;
    int destPort_, connectTimeout_, reconnectInterval_;
    int64_t connectedTime_;//连接的时时间戳
    std::unique_ptr<CodecBase> codec_;
    void handleRead(const TcpConnPtr &con);
    void handleWrite(const TcpConnPtr &con);
    ssize_t isend(const char *buf, size_t len);//对send的包裹函数，处理非阻塞和中断errno
    void cleanup(const TcpConnPtr &con);//清理旧连接资源
    void connect(EventBase *base, const std::string &host, unsigned short port, int timeout, const std::string &localip);//非阻塞connect，异步检测连接状态(timeout)
    void reconnect();
    void attach(EventBase *base, int fd, Ip4Addr local, Ip4Addr peer);//将连接投入eventBase管理起来
    virtual int readImp(int fd, void *buf, size_t bytes) { return ::read(fd, buf, bytes); }
    virtual int writeImp(int fd, const void *buf, size_t bytes) { return ::write(fd, buf, bytes); }
    virtual int handleHandshake(const TcpConnPtr &con);//异步检测连接状态
};
```


```cpp

TcpConn::TcpConn()
    : base_(NULL), channel_(NULL), state_(State::Invalid), destPort_(-1), connectTimeout_(0), reconnectInterval_(-1), connectedTime_(util::timeMilli()) {}

TcpConn::~TcpConn() {
    trace("tcp destroyed %s - %s", local_.toString().c_str(), peer_.toString().c_str());
    delete channel_;
}

void TcpConn::addIdleCB(int idle, const TcpCallBack &cb) {
    if (channel_) {
        idleIds_.push_back(getBase()->imp_->registerIdle(idle, shared_from_this(), cb));//加入空闲管理
    }
}

void TcpConn::reconnect() {
    auto con = shared_from_this();
    getBase()->imp_->reconnectConns_.insert(con);//保留
    long long interval = reconnectInterval_ - (util::timeMilli() - connectedTime_);
    interval = interval > 0 ? interval : 0;
    info("reconnect interval: %d will reconnect after %lld ms", reconnectInterval_, interval);
    getBase()->runAfter(interval, [this, con]() {
        getBase()->imp_->reconnectConns_.erase(con);
        connect(getBase(), destHost_, (unsigned short) destPort_, connectTimeout_, localIp_);
    });
    delete channel_;
    channel_ = NULL;
}
void TcpConn::attach(EventBase *base, int fd, Ip4Addr local, Ip4Addr peer) {
    fatalif((destPort_ <= 0 && state_ != State::Invalid) || (destPort_ >= 0 && state_ != State::Handshaking),
            "you should use a new TcpConn to attach. state: %d", state_);
    base_ = base;
    state_ = State::Handshaking;
    local_ = local;
    peer_ = peer;
    delete channel_;
    channel_ = new Channel(base, fd, kWriteEvent | kReadEvent);//初始化管道可读可写
    trace("tcp constructed %s - %s fd: %d", local_.toString().c_str(), peer_.toString().c_str(), fd);
    TcpConnPtr con = shared_from_this();
    con->channel_->onRead([=] { con->handleRead(con); });
    con->channel_->onWrite([=] { con->handleWrite(con); });
}

void TcpConn::connect(EventBase *base, const string &host, unsigned short port, int timeout, const string &localip) {
    fatalif(state_ != State::Invalid && state_ != State::Closed && state_ != State::Failed, "current state is bad state to connect. state: %d", state_);
    destHost_ = host;
    destPort_ = port;
    connectTimeout_ = timeout;
    connectedTime_ = util::timeMilli();
    localIp_ = localip;
    Ip4Addr addr(host, port);
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    fatalif(fd < 0, "socket failed %d %s", errno, strerror(errno));
    net::setNonBlock(fd);
    int t = util::addFdFlag(fd, FD_CLOEXEC);//子进程关闭此fd
    fatalif(t, "addFdFlag FD_CLOEXEC failed %d %s", t, strerror(t));
    int r = 0;
    if (localip.size()) {
        Ip4Addr addr(localip, 0);
        r = ::bind(fd, (struct sockaddr *) &addr.getAddr(), sizeof(struct sockaddr));
        error("bind to %s failed error %d %s", addr.toString().c_str(), errno, strerror(errno));
    }
    if (r == 0) {
        r = ::connect(fd, (sockaddr *) &addr.getAddr(), sizeof(sockaddr_in));
        if (r != 0 && errno != EINPROGRESS) {
            error("connect to %s error %d %s", addr.toString().c_str(), errno, strerror(errno));
        }
    }

    sockaddr_in local;
    socklen_t alen = sizeof(local);
    if (r == 0) {
        r = getsockname(fd, (sockaddr *) &local, &alen);
        if (r < 0) {
            error("getsockname failed %d %s", errno, strerror(errno));
        }
    }
    state_ = State::Handshaking;
    attach(base, fd, Ip4Addr(local), addr);
    if (timeout) {//非阻塞连接超时，如果超过timeout时间连接状态还没有转换到Connected，即关闭Channel的物理连接
        TcpConnPtr con = shared_from_this();
        timeoutId_ = base->runAfter(timeout, [con] {
            if (con->getState() == Handshaking) {
                con->channel_->close();
            }
        });
    }
}

void TcpConn::close() {
    if (channel_) {
        TcpConnPtr con = shared_from_this();
        getBase()->safeCall([con] {
            if (con->channel_)
                con->channel_->close();
        });
    }
}

void TcpConn::cleanup(const TcpConnPtr &con) {
    if (readcb_ && input_.size()) {
        readcb_(con);
    }
    if (state_ == State::Handshaking) {
        state_ = State::Failed;
    } else {
        state_ = State::Closed;
    }
    trace("tcp closing %s - %s fd %d %d", local_.toString().c_str(), peer_.toString().c_str(), channel_ ? channel_->fd() : -1, errno);
    getBase()->cancel(timeoutId_);
    if (statecb_) {
        statecb_(con);
    }
    if (reconnectInterval_ >= 0 && !getBase()->exited()) {  // reconnect
        reconnect();
        return;
    }
    for (auto &idle : idleIds_) {
        handyUnregisterIdle(getBase(), idle);
    }
    // channel may have hold TcpConnPtr, set channel_ to NULL before delete
    readcb_ = writablecb_ = statecb_ = nullptr;
    Channel *ch = channel_;
    channel_ = NULL;
    delete ch;
}

void TcpConn::handleRead(const TcpConnPtr &con) {
    if (state_ == State::Handshaking && handleHandshake(con)) {
        return;
    }
    while (state_ == State::Connected) {
        input_.makeRoom();
        int rd = 0;
        if (channel_->fd() >= 0) {
            rd = readImp(channel_->fd(), input_.end(), input_.space());
            trace("channel %lld fd %d readed %d bytes", (long long) channel_->id(), channel_->fd(), rd);
        }
        if (rd == -1 && errno == EINTR) {//如果读回调被中断，手动重启
            continue;
        } else if (rd == -1 && (errno == EAGAIN || errno == EWOULDBLOCK)) {//读完了
            for (auto &idle : idleIds_) {//更新所有连接的最后活动时间
                handyUpdateIdle(getBase(), idle);
            }
            if (readcb_ && input_.size()) {//连接读回调
                readcb_(con);
            }
            break;
        } else if (channel_->fd() == -1 || rd == 0 || rd == -1) {//这里的-1和Channel::close()耦合优点严重
            cleanup(con);
            break;
        } else {  // rd > 0
            input_.addSize(rd);
        }
    }
}

int TcpConn::handleHandshake(const TcpConnPtr &con) {
    fatalif(state_ != Handshaking, "handleHandshaking called when state_=%d", state_);
    struct pollfd pfd;
    pfd.fd = channel_->fd();
    pfd.events = POLLOUT | POLLERR;//使用poll来检测fd的状态
    int r = poll(&pfd, 1, 0);
    if (r == 1 && pfd.revents == POLLOUT) {
        channel_->enableReadWrite(true, false);
        state_ = State::Connected;
        if (state_ == State::Connected) {
            connectedTime_ = util::timeMilli();
            trace("tcp connected %s - %s fd %d", local_.toString().c_str(), peer_.toString().c_str(), channel_->fd());
            if (statecb_) {
                statecb_(con);
            }
        }
    } else {
        trace("poll fd %d return %d revents %d", channel_->fd(), r, pfd.revents);
        cleanup(con);
        return -1;
    }
    return 0;
}

void TcpConn::handleWrite(const TcpConnPtr &con) {
    if (state_ == State::Handshaking) {
        handleHandshake(con);
    } else if (state_ == State::Connected) {
        ssize_t sended = isend(output_.begin(), output_.size());//尽可能的发送数据
        output_.consume(sended);
        if (output_.empty() && writablecb_) {
            writablecb_(con);
        }
        if (output_.empty() && channel_->writeEnabled()) {  // writablecb_ may write something
            channel_->enableWrite(false);
        }
    } else {
        error("handle write unexpected");
    }
}

ssize_t TcpConn::isend(const char *buf, size_t len) {//尽可能的发送多的数据
    size_t sended = 0;
    while (len > sended) {
        ssize_t wd = writeImp(channel_->fd(), buf + sended, len - sended);
        trace("channel %lld fd %d write %ld bytes", (long long) channel_->id(), channel_->fd(), wd);
        if (wd > 0) {
            sended += wd;
            continue;
        } else if (wd == -1 && errno == EINTR) {
            continue;
        } else if (wd == -1 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
            if (!channel_->writeEnabled()) {
                channel_->enableWrite(true);
            }
            break;
        } else {
            error("write error: channel %lld fd %d wd %ld %d %s", (long long) channel_->id(), channel_->fd(), wd, errno, strerror(errno));
            break;
        }
    }
    return sended;
}

void TcpConn::send(Buffer &buf) {
    if (channel_) {
        if (channel_->writeEnabled()) {  // just full
            output_.absorb(buf);    //absorb会清空buf，现将数据转到输出缓冲区（TcpConn），说明写数据的发送是异步的
        }
        if (buf.size()) {//如果没有清空
            ssize_t sended = isend(buf.begin(), buf.size());
            buf.consume(sended);
        }
        if (buf.size()) {
            output_.absorb(buf);
            if (!channel_->writeEnabled()) {
                channel_->enableWrite(true);
            }
        }
    } else {
        warn("connection %s - %s closed, but still writing %lu bytes", local_.toString().c_str(), peer_.toString().c_str(), buf.size());
    }
}

void TcpConn::send(const char *buf, size_t len) {
    if (channel_) {
        if (output_.empty()) {
            ssize_t sended = isend(buf, len);
            buf += sended;
            len -= sended;
        }
        if (len) {
            output_.append(buf, len);
        }
    } else {
        warn("connection %s - %s closed, but still writing %lu bytes", local_.toString().c_str(), peer_.toString().c_str(), len);
    }
}

void TcpConn::onMsg(CodecBase *codec, const MsgCallBack &cb) {
    assert(!readcb_);
    codec_.reset(codec);
    onRead([cb](const TcpConnPtr &con) {
        int r = 1;
        while (r) {
            Slice msg;
            r = con->codec_->tryDecode(con->getInput(), msg);
            if (r < 0) {
                con->channel_->close();
                break;
            } else if (r > 0) {
                trace("a msg decoded. origin len %d msg len %ld", r, msg.size());
                cb(con, msg);
                con->getInput().consume(r);
            }
        }
    });
}

void TcpConn::sendMsg(Slice msg) {
    codec_->encode(msg, getOutput());
    sendOutput();
}

```



1. Q：TcpConn和Channel是如何交互的？

	- 对于TcpConn->Channel而言很好理解，TcpConn是Channel的持有者，可以直接通过Channel暴露的接口控制其行为，如TcpConn::attach。对于Channel->TcpConn而言，Channel通过TcpConn对Channel设置的回调过程来实现对TcpConn的反馈，因为Channel的回调callback对象中包含TcpConn对象的引用。如Channel::close， 其最后调用
		```cpp
		//Channel::close
	    fd_ = -1;
	    handleRead();
	    //其中handleRead()回调由TcpConn设置的读回调，读回调中包含TcpConn对象的引用。
		```
		```cpp
		//TcpConn::attach
		TcpConnPtr con = shared_from_this();
	    con->channel_->onRead([=] { con->handleRead(con); });
	    con->channel_->onWrite([=] { con->handleWrite(con); });
		```