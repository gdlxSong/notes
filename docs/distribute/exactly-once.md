---
title: Exactly Once
sidebar_position: 33
---




#### 什么是Exactly-Once投递语义

Exactly-Once是指发送到消息系统的消息只能被消费端处理且仅处理一次，即使生产端重试消息发送导致某消息重复投递，该消息在消费端也只被消费一次。

Exactly-Once语义是消息系统和流式计算系统中消息流转的最理想状态，但是在业界并没有太多理想的实现。因为真正意义上的Exactly-Once依赖消息系统的服务端、消息系统的客户端和用户消费逻辑这三者状态的协调。例如，当您的消费端完成一条消息的消费处理后出现异常宕机，而消费端重启后由于消费的位点没有同步到消息系统的服务端，该消息有可能被重复消费。

业界对于Exactly-Once投递语义存在很大的争议，很多人会拿出“FLP不可能理论”或者其他一致性定律对此议题进行否定，但事实上，特定场景的Exactly-Once语义实现并不是非常复杂，只是因为通常大家没有精确的描述问题的本质。

`如果您要实现一条消息的消费结果只能在业务系统中生效一次，您需要解决的只是如何保证同一条消息的消费幂等问题`。消息队列RocketMQ版的Exactly-Once语义就是解决业务中最常见的一条消息的消费结果（消息在消费端计算处理的结果）在数据库系统中有且仅生效一次的问题。




### Exactly once is NOT exactly the same 

分布式事件流处理正逐渐成为大数据领域中一个热门话题。著名的流处理引擎（Streaming Processing Engines， SPEs）包括Apache Storm、Apache Flink、Heron、Apache Kafka（Kafka Streams）以及Apache Spark（Spark Streaming）。流处理引擎中一个著名的且经常被广泛讨论的特征是它们的处理语义，而“exactly-once”是其中最受欢迎的，同时也有很多引擎声称它们提供“exactly-once”处理语义。
然而，围绕着“exactly-once”究竟是什么、它牵扯到什么以及当流处理引擎声称提供“exactly-once”语义时它究竟意味着什么，仍然存在着很多误解与歧义。而用来描述处理语义的“exactly-once”这一标签同样也是非常误导人的。在这篇博文当中，我将会讨论众多受欢迎的引擎所提供的“exactly-once”语义间的不同之处，以及为什么“exactly-once”更好的描述是“effective-once”。我还会讨论用来实现“exactly-once”的常用技术间的权衡（tradeoffs）


## 背景


流处理（streaming process），有时也被称为事件处理（event processing），可以被简洁地描述为对于一个无限的数据或事件序列的连续处理。一个流，或事件，处理应用可以或多或少地由一个有向图，通常是一个有向无环图（DAG），来表达。在这样一个图中，每条边表示一个数据或事件流，而每个顶点表示使用应用定义好的逻辑来处理来自相邻边的数据或事件的算子。其中有两种特殊的顶点，通常被称作sources与sinks。Sources消费外部数据/事件并将其注入到应用当中，而sinks通常收集由应用产生的结果。图1描述了一个流处理应用的例子。


![stream-processing1](/images/stream-processing1.png)


一个执行流/事件处理应用的流处理引擎通常允许用户制定一个可靠性模式或者处理语义，来标示引擎会为应用图的实体之间的数据处理提供什么样的保证。由于你总是会遇到网络、机器这些会导致数据丢失的故障，因而这些保证是有意义的。有三种模型/标签，at-most-once、at-least-once以及exactly-once，通常被用来描述流处理引擎应该为应用提供的数据处理语义。


### At-most-once processing semantics


这实质上是一个“尽力而为”（best effort）的方法。数据或者事件被保证只会被应用中的所有算子最多处理一次。这就意味着对于流处理应用完全处理它之前丢失的数据，也不会有额外的重试或重传尝试。


![stream-proccessing-at-most-once](/images/stream-proccessing-at-most-once.png)


### At-least-once processing semantics


