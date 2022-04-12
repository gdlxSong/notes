---
title: Channel
sidebar_position: 2
---


channel 是 goroutine 之间通信的一种方式，可以类比成 Unix 中的进程的通信方式管道。


### 创建 channel

- 关闭一个未初始化(nil) 的 channel 会产生 panic
- 重复关闭同一个 channel 会产生 panic
- 向一个已关闭的 channel 中发送消息会产生 panic
- 从已关闭的 channel 读取消息不会产生 panic，且能读出 channel 中还未被读取的消息，若消息均已读出，则会读到类型的零值。从一个已关闭的 channel 中读取消息永远不会阻塞，并且会返回一个为 false 的 ok-idiom，可以用它来判断 channel 是否关闭。
- 关闭 channel 会产生一个广播机制，所有向 channel 读取消息的 goroutine 都会收到消息


### channel 类型

> channel 分为不带缓存的 channel 和带缓存的 channel。

- 从无缓存的 channel 中读取消息会阻塞，直到有 goroutine 向该 channel 中发送消息；同理，向无缓存的 channel 中发送消息也会阻塞，直到有 goroutine 从 channel 中读取消息。
- 有缓存的 channel 类似一个阻塞队列(采用环形数组实现)。当缓存未满时，向 channel 中发送消息时不会阻塞，当缓存满时，发送操作将被阻塞，直到有其他 goroutine 从中读取消息；相应的，当 channel 中消息不为空时，读取消息不会出现阻塞，当 channel 为空时，读取操作会造成阻塞，直到有 goroutine 向 channel 中写入消息。

> 通过 len 函数可以获得 chan 中的元素个数，通过 cap 函数可以得到 channel 的缓存长度。



### channel 用法

```go
// 1. 使用 ok-idiom 读取并判断 channel 是否关闭。
val, ok := <- ch

// 2. 使用range 读取channel.
for val := range <-ch {
    // todo somthing.
}

// 3. 配合 select 使用.
select {
    case <-ch1:
    case <-ch2:
    default:
}
```



- select 可以同时监听多个 channel 的写入或读取
- 执行 select 时，若只有一个 case 通过(不阻塞)，则执行这个 case 块
- 若有多个 case 通过，则随机挑选一个 case 执行
- 若所有 case 均阻塞，且定义了 default 模块，则执行 default 模块。若未定义 default 模块，则 select 语句阻塞，直到有 case 被唤醒。
- 使用 break 会跳出 select 块。



## channel 源码分析


```go
// channel 类型定义
type hchan struct {
    // channel 中的元素数量, len
    qcount   uint           // total data in the queue
    // channel 的大小, cap
    dataqsiz uint           // size of the circular queue
    // channel 的缓冲区，环形数组实现
    buf      unsafe.Pointer // points to an array of dataqsiz elements
    // 单个元素的大小
    elemsize uint16
    // closed 标志位
    closed   uint32
    // 元素的类型
    elemtype *_type // element type
    // send 和 recieve 的索引，用于实现环形数组队列
    sendx    uint   // send index
    recvx    uint   // receive index
    // recv goroutine 等待队列
    recvq    waitq  // list of recv waiters
    // send goroutine 等待队列
    sendq    waitq  // list of send waiters
    // lock protects all fields in hchan, as well as several
    // fields in sudogs blocked on this channel.
    //
    // Do not change another G's status while holding this lock
    // (in particular, do not ready a G), as this can deadlock
    // with stack shrinking.
    lock mutex
}

// 等待队列的链表实现
type waitq struct {    
    first *sudog       
    last  *sudog       
}

// in src/runtime/runtime2.go
// 对 G 的封装
type sudog struct {
    // The following fields are protected by the hchan.lock of the
    // channel this sudog is blocking on. shrinkstack depends on
    // this for sudogs involved in channel ops.
    g          *g
    selectdone *uint32 // CAS to 1 to win select race (may point to stack)
    next       *sudog
    prev       *sudog
    elem       unsafe.Pointer // data element (may point to stack)
    // The following fields are never accessed concurrently.
    // For channels, waitlink is only accessed by g.
    // For semaphores, all fields (including the ones above)
    // are only accessed when holding a semaRoot lock.
    acquiretime int64
    releasetime int64
    ticket      uint32
    parent      *sudog // semaRoot binary tree
    waitlink    *sudog // g.waiting list or semaRoot
    waittail    *sudog // semaRoot
    c           *hchan // channel
}
```


