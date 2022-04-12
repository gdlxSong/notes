---
title: Context
sidebar_position: 8
---

> docs: https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-context/



context.Context 是 Go 语言在 1.7 版本中引入标准库的接口1，该接口定义了四个需要实现的方法，其中包括：

- Deadline — 返回 context.Context 被取消的时间，也就是完成工作的截止日期；
- Done — 返回一个 Channel，这个 Channel 会在当前工作完成或者上下文被取消后关闭，多次调用 Done 方法会返回同一个 Channel；
- Err — 返回 context.Context 结束的原因，它只会在 Done 方法对应的 Channel 关闭时返回非空的值；
- - 如果 context.Context 被取消，会返回 Canceled 错误；
- - 如果 context.Context 超时，会返回 DeadlineExceeded 错误；
- Value — 从 context.Context 中获取键对应的值，对于同一个上下文来说，多次调用 Value 并传入相同的 Key 会返回相同的结果，该方法可以用来传递请求特定的数据；

```go
type Context interface {
	Deadline() (deadline time.Time, ok bool)
	Done() <-chan struct{}
	Err() error
	Value(key interface{}) interface{}
}
```


## 设计原理

在 Goroutine 构成的树形结构中对信号进行同步以减少计算资源的浪费是 context.Context 的最大作用。Go 服务的每一个请求都是通过单独的 Goroutine 处理的2，HTTP/RPC 请求的处理器会启动新的 Goroutine 访问数据库和其他服务。

如下图所示，我们可能会创建多个 Goroutine 来处理一次请求，而 context.Context 的作用是在不同 Goroutine 之间同步请求特定数据、取消信号以及处理请求的截止日期。

![golang-context.png](/images/golang-context.png)



> 其实 Context 存在的意义在于：（1）实现资源的的生命周期的控制，（2）实现嵌套调用中参数的传递。


###  Context 与 Goroutine 树

每一个 context.Context 都会从最顶层的 Goroutine 一层一层传递到最下层。context.Context 可以在上层 Goroutine 执行出现错误时，将信号及时同步给下层。

![golang-without-context-tree.png](/images/golang-without-context-tree.png)


### 取消信号 

context.WithCancel 函数能够从 context.Context 中衍生出一个新的子上下文并返回用于取消该上下文的函数。一旦我们执行返回的取消函数，当前上下文以及它的子上下文都会被取消，所有的 Goroutine 都会同步收到这一取消信号。


![golang-parent-cancel-context.png](/images/golang-parent-cancel-context.png)



#### Context 子树的取消

我们直接从 context.WithCancel 函数的实现来看它到底做了什么：


```go
// cancel context definition.
type cancelCtx struct {
	Context

	mu       sync.Mutex            // protects following fields
	done     atomic.Value          // of chan struct{}, created lazily, closed by first cancel call
	children map[canceler]struct{} // set to nil by the first cancel call
	err      error                 // set to non-nil by the first cancel call
}


func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
	c := newCancelCtx(parent)
	propagateCancel(parent, &c)
	return &c, func() { c.cancel(true, Canceled) }
}
```



- context.newCancelCtx 将传入的上下文包装成私有结构体 context.cancelCtx；
- context.propagateCancel 会构建父子上下文之间的关联，当父上下文被取消时，子上下文也会被取消：


```go
func propagateCancel(parent Context, child canceler) {
	done := parent.Done()
	if done == nil {
		return // 父上下文不会触发取消信号
	}
	select {
	case <-done:
		child.cancel(false, parent.Err()) // 父上下文已经被取消
		return
	default:
	}

	if p, ok := parentCancelCtx(parent); ok {
		p.mu.Lock()
		if p.err != nil {
			child.cancel(false, p.err)
		} else {
			p.children[child] = struct{}{}
		}
		p.mu.Unlock()
	} else {
		go func() {
			select {
			case <-parent.Done():
				child.cancel(false, parent.Err())
			case <-child.Done():
			}
		}()
	}
}
```

上述函数总共与父上下文相关的三种不同的情况：

- 当 parent.Done() == nil，也就是 parent 不会触发取消事件时，当前函数会直接返回；
- 当 child 的继承链包含可以取消的上下文时，会判断 parent 是否已经触发了取消信号；
    - 如果已经被取消，child 会立刻被取消；
    - 如果没有被取消，child 会被加入 parent 的 children 列表中，等待 parent 释放取消信号；
- 当父上下文是开发者自定义的类型、实现了 context.Context 接口并在 Done() 方法中返回了非空的管道时；
    - 运行一个新的 Goroutine 同时监听 parent.Done() 和 child.Done() 两个 Channel；
    - 在 parent.Done() 关闭时调用 child.cancel 取消子上下文；

context.propagateCancel 的作用是在 parent 和 child 之间同步取消和结束的信号，保证在 parent 被取消时，child 也会收到对应的信号，不会出现状态不一致的情况。

> source code: https://github.com/golang/go/blob/master/src/context/context.go