数据或事件被保证会被应用图中的所有算子都至少处理一次。这通常意味着当事件在被应用完全处理之前就丢失的话，其会被从source开始重放（replayed）或重传（retransmitted）。由于事件会被重传，那么一个事件有时就会被处理超过一次，也就是所谓的at-least-once。图3展示了一个at-least-once的例子。在这一示例中，第一个算子第一次处理一个事件时失败，之后在重试时成功，并在结果证明没有必要的第二次重试时成功。

![stream-processing-at-least-once](/images/stream-processing-at-least-once.png)




### Exactly-once processing semantics


倘若发生各种故障，事件也会被确保只会被流应用中的所有算子“恰好”处理一次。拿来实现“exactly-once”的有两种受欢迎的典型机制：1. 分布式快照/状态检查点（checkpointing） 2. At-least-once的事件投递加上消息去重
用来实现“exactly-once”的分布式快照/状态检查点方法是受到了Chandy-Lamport分布式快照算法1的启发。在这种机制中，流处理应用中的每一个算子的所有状态都会周期性地checkpointed。倘若系统发生了故障，每一个算子的所有状态都会回滚到最近的全局一致的检查点处。在回滚过程中，所有的处理都会暂停。Sources也会根据最近的检查点重置到正确到offset。整个流处理应用基本上倒回到最近的一致性状态，处理也可以从这个状态重新开始。图4展示了这种机制的基本原理。


![stream-processing-exactly-once](/images/stream-processing-exactly-once.png)




#### effectively once semantics

其实在 stream processing 系统中，我们需要的是 effectively once 语义，而非 exactly once，消息可能处理多次，但是只有一次的有效处理。

我们需要实现两个保证：
- event 被成功处理一次。
- 状态的持久化和 MQ 的 offset 更新是事务的。



## 解决方案

对于 effectively once semantics 我们有两种解决方案：`checkpoint` 和 `分布式快照`。


### checkpoint


checkpoint 使用定时器来定时对已经处理的 event 做提交，同时持久化变更状态。

[checkpoint 原理详解](/images/checkpoint.md)

checkpoint（分布式快照/状态检查点）的性能开销最小。因为流处理引擎本质上是往流应用程序中发送一些特殊事件和常规事件，而状态检查点可以异步地在后台执行。然而，对于大型流处理应用，故障也会发送的更频繁，导致流处理引擎需要暂停应用程序，同时回滚所有算子的状态，这反过来又会影响性能。越大型的流处理应用程序，故障发生的越频繁，反过来，流应用程序性能影响也就越大。但是，这种非侵入式机制，运行时需要的额外资源的影响很小。


### 至少一次传输 + 去重

（至少一次传输 + 去重）可能要求更多的资源，尤其是存储。使用这种机制，流处理引擎将需要能够跟踪由算子的每个实例完全处理过的每个元组，以执行数据去重，以及为每个事件执行重复数据删除。这相当于需要追踪大量的数据，尤其是如果流应用程序规模大或者有很多应用程序在运行的时候。在每个算子上执行数据去重的每个事件也会带来性能开销。使用这种机制，流应用程序的性能不太可能会被应用程序的大小所影响。使用机制 1，如果在任意算子发生任何故障，都需要全局暂停并且回滚状态；使用机制 2，失败的影响更加局部化。当一个算子发生故障，可能尚未处理完成的事件仅需要上游数据源重放或重新发送即可。性能的影响被隔离在流应用程序失败发生的地方，几乎不会应用程序中的其他算子的性能造成影响。




## References



- [Exactly-Once Semantics with Transactions in Pulsar](https://streamnative.io/en/blog/release/2021-06-14-exactly-once-semantics-with-transactions-in-pulsar/#:~:text=Exactly-once%20Semantics%20Exactly-once%20semantics%20guarantees%20that%20even%20if,but%20also%20one%20that%20is%20not%20well%20understood.)
- [Kafka 实现 Exactly-once](https://www.jianshu.com/p/3feb67b3dd5c)