### make chan

Go 语言中所有 Channel 的创建都会使用 make 关键字。编译器会将 make(chan int, 10) 表达式转换成 OMAKE 类型的节点，并在类型检查阶段将 OMAKE 类型的节点转换成 OMAKECHAN 类型：

```go
func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	case OMAKE:
		...
		switch t.Etype {
		case TCHAN:
			l = nil
			if i < len(args) { // 带缓冲区的异步 Channel
				...
				n.Left = l
			} else { // 不带缓冲区的同步 Channel
				n.Left = nodintconst(0)
			}
			n.Op = OMAKECHAN
		}
	}
}
```


运行时创建 chan 实例：

```go
func makechan(t *chantype, size int64) *hchan {
    elem := t.elem

    // compiler checks this but be safe.
    if elem.size >= 1<<16 {
        throw("makechan: invalid channel element type")
    }
    if hchanSize%maxAlign != 0 || elem.align > maxAlign {
        throw("makechan: bad alignment")
    }
    if size < 0 || int64(uintptr(size)) != size || (elem.size > 0 && uintptr(size) > (_MaxMem-hchanSize)/elem.size) {
        panic(plainError("makechan: size out of range"))
    }

    var c *hchan
    
    if elem.kind&kindNoPointers != 0 || size == 0 {
        // case 1: channel 不含有指针
        // case 2: size == 0，即无缓冲 channel
        // Allocate memory in one call.
        // Hchan does not contain pointers interesting for GC in this case:
        // buf points into the same allocation, elemtype is persistent.
        // SudoG's are referenced from their owning thread so they can't be collected.
        // TODO(dvyukov,rlh): Rethink when collector can move allocated objects.
        
        // 在堆上分配连续的空间用作 channel
        c = (*hchan)(mallocgc(hchanSize+uintptr(size)*elem.size, nil, true))
        if size > 0 && elem.size != 0 {
            c.buf = add(unsafe.Pointer(c), hchanSize)
        } else {
            // race detector uses this location for synchronization
            // Also prevents us from pointing beyond the allocation (see issue 9401).
            c.buf = unsafe.Pointer(c)
        }
    } else {
        // 有缓冲 channel 初始化
        c = new(hchan)
        // 堆上分配 buf 内存
        c.buf = newarray(elem, int(size))
    }
    c.elemsize = uint16(elem.size)
    c.elemtype = elem
    c.dataqsiz = uint(size)

    if debugChan {
        print("makechan: chan=", c, "; elemsize=", elem.size, "; elemalg=", elem.alg, "; dataqsiz=", size, "\n")
    }
    return c
}
```

> make 的过程还比较简单，需要注意一点的是当元素不含指针或者chan无缓冲的时候，会将整个 hchan 分配成一个连续的空间。


### chan send

