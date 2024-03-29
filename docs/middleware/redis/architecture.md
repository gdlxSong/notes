---
title: 架构
sidebar_position: 2
---


redis 有四种部署架构：单机，主从，哨兵，集群。

### 单机模式


![redis-deploy-single](/images/redis-single.webp)

**优点：**

- 部署简单；
- 成本低，无备用节点；
- 高性能，单机不需要同步数据，数据天然一致性。

**缺点：**

- 可靠性保证不是很好，单节点有宕机的风险。
- 单机高性能受限于 CPU 的处理能力，Redis 是单线程的。


> 单机 Redis 能够承载的 QPS（每秒查询速率）大概在几万左右。取决于业务操作的复杂性，Lua 脚本复杂性就极高。假如是简单的 key value 查询那性能就会很高。

> 假设上千万、上亿用户同时访问 Redis，QPS 达到 10 万+。这些请求过来，单机 Redis 直接就挂了。系统的瓶颈就出现在 Redis 单机问题上，此时我们可以通过主从复制解决该问题，实现系统的高并发。



### 主从模式

![redis-master-slave](/images/redis-master-slave.webp)


> Redis 的复制（Replication）功能允许用户根据一个 Redis 服务器来创建任意多个该服务器的复制品，其中被复制的服务器为主服务器（Master），而通过复制创建出来的复制品则为从服务器（Slave）。 只要主从服务器之间的网络连接正常，主服务器就会将写入自己的数据同步更新给从服务器，从而保证主从服务器的数据相同。


> 数据的复制是单向的，只能由主节点到从节点，简单理解就是从节点只支持读操作，不允许写操作。主要是读高并发的场景下用主从架构。主从模式需要考虑的问题是：当 Master 节点宕机，需要选举产生一个新的 Master 节点，从而保证服务的高可用性。


**优点：**


- Master/Slave 角色方便水平扩展，QPS 增加，增加 Slave 即可；
- 降低 Master 读压力，转交给 Slave 节点；
- 主节点宕机，从节点作为主节点的备份可以随时顶上继续提供服务；


**缺点：**


- 可靠性保证不是很好，主节点故障便无法提供写入服务；
- 没有解决主节点写的压力；
- 数据冗余（为了高并发、高可用和高性能，一般是允许有冗余存在的）；
- 一旦主节点宕机，从节点晋升成主节点，需要修改应用方的主节点地址，还需要命令所有从节点去复制新的主节点，整个过程需要人工干预；
- 主节点的写能力受到单机的限制；
- 主节点的存储能力受到单机的限制。


## 哨兵模式

![redis-sentinel](/images/redis-sentinel.webp)


>   主从模式中，当主节点宕机之后，从节点是可以作为主节点顶上来继续提供服务，但是需要修改应用方的主节点地址，还需要命令所有从节点去复制新的主节点，整个过程需要人工干预。于是，在 Redis 2.8 版本开始，引入了哨兵（Sentinel）这个概念，在主从复制的基础上，哨兵实现了自动化故障恢复。如上图所示，哨兵模式由两部分组成，哨兵节点和数据节点：


- 哨兵节点：哨兵节点是特殊的 Redis 节点，不存储数据；
- 数据节点：主节点和从节点都是数据节点。

Redis Sentinel 是分布式系统中监控 Redis 主从服务器，并提供主服务器下线时自动故障转移功能的模式。其中三个特性为：


- 监控(Monitoring)：Sentinel 会不断地检查你的主服务器和从服务器是否运作正常；

- 提醒(Notification)：当被监控的某个 Redis 服务器出现问题时， Sentinel 可以通过 API 向管理员或者其他应用程序发送通知；

- 自动故障迁移(Automatic failover)：当一个主服务器不能正常工作时， Sentinel 会开始一次自动故障迁移操作。


#### 哨兵的工作原理


**定时任务：**


Sentinel 内部有 3 个定时任务，分别是：


- 每 1 秒每个 Sentinel 对其他 Sentinel 和 Redis 节点执行 PING 操作（监控），这是一个心跳检测，是失败判定的依据。

- 每 2 秒每个 Sentinel 通过 Master 节点的 channel 交换信息（Publish/Subscribe）；

- 每 10 秒每个 Sentinel 会对 Master 和 Slave 执行 INFO 命令，这个任务主要达到两个目的：

	- 发现 Slave 节点；

	- 确认主从关系。


**主观下线：**


