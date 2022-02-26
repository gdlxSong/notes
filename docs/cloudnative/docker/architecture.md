---
title: Architecture
sidebar_position: 2
---



## Architecture


> docs: https://www.docker.org.cn/docker/205.html

![architecture](/images/docker_architecture.png)

docker是一个C/S模式的架构，后端是一个松耦合架构，模块各司其职。

- 用户是使用Docker Client与Docker Daemon建立通信，并发送请求给后者。
- Docker Daemon作为Docker架构中的主体部分，首先提供Server的功能使其可以接受Docker Client的请求；
- Engine执行Docker内部的一系列工作，每一项工作都是以一个Job的形式的存在。
- Job的运行过程中，当需要容器镜像时，则从Docker Registry中下载镜像，并通过镜像管理驱动graphdriver将下载镜像以Graph的形式存储；
- 当需要为Docker创建网络环境时，通过网络管理驱动networkdriver创建并配置Docker容器网络环境；
- 当需要限制Docker容器运行资源或执行用户指令等操作时，则通过execdriver来完成。
- libcontainer是一项独立的容器管理包，networkdriver以及execdriver都是通过libcontainer来实现具体对容器进行的操作。