```go
// entry point for c <- x from compiled code
//go:nosplit
func chansend1(c *hchan, elem unsafe.Pointer) {
    chansend(c, elem, true, getcallerpc(unsafe.Pointer(&c)))
}

/*
 * generic single channel send/recv
 * If block is not nil,
 * then the protocol will not
 * sleep but return if it could
 * not complete.
 *
 * sleep can wake up with g.param == nil
 * when a channel involved in the sleep has
 * been closed.  it is easiest to loop and re-run
 * the operation; we'll see that it's now closed.
 */
func chansend(c *hchan, ep unsafe.Pointer, block bool, callerpc uintptr) bool {
    // 前面章节说道的，当 channel 未初始化或为 nil 时，向其中发送数据将会永久阻塞
    if c == nil {
        if !block {
            return false
        }
        
        // gopark 会使当前 goroutine 休眠，并通过 unlockf 唤醒，但是此时传入的 unlockf 为 nil, 因此，goroutine 会一直休眠
        gopark(nil, nil, "chan send (nil chan)", traceEvGoStop, 2)
        throw("unreachable")
    }

    if debugChan {
        print("chansend: chan=", c, "\n")
    }

    if raceenabled {
        racereadpc(unsafe.Pointer(c), callerpc, funcPC(chansend))
    }

    // Fast path: check for failed non-blocking operation without acquiring the lock.
    //
    // After observing that the channel is not closed, we observe that the channel is
    // not ready for sending. Each of these observations is a single word-sized read
    // (first c.closed and second c.recvq.first or c.qcount depending on kind of channel).
    // Because a closed channel cannot transition from 'ready for sending' to
    // 'not ready for sending', even if the channel is closed between the two observations,
    // they imply a moment between the two when the channel was both not yet closed
    // and not ready for sending. We behave as if we observed the channel at that moment,
    // and report that the send cannot proceed.
    //
    // It is okay if the reads are reordered here: if we observe that the channel is not
    // ready for sending and then observe that it is not closed, that implies that the
    // channel wasn't closed during the first observation.
    if !block && c.closed == 0 && ((c.dataqsiz == 0 && c.recvq.first == nil) ||
        (c.dataqsiz > 0 && c.qcount == c.dataqsiz)) {
        return false
    }

    var t0 int64
    if blockprofilerate > 0 {
        t0 = cputicks()
    }

    // 获取同步锁
    lock(&c.lock)

    // 之前章节提过，向已经关闭的 channel 发送消息会产生 panic
    if c.closed != 0 {
        unlock(&c.lock)
        panic(plainError("send on closed channel"))
    }

    // CASE1: 当有 goroutine 在 recv 队列上等待时，跳过缓存队列，将消息直接发给 reciever goroutine
    if sg := c.recvq.dequeue(); sg != nil {
        // Found a waiting receiver. We pass the value we want to send
        // directly to the receiver, bypassing the channel buffer (if any).
        send(c, sg, ep, func() { unlock(&c.lock) }, 3)
        return true
    }

    // CASE2: 缓存队列未满，则将消息复制到缓存队列上
    if c.qcount < c.dataqsiz {
        // Space is available in the channel buffer. Enqueue the element to send.
        qp := chanbuf(c, c.sendx)
        if raceenabled {
            raceacquire(qp)
            racerelease(qp)
        }
        typedmemmove(c.elemtype, qp, ep)
        c.sendx++
        if c.sendx == c.dataqsiz {
            c.sendx = 0
        }
        c.qcount++
        unlock(&c.lock)
        return true
    }

    if !block {
        unlock(&c.lock)
        return false
    }
    
    // CASE3: 缓存队列已满，将goroutine 加入 send 队列
    // 初始化 sudog
    // Block on the channel. Some receiver will complete our operation for us.
    gp := getg()
    mysg := acquireSudog()
    mysg.releasetime = 0
    if t0 != 0 {
        mysg.releasetime = -1
    }
    // No stack splits between assigning elem and enqueuing mysg
    // on gp.waiting where copystack can find it.
    mysg.elem = ep
    mysg.waitlink = nil
    mysg.g = gp
    mysg.selectdone = nil
    mysg.c = c
    gp.waiting = mysg
    gp.param = nil
    // 加入队列
    c.sendq.enqueue(mysg)
    // 休眠
    goparkunlock(&c.lock, "chan send", traceEvGoBlockSend, 3)

    // 唤醒 goroutine
    // someone woke us up.
    if mysg != gp.waiting {
        throw("G waiting list is corrupted")
    }
    gp.waiting = nil
    if gp.param == nil {
        if c.closed == 0 {
            throw("chansend: spurious wakeup")
        }
        panic(plainError("send on closed channel"))
    }
    gp.param = nil
    if mysg.releasetime > 0 {
        blockevent(mysg.releasetime-t0, 2)
    }
    mysg.c = nil
    releaseSudog(mysg)
    return true
}
```


