---
title: 网络模型
sidebar_position: 15
---


> 同一 Node 中的 Pod 可以通过 docker0 来进行数据交换，在不同 Node 上的 Pod 以 Node 为代理，Node 之间以路由转发。 Node 与 Pod 之间通过 iptables 实现规则映射。

k8s网络模型设计基础原则: 每个Pod都拥有一个独立的 IP地址，而且 假定所有 Pod 都在一个可以直接连通的、扁平的网络空间中 。 所以不管它们是否运行在同 一 个 Node (宿主机)中，都要求它们可以直接通过对方的 IP 进行访问。设计这个原则的原因 是，用户不需要额外考虑如何建立 Pod 之间的连接，也不需要考虑将容器端口映射到主机端口等问题。


## k8s 集群内需要解决的网络问题

鉴于上面这些要求，我们需要解决四个不同的网络问题：：

- Docker容器和Docker容器之间的网络
- Pod与Pod之间的网络
- Pod与Service之间的网络
- Internet与Service之间的网络



### 容器和容器之间的网络

![container-container](/images/k8s_neting_model_container_container.jpg)


- 在k8s中每个Pod中管理着一组Docker容器，这些Docker容器共享同一个网络命名空间。
- Pod中的每个Docker容器拥有与Pod相同的IP和port地址空间，并且由于他们在同一个网络命名空间，他们之间可以通过localhost相互访问。


其实是使用Docker的一种网络模型：–net=container

container模式指定新创建的Docker容器和已经存在的一个容器共享一个网络命名空间，而不是和宿主机共享。新创建的Docker容器不会创建自己的网卡，配置自己的 IP，而是和一个指定的容器共享 IP、端口范围等。


每个Pod容器有有一个pause容器其有独立的网络命名空间，在Pod内启动Docker容器时候使用 –net=container就可以让当前Docker容器加入到Pod容器拥有的网络命名空间（pause容器）。



### Pod与Pod之间的网络










