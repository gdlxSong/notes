---
title: Deployment
sidebar_position: 16
---





一个 Deployment 为 Pod 和 ReplicaSet 提供声明式的更新能力。

> Deployment definition: https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.22/#deployment-v1-apps



### 滚动更新








### 回滚

```bash
# 查看 deployment 版本记录
kubectl rollout history deployment deployment_name

# 查看某一指定版本详细信息
kubectl rollout history deployment deployment_name --revision=2

# 回滚到上一个版本
kubectl rollout undo deployment deployment_name

# 回滚到指定版本
kubectl rollout undo deployment deployment_name --to-revision=2
```








## deploy deployment details


![deploy_deployment.jpg](/images/deploy_deployment.jpg)



## References

- https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/