- 有 goroutine 阻塞在 channel recv 队列上，此时缓存队列为空，直接将消息发送给 reciever goroutine,只产生一次复制
- 当 channel 缓存队列有剩余空间时，将数据放到队列里，等待接收，接收后总共产生两次复制
- 当 channel 缓存队列已满时，将当前 goroutine 加入 send 队列并阻塞。





### chan recv


```go 
// entry points for <- c from compiled code
//go:nosplit
func chanrecv1(c *hchan, elem unsafe.Pointer) {
    chanrecv(c, elem, true)
}

//go:nosplit
func chanrecv2(c *hchan, elem unsafe.Pointer) (received bool) {
    _, received = chanrecv(c, elem, true)
    return
}

// chanrecv receives on channel c and writes the received data to ep.
// ep may be nil, in which case received data is ignored.
// If block == false and no elements are available, returns (false, false).
// Otherwise, if c is closed, zeros *ep and returns (true, false).
// Otherwise, fills in *ep with an element and returns (true, true).
// A non-nil ep must point to the heap or the caller's stack.
func chanrecv(c *hchan, ep unsafe.Pointer, block bool) (selected, received bool) {
    // raceenabled: don't need to check ep, as it is always on the stack
    // or is new memory allocated by reflect.

    if debugChan {
        print("chanrecv: chan=", c, "\n")
    }

    // 从 nil 的 channel 中接收消息，永久阻塞
    if c == nil {
        if !block {
            return
        }
        gopark(nil, nil, "chan receive (nil chan)", traceEvGoStop, 2)
        throw("unreachable")
    }

    // Fast path: check for failed non-blocking operation without acquiring the lock.
    //
    // After observing that the channel is not ready for receiving, we observe that the
    // channel is not closed. Each of these observations is a single word-sized read
    // (first c.sendq.first or c.qcount, and second c.closed).
    // Because a channel cannot be reopened, the later observation of the channel
    // being not closed implies that it was also not closed at the moment of the
    // first observation. We behave as if we observed the channel at that moment
    // and report that the receive cannot proceed.
    //
    // The order of operations is important here: reversing the operations can lead to
    // incorrect behavior when racing with a close.
    if !block && (c.dataqsiz == 0 && c.sendq.first == nil ||
        c.dataqsiz > 0 && atomic.Loaduint(&c.qcount) == 0) &&
        atomic.Load(&c.closed) == 0 {
        return
    }

    var t0 int64
    if blockprofilerate > 0 {
        t0 = cputicks()
    }

    lock(&c.lock)
    
    // CASE1: 从已经 close 且为空的 channel recv 数据，返回空值
    if c.closed != 0 && c.qcount == 0 {
        if raceenabled {
            raceacquire(unsafe.Pointer(c))
        }
        unlock(&c.lock)
        if ep != nil {
            typedmemclr(c.elemtype, ep)
        }
        return true, false
    }

    // CASE2: send 队列不为空
    // CASE2.1: 缓存队列为空，直接从 sender recv 元素
    // CASE2.2: 缓存队列不为空，此时只有可能是缓存队列已满，从队列头取出元素，并唤醒 sender 将元素写入缓存队列尾部。由于为环形队列，因此，队列满时只需要将队列头复制给 reciever，同时将 sender 元素复制到该位置，并移动队列头尾索引，不需要移动队列元素
    if sg := c.sendq.dequeue(); sg != nil {
        // Found a waiting sender. If buffer is size 0, receive value
        // directly from sender. Otherwise, receive from head of queue
        // and add sender's value to the tail of the queue (both map to
        // the same buffer slot because the queue is full).
        recv(c, sg, ep, func() { unlock(&c.lock) }, 3)
        return true, true
    }

    // CASE3: 缓存队列不为空，直接从队列取元素，移动头索引
    if c.qcount > 0 {
        // Receive directly from queue
        qp := chanbuf(c, c.recvx)
        if raceenabled {
            raceacquire(qp)
            racerelease(qp)
        }
        if ep != nil {
            typedmemmove(c.elemtype, ep, qp)
        }
        typedmemclr(c.elemtype, qp)
        c.recvx++
        if c.recvx == c.dataqsiz {
            c.recvx = 0
        }
        c.qcount--
        unlock(&c.lock)
        return true, true
    }
    
    if !block {
        unlock(&c.lock)
        return false, false
    }
    
    // CASE4: 缓存队列为空，将 goroutine 加入 recv 队列，并阻塞
    // no sender available: block on this channel.
    gp := getg()
    mysg := acquireSudog()
    mysg.releasetime = 0
    if t0 != 0 {
        mysg.releasetime = -1
    }
    // No stack splits between assigning elem and enqueuing mysg
    // on gp.waiting where copystack can find it.
    mysg.elem = ep
    mysg.waitlink = nil
    gp.waiting = mysg
    mysg.g = gp
    mysg.selectdone = nil
    mysg.c = c
    gp.param = nil
    c.recvq.enqueue(mysg)
    goparkunlock(&c.lock, "chan receive", traceEvGoBlockRecv, 3)

    // someone woke us up
    if mysg != gp.waiting {
        throw("G waiting list is corrupted")
    }
    gp.waiting = nil
    if mysg.releasetime > 0 {
        blockevent(mysg.releasetime-t0, 2)
    }
    closed := gp.param == nil
    gp.param = nil
    mysg.c = nil
    releaseSudog(mysg)
    return true, !closed
}
```




