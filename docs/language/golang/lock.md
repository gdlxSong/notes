---
title: Lock
sidebar_position: 6
---



Go 语言作为一个原生支持用户态进程（Goroutine）的语言，当提到并发编程、多线程编程时，往往都离不开锁这一概念。锁是一种并发编程中的同步原语（Synchronization Primitives），它能保证多个 Goroutine 在访问同一片内存时不会出现竞争条件（Race condition）等问题。

本节会介绍 Go 语言中常见的同步原语 sync.Mutex、sync.RWMutex、sync.WaitGroup、sync.Once 和 sync.Cond 以及扩展原语 golang/sync/errgroup.Group、golang/sync/semaphore.Weighted 和 golang/sync/singleflight.Group 的实现原理，同时也会涉及互斥锁、信号量等并发编程中的常见概念。



## 基本原语 

Go 语言在 sync 包中提供了用于同步的一些基本原语，包括常见的 sync.Mutex、sync.RWMutex、sync.WaitGroup、sync.Once 和 sync.Cond：

![golang-basic-sync-primitives.png](/images/golang-basic-sync-primitives.png)



### Mutex #

Go 语言的 sync.Mutex 由两个字段 state 和 sema 组成。其中 state 表示当前互斥锁的状态，而 sema 是用于控制锁状态的信号量。


```go
type Mutex struct {
	state int32
	sema  uint32
}
```

#### 状态

互斥锁的状态比较复杂，如下图所示，最低三位分别表示 mutexLocked、mutexWoken 和 mutexStarving，剩下的位置用来表示当前有多少个 Goroutine 在等待互斥锁的释放：


![golang-mutex-state.png](/images/golang-mutex-state.png)



在默认情况下，互斥锁的所有状态位都是 0，int32 中的不同位分别表示了不同的状态：

- mutexLocked — 表示互斥锁的锁定状态；
- mutexWoken — 表示从正常模式被从唤醒；
- mutexStarving — 当前的互斥锁进入饥饿状态；
- waitersCount — 当前互斥锁上等待的 Goroutine 个数；



#### 正常模式和饥饿模式 

sync.Mutex 有两种模式 — 正常模式和饥饿模式。我们需要在这里先了解正常模式和饥饿模式都是什么以及它们有什么样的关系。

在正常模式下，锁的等待者会按照先进先出的顺序获取锁。但是刚被唤起的 Goroutine 与新创建的 Goroutine 竞争时，大概率会获取不到锁，为了减少这种情况的出现，一旦 Goroutine 超过 1ms 没有获取到锁，它就会将当前互斥锁切换饥饿模式，防止部分 Goroutine 被『饿死』。


![golang-mutex-mode.png](/images/golang-mutex-mode.png)

> 饥饿模式是指多个 Goroutine 同时竞争 Mutex 导致都得不到而产生的 恶性竞争。

饥饿模式是在 Go 语言在 1.9 中通过提交 sync: make Mutex more fair 引入的优化1，引入的目的是保证互斥锁的公平性。

在饥饿模式中，互斥锁会直接交给等待队列最前面的 Goroutine。新的 Goroutine 在该状态下不能获取锁、也不会进入自旋状态，它们只会在队列的末尾等待。如果一个 Goroutine 获得了互斥锁并且它在队列的末尾或者它等待的时间少于 1ms，那么当前的互斥锁就会切换回正常模式。

与饥饿模式相比，正常模式下的互斥锁能够提供更好地性能，饥饿模式的能避免 Goroutine 由于陷入等待无法获取锁而造成的高尾延时。


#### Mutex::Lock

```go
func (m *Mutex) Lock() {
	if atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked) {
		return
	}
	m.lockSlow()
}
```

果互斥锁的状态不是 0 时就会调用 sync.Mutex.lockSlow 尝试通过自旋（Spinnig）等方式等待锁的释放，该方法的主体是一个非常大 for 循环，这里将它分成几个部分介绍获取锁的过程：

- 判断当前 Goroutine 能否进入自旋；
- 通过自旋等待互斥锁的释放；
- 计算互斥锁的最新状态；
- 更新互斥锁的状态并获取锁；









