---
title: Service Account
sidebar_position: 10
---


Service account是为了方便Pod里面的进程调用Kubernetes API或其他外部服务而设计的。它与User account不同

- User account是为人设计的，而service account则是为Pod中的进程调用Kubernetes API而设计；
- User account是跨namespace的，而service account则是仅局限它所在的namespace；
- 每个namespace都会自动创建一个default service account
- Token controller检测service account的创建，并自动为它们创建secret
- 开启ServiceAccount Admission Controller后
    - 每个Pod在创建后都会自动设置spec.serviceAccount为default（除非指定了其他ServiceAccout）
    - 验证Pod引用的service account已经存在，否则拒绝创建
    - 如果Pod没有指定ImagePullSecrets，则把service account的ImagePullSecrets加到Pod中
    - 每个container启动后都会挂载该service account的token和ca.crt到/var/run/secrets/kubernetes.io/serviceaccount/














## References

- https://www.kubernetes.org.cn/service-account