```go
// parentCancelCtx returns the underlying *cancelCtx for parent.
// It does this by looking up parent.Value(&cancelCtxKey) to find
// the innermost enclosing *cancelCtx and then checking whether
// parent.Done() matches that *cancelCtx. (If not, the *cancelCtx
// has been wrapped in a custom implementation providing a
// different done channel, in which case we should not bypass it.)
func parentCancelCtx(parent Context) (*cancelCtx, bool) {
	done := parent.Done()
	if done == closedchan || done == nil {
		return nil, false
	}
	p, ok := parent.Value(&cancelCtxKey).(*cancelCtx)
	if !ok {
		return nil, false
	}
	pdone, _ := p.done.Load().(chan struct{})
	if pdone != done {
		return nil, false
	}
	return p, true
}
```

cancelCtx 的 cancel 接口实现，关闭所有 children context.

```go
func (c *cancelCtx) cancel(removeFromParent bool, err error) {
	c.mu.Lock()
	if c.err != nil {
		c.mu.Unlock()
		return
	}
	c.err = err
	if c.done == nil {
		c.done = closedchan
	} else {
		close(c.done)
	}
	for child := range c.children {
		child.cancel(false, err)
	}
	c.children = nil
	c.mu.Unlock()

	if removeFromParent {
		removeChild(c.Context, c)
	}
}
```


context.WithDeadline 和 context.WithTimeout 也都能创建可以被取消的计时器上下文 context.timerCtx：


```go
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
	return WithDeadline(parent, time.Now().Add(timeout))
}

func WithDeadline(parent Context, d time.Time) (Context, CancelFunc) {
	if cur, ok := parent.Deadline(); ok && cur.Before(d) {
		return WithCancel(parent)
	}
	c := &timerCtx{
		cancelCtx: newCancelCtx(parent),
		deadline:  d,
	}
	propagateCancel(parent, c)
	dur := time.Until(d)
	if dur <= 0 {
		c.cancel(true, DeadlineExceeded) // 已经过了截止日期
		return c, func() { c.cancel(false, Canceled) }
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.err == nil {
		c.timer = time.AfterFunc(dur, func() {
			c.cancel(true, DeadlineExceeded)
		})
	}
	return c, func() { c.cancel(true, Canceled) }
}
```


context.WithDeadline 在创建 context.timerCtx 的过程中判断了父上下文的截止日期与当前日期，并通过 time.AfterFunc 创建定时器，当时间超过了截止日期后会调用 context.timerCtx.cancel 同步取消信号。

context.timerCtx 内部不仅通过嵌入 context.cancelCtx 结构体继承了相关的变量和方法，还通过持有的定时器 timer 和截止时间 deadline 实现了定时取消的功能：



```go
type timerCtx struct {
	cancelCtx
	timer *time.Timer // Under cancelCtx.mu.

	deadline time.Time
}

func (c *timerCtx) Deadline() (deadline time.Time, ok bool) {
	return c.deadline, true
}

func (c *timerCtx) cancel(removeFromParent bool, err error) {
	c.cancelCtx.cancel(false, err)
	if removeFromParent {
		removeChild(c.cancelCtx.Context, c)
	}
	c.mu.Lock()
	if c.timer != nil {
		c.timer.Stop()
		c.timer = nil
	}
	c.mu.Unlock()
}
```


context.timerCtx.cancel 方法不仅调用了 context.cancelCtx.cancel，还会停止持有的定时器减少不必要的资源浪费。



#### 传值方法 

在最后我们需要了解如何使用上下文传值，context 包中的 context.WithValue 能从父上下文中创建一个子上下文，传值的子上下文使用 context.valueCtx 类型：


```go
func WithValue(parent Context, key, val interface{}) Context {
	if key == nil {
		panic("nil key")
	}
	if !reflectlite.TypeOf(key).Comparable() {
		panic("key is not comparable")
	}
	return &valueCtx{parent, key, val}
}
```

context.valueCtx 结构体会将除了 Value 之外的 Err、Deadline 等方法代理到父上下文中，它只会响应 context.valueCtx.Value 方法，该方法的实现也很简单：


```go
type valueCtx struct {
	Context
	key, val interface{}
}

func (c *valueCtx) Value(key interface{}) interface{} {
	if c.key == key {
		return c.val
	}
	return c.Context.Value(key)
}
```

如果 context.valueCtx 中存储的键值对与 context.valueCtx.Value 方法中传入的参数不匹配，就会从父上下文中查找该键对应的值直到某个父上下文中返回 nil 或者查找到对应的值。



Go 语言中的 context.Context 的主要作用还是在多个 Goroutine 组成的树中同步取消信号以减少对资源的消耗和占用，虽然它也有传值的功能，但是这个功能我们还是很少用到。

在真正使用传值的功能时我们也应该非常谨慎，使用 context.Context 传递请求的所有参数一种非常差的设计，比较常见的使用场景是传递请求对应用户的认证令牌以及用于进行分布式追踪的请求 ID。

> 在 grpc 的 tracing 追踪中会使用到 valueCtx 用于传递相关信息。在网络传递过程中存在 valueCtx 到 grpc 的 Metadata 的编解码。