- 所谓主观下线（Subjectively Down， 简称 SDOWN）指的是单个 Sentinel 实例对服务器做出的下线判断，即单个 Sentinel 认为某个服务下线（有可能是接收不到订阅，之间的网络不通等等原因）。
- 主观下线就是说如果服务器在给定的毫秒数之内， 没有返回 Sentinel 发送的 PING 命令的回复， 或者返回一个错误， 那么 Sentinel 会将这个服务器标记为主观下线（SDOWN）。


**客观下线：**


- 客观下线（Objectively Down， 简称 ODOWN）指的是多个 Sentinel 实例在对同一个服务器做出 SDOWN 判断，并且通过命令互相交流之后，得出的服务器下线判断，然后开启 failover。
- 只有在足够数量的 Sentinel 都将一个服务器标记为主观下线之后， 服务器才会被标记为客观下线（ODOWN）。只有当 Master 被认定为客观下线时，才会发生故障迁移。

**仲裁：**

- 仲裁指的是配置文件中的 quorum 选项。某个 Sentinel 先将 Master 节点标记为主观下线，然后会将这个判定通过 sentinel is-master-down-by-addr 命令询问其他 Sentinel 节点是否也同样认为该 addr 的 Master 节点要做主观下线。最后当达成这一共识的 Sentinel 个数达到前面说的 quorum 设置的值时，该 Master 节点会被认定为客观下线并进行故障转移。


- quorum 的值一般设置为 Sentinel 个数的二分之一加 1，例如 3 个 Sentinel 就设置为 2。


**哨兵模式工作流程：**


- 每个 Sentinel 以每秒一次的频率向它所知的 Master，Slave 以及其他 Sentinel 节点发送一个 PING 命令；

- 如果一个实例（instance）距离最后一次有效回复 PING 命令的时间超过配置文件 own-after-milliseconds 选项所指定的值，则这个实例会被 Sentinel 标记为主观下线； 

- 如果一个 Master 被标记为主观下线，那么正在监视这个 Master 的所有 Sentinel 要以每秒一次的频率确认 Master 是否真的进入主观下线状态；

- 当有足够数量的 Sentinel（大于等于配置文件指定的值）在指定的时间范围内确认 Master 的确进入了主观下线状态，则 Master 会被标记为客观下线；

- 如果 Master 处于 ODOWN 状态，则投票自动选出新的主节点。将剩余的从节点指向新的主节点继续进行数据复制；

- 在正常情况下，每个 Sentinel 会以每 10 秒一次的频率向它已知的所有 Master，Slave 发送 INFO 命令；当 Master 被 Sentinel 标记为客观下线时，Sentinel 向已下线的 Master 的所有 Slave 发送 INFO 命令的频率会从 10 秒一次改为每秒一次； 

- 若没有足够数量的 Sentinel 同意 Master 已经下线，Master 的客观下线状态就会被移除。若 Master 重新向 Sentinel 的 PING 命令返回有效回复，Master 的主观下线状态就会被移除。




**优点：**


- 哨兵模式是基于主从模式的，所有主从的优点，哨兵模式都有；
- 主从可以自动切换，系统更健壮，可用性更高；
- Sentinel 会不断地检查你的主服务器和从服务器是否运作正常。当被监控的某个 Redis 服务器出现问题时， Sentinel 可以通过 API 向管理员或者其他应用程序发送通知。

**缺点：**

- 主从切换需要时间，会丢失数据；
- 还是没有解决主节点写的压力；
- 主节点的写能力，存储能力受到单机的限制；
- 动态扩容困难复杂，对于集群，容量达到上限时在线扩容会变得很复杂。




### 集群模式





- 假设上千万、上亿用户同时访问 Redis，QPS 达到 10 万+。这些请求过来，单机 Redis 直接就挂了。系统的瓶颈就出现在 Redis 单机问题上，此时我们可以通过主从复制解决该问题，实现系统的高并发。

- 主从模式中，当主节点宕机之后，从节点是可以作为主节点顶上来继续提供服务，但是需要修改应用方的主节点地址，还需要命令所有从节点去复制新的主节点，整个过程需要人工干预。于是，在 Redis 2.8 版本开始，引入了哨兵（Sentinel）这个概念，在主从复制的基础上，哨兵实现了自动化故障恢复。

- 哨兵模式中，单个节点的写能力，存储能力受到单机的限制，动态扩容困难复杂。于是，Redis 3.0 版本正式推出 Redis Cluster 集群模式，有效地解决了 Redis 分布式方面的需求。Redis Cluster 集群模式具有`高可用`、`可扩展性`、`分布式`、`容错`等特性。