### chan close

```go 
func closechan(c *hchan) {
    if c == nil {
        panic(plainError("close of nil channel"))
    }

    lock(&c.lock)
    
    // 重复 close，产生 panic
    if c.closed != 0 {
        unlock(&c.lock)
        panic(plainError("close of closed channel"))
    }

    if raceenabled {
        callerpc := getcallerpc(unsafe.Pointer(&c))
        racewritepc(unsafe.Pointer(c), callerpc, funcPC(closechan))
        racerelease(unsafe.Pointer(c))
    }

    c.closed = 1

    var glist *g

    // 唤醒所有 reciever
    // release all readers
    for {
        sg := c.recvq.dequeue()
        if sg == nil {
            break
        }
        if sg.elem != nil {
            typedmemclr(c.elemtype, sg.elem)
            sg.elem = nil
        }
        if sg.releasetime != 0 {
            sg.releasetime = cputicks()
        }
        gp := sg.g
        gp.param = nil
        if raceenabled {
            raceacquireg(gp, unsafe.Pointer(c))
        }
        gp.schedlink.set(glist)
        glist = gp
    }

    // 唤醒所有 sender，并产生 panic
    // release all writers (they will panic)
    for {
        sg := c.sendq.dequeue()
        if sg == nil {
            break
        }
        sg.elem = nil
        if sg.releasetime != 0 {
            sg.releasetime = cputicks()
        }
        gp := sg.g
        gp.param = nil
        if raceenabled {
            raceacquireg(gp, unsafe.Pointer(c))
        }
        gp.schedlink.set(glist)
        glist = gp
    }
    unlock(&c.lock)

    // Ready all Gs now that we've dropped the channel lock.
    for glist != nil {
        gp := glist
        glist = glist.schedlink.ptr()
        gp.schedlink = 0
        goready(gp, 3)
    }
}
```



### Goroutine Pause/Resume

- 当 sender goroutine 阻塞，我们将 此 goroutine 封装为 sudog 挂载在 channel 的sendq 队列中，等待 recv 事件触发唤醒。同时 GPM 模型中 M 会从P的runqueue中选择一个 G 继续执行。
- 当 receiver goroutine 阻塞，我们将 此 goroutine 封装为 sudog 挂载在 channel 的 recvq 队列中，等待 send 事件触发唤醒。同时 GPM 模型中 M 会从P的runqueue中选择一个 G 继续执行。








## Reference

- https://www.jianshu.com/p/24ede9e90490
- https://zhuanlan.zhihu.com/p/27917262
- https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-channel/

