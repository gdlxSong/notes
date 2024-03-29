---
title: Raft
sidebar_position: 35
---



> spec: https://github.com/maemual/raft-zh_cn/blob/master/raft-zh_cn.md


aft 是一种为了管理复制日志的一致性算法。提供领导人选举、日志复制和安全性。


> 共识算法的目的在于实现多个实例之间的状态一致，那么存在同步和异步的方案，对于同步可以使用rpc同步master-slaves，当然同步来实现强一致性是需要付出代价的。


- 领导选举：当现存的领导人发生故障的时候, 一个新的领导人需要被选举出来。
- 日志复制：领导人必须从客户端接收日志条目（log entries）然后复制到集群中的其他节点，并强制要求其他节点的日志和自己保持一致。
- 安全性：在 Raft 中安全性的关键是在图 3 中展示的状态机安全：如果有任何的服务器节点已经应用了一个确定的日志条目到它的状态机中，那么其他服务器节点不能在同一个日志索引位置应用一个不同的指令。章节 5.4 阐述了 Raft 算法是如何保证这个特性的；这个解决方案涉及到选举机制（5.2 节）上的一个额外限制。



## Raft 基础

在任何时刻，每一个服务器节点都处于这三个状态之一：领导人、跟随者或者候选人。


![raft-node-fsm.jpeg](/images/raft-node-fsm.jpeg)

> 服务器状态。跟随者只响应来自其他服务器的请求。如果跟随者接收不到消息，那么他就会变成候选人并发起一次选举。获得集群中大多数选票的候选人将成为领导人。在一个任期内，领导人一直都会是领导人，直到自己宕机了。




Raft 把时间分割成任意长度的任期,每个任期开始都是一次选举。在选举成功后，领导人会管理整个集群直到任期结束。有时候选举会失败，那么这个任期就会没有领导人而结束。任期之间的切换可以在不同的时间不同的服务器上观察到。

![raft-cluster-term.jpeg](/images/raft-cluster-term.jpeg)


`任期在 Raft 算法中充当逻辑时钟的作用`，任期使得服务器可以检测一些过期的信息：比如过期的领导人。每个节点存储一个当前任期号，这一编号在整个时期内单调递增。每当服务器之间通信的时候都会交换当前任期号；如果一个服务器的当前任期号比其他人小，那么他会更新自己的编号到较大的编号值。如果一个候选人或者领导人发现自己的任期号过期了，那么他会立即恢复成跟随者状态。如果一个节点接收到一个包含过期的任期号的请求，那么他会直接拒绝这个请求。


> Raft 算法中服务器节点之间通信使用远程过程调用（RPCs），并且基本的一致性算法只需要两种类型的 RPCs。请求投票（`RequestVote`） RPCs 由候选人在选举期间发起（章节 5.2），然后附加条目（`AppendEntries`）RPCs 由领导人发起，用来复制日志和提供一种心跳机制（章节 5.3）。第 7 节为了在服务器之间传输快照增加了第三种 RPC。当服务器没有及时的收到 RPC 的响应时，会进行重试， 并且他们能够并行的发起 RPCs 来获得最佳的性能。


> 在 leader election 的过程中，是以 `<last_term, last_log_index>` 来选出最合适的 leader 的。




### Leader Election


> link: [领导人选举](https://github.com/maemual/raft-zh_cn/blob/master/raft-zh_cn.md#52-%E9%A2%86%E5%AF%BC%E4%BA%BA%E9%80%89%E4%B8%BE)

