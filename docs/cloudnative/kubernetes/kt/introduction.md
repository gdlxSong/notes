---
title: 简介
sidebar_position: 1
---


> tips: k8s 原生支持 `kubectl portforward` 实现集群和本地局域网的端口映射。


```bash
# 这几个命令执行任意一个即可
kubectl port-forward redis-master-765d459796-258hz 7000:6379
kubectl port-forward pods/redis-master-765d459796-258hz 7000:6379
kubectl port-forward deployment/redis-master 7000:6379
kubectl port-forward rs/redis-master 7000:6379
kubectl port-forward svc/redis-master 7000:6379
```










## References


- https://alibaba.github.io/kt-connect/#/zh-cn/reference/mechanism








