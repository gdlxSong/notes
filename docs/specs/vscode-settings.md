---
title: vscode 调教
sidebar_position: 21
---



## Questions

vscode 使用过程中遇到的问题和解决方案。



### vscode 本地调试






### vscode debug bridge on k8s 



### vscode 内存占用过高，造成机器卡顿的问题


> file -> perferences -> search.foll -> off





## linux-debug 解决方案

> 在内网开发，无法直接通过本地vscode在云端自动 initializing 云端环境，所以需要手动配置 vscode-server。


使用 vscode-extension：Remote-SSH + vscode-server 完成本地开发云端调试。

> https://zhuanlan.zhihu.com/p/294933020

值得注意的是：

> https://github.com/microsoft/vscode-remote-release/issues/6700#:~:text=VS%20Code%20client%20wait%20for%20server%20logs%20for,started%29.%20Note%3A%20setting%20%22remote.SSH.connectTimeout%22%3A%2030%20does%20not%20help.https://home.firefoxchina.cn

当前（20220517）的Remote-Development（include Remote-Container，Remote-SSH，Remote-WSL）中的Remote-SSH存在bug，远程连接存在问题，所幸 `Remote-SSH<preview>` 已经解决该问题。