![redis-cluster](/images/redis-cluster.webp)


Redis Cluster 采用无中心结构，每个节点都可以保存数据和整个集群状态，每个节点都和其他所有节点连接。Cluster 一般由多个节点组成，节点数量至少为 6 个才能保证组成完整高可用的集群，其中三个为主节点，三个为从节点。三个主节点会分配槽，处理客户端的命令请求，而从节点可用在主节点故障后，顶替主节点。


- 如上图所示，该集群中包含 6 个 Redis 节点，3 主 3 从，分别为 M1，M2，M3，S1，S2，S3。除了主从 Redis 节点之间进行数据复制外，所有 Redis 节点之间采用 Gossip 协议进行通信，交换维护节点元数据信息。


- 总结下来就是：读请求分配给 Slave 节点，写请求分配给 Master，数据同步从 Master 到 Slave 节点。




#### 数据分区


单机、主从、哨兵的模式数据都是存储在一个节点上，其他节点进行数据的复制。而单个节点存储是存在上限的，集群模式就是把数据进行分片存储，当一个分片数据达到上限的时候，还可以分成多个分片。


- Redis Cluster 采用虚拟哈希槽分区，所有的键根据哈希函数映射到 0 ~ 16383 整数槽内，计算公式：HASH_SLOT = CRC16(key) % 16384。每一个节点负责维护一部分槽以及槽所映射的键值数据。



![redis-cluster-keys-slot](/images/redis-cluster-keys-slot.webp)





**优点：**


- 无中心架构；

- 可扩展性，数据按照 Slot 存储分布在多个节点，节点间数据共享，节点可动态添加或删除，可动态调整数据分布；

- 高可用性，部分节点不可用时，集群仍可用。通过增加 Slave 做备份数据副本。

- 实现故障自动 failover，节点之间通过 gossip 协议交换状态信息，用投票机制完成 Slave 到 Master 的角色提升。


**缺点：**


- 数据通过异步复制，无法保证数据强一致性；

- 集群环境搭建复杂，不过基于 Docker 的搭建方案会相对简单。


### Key 失效

Redis 的 key 可以设置过期时间，过期后 Redis 采用主动和被动结合的失效机制，一个是和 MC 一样在访问时触发被动删除，另一种是定期的主动删除。

定期+惰性+内存淘汰策略









## 存疑

1. 集群的 master 之间是否存在转发代理？
    - 会的，对于发送错误的分片请求，redis节点会对其进行重定向。
    1.1 问题来了，既然会重定向，那么也就意味着redis节点之间有元数据同步，比如slot节点分布，那么他们是如何同步的？

    client 对与 cluster 的请求是依赖客户端的路由，客户端路由可以是用于端服务自己实现的，也可以使用 redis 集群的 sdk 的 proxy 的来实现路由。

2. 集群的slave节点是否拥有集群的所有数据？ 
    对于主从和哨兵而言，集群中的每一个节点都是保持最终一致性，每个节点都会保持相同的数据。
3. 如果redis节点的数据持久化是使用快照的方式来进行的，那么redis节点之间又是如何实现增量数据同步的呢？还是说同步的是Command来实现最终一致性？
    a. 一般主从节点之间的数据同步采取的就是 snapshot + command 的形式，raft 也原生支持这种同步方式。
    b. AOF 模式下的优化方式，是使用redis子进程来实现key的command来实现合并。

4. 在哨兵模式下，多个哨兵之间是如何进行协商，来判定master节点的状态的呢？
    哨兵集群是使用分布式共识算法，来同步redis-cluster集群状态信息，然后由哨兵集群的master来决策的。

5. 主从，哨兵，集群是如何决策将一个请求转发到一个确定的节点的呢，就是请求的路由？
    请求的路由由两种方式实现：
        a. 由客户端服务自身来实现客户端请求路由的。
        b. 由redis sdk实现的proxy来实现请求路由。
6. 主从节点之间是如何实现数据同步的？
    在 slaver 启动之后，会向 master 发送 psync 命令来同步当前 快照， 快照同步之后采用 AOF 的 写操作 记录来同步写日志（增量）。





## References:

- https://xie.infoq.cn/article/fe070dcadf891d3d641132c36
- https://zhuanlan.zhihu.com/p/365087281
- https://juejin.cn/post/6925284711296155655