---
title: Introduction
sidebar_position: 1
---



> docs: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/

Kubernetes 对象是 “目标性记录” —— 一旦创建对象，Kubernetes 系统将持续工作以确保对象存在。 通过创建对象，本质上是在告知 Kubernetes 系统，所需要的集群工作负载看起来是什么样子的， 这就是 Kubernetes 集群的 期望状态（Desired State）。




## 对象规约（Spec）与状态（Status）

几乎每个 Kubernetes 对象包含两个嵌套的对象字段，它们负责管理对象的配置： 对象 spec（规约） 和 对象 status（状态） 。 对于具有 spec 的对象，你必须在创建对象时设置其内容，描述你希望对象所具有的特征： 期望状态（Desired State） 。

status 描述了对象的 当前状态（Current State），它是由 Kubernetes 系统和组件 设置并更新的。在任何时刻，Kubernetes 控制平面 都一直积极地管理着对象的实际状态，以使之与期望状态相匹配。

例如，Kubernetes 中的 Deployment 对象能够表示运行在集群中的应用。 当创建 Deployment 时，可能需要设置 Deployment 的 spec，以指定该应用需要有 3 个副本运行。 Kubernetes 系统读取 Deployment 规约，并启动我们所期望的应用的 3 个实例 —— 更新状态以与规约相匹配。 如果这些实例中有的失败了（一种状态变更），Kubernetes 系统通过执行修正操作 来响应规约和状态间的不一致 —— 在这里意味着它会启动一个新的实例来替换。


**spec public fields:**

```yaml
spec
  # 指定容器相关配置，此字段是必填的，部分二级字段如下：
  containers:
    # 容器名称
  - name: string
    # 启动容器的镜像
    image: 
    # 拉取镜像策略，其有三个值可选：Always | Never | IfNotPresent
        # Always: 表示无论本地是否有镜像文件，每次创建资源时都去镜像仓库中拉取镜像
        # Never: 表示从不自动从镜像仓库中拉取镜像，启动时需要手动拉取镜像到本地
        # IfNotPresent: 表示如果本地有镜像时就使用本地镜像，本地没有时就自动去拉取
    # 当不指定此配置时，如果镜像标签是 :latest 的时候，默认采用Always的方式拉取镜像，否则默认采用IfNotPresent方式拉取镜像。
    imagePullPolicy: 

    # 容器暴露的端口信息。在此处暴露端口可为系统提供有关容器使用的网络连接的信息，但仅仅是参考信息。如果在此处没有指定端口，也并不能保证容器没有暴露端口。任何监听容器中“0.0.0.0”地址的端口都可以被访问到。
    ports:
      # 暴露端口的名字
    - name:
      # 必填字段，暴露的容器端口号
      containerPort:
      # 协议栈，默认TCP协议，可选UDP,TCP,SCTP
      protocol:
    # 容器运行的命令，用来指定替换容器默认的命令，command相当于Dockerfile中的Entrypoint，如果不指定该参数，那么就会采用镜像文件中的ENTRYPOINT指令。
    command:
    # entrypoint指令的参数列表，如果不指定这个参数，则使用镜像中的CMD指令
    # ** command和args参数分别对应镜像中的ENTRYPOINT和CMD指令，此时就出现如下几种情况：
    # a、command和args都未指定：运行镜像中的ENTRYPOINT和CMD指令
    # b、command指定而args未指定：只运行command指令，镜像中的ENTRYPOINT和CMD指令都会被忽略
    # c、command未指定而args指定：运行镜像中的ENTRYPOINT指令且将args当做参数传给ENTRYPOINT指令且镜像中的CMD指令被忽略
    # d、command和args都指定：运行command指令，并把args当做参数传递给command，镜像中的ENTRYPOINT和CMD指令都会被忽略
    args:
    # POD容器存活状态监测，检测探针有三种，ExecAction、TCPSockerAction、HttpGetAction
    livenessProbe:
      # 命令类型探针
      exec:
      # 执行的探测命令，命令运行路径是容器内系统的/，且命令并不会运行在shell中，所以，需要我们手动指定运行的shell，当命令返回值是0时表示状态正常，反之表示状态异常
      command:
      # http请求型探针
      httpGet:
        # 请求的主机地址，默认是POD IP
        host:
        # HTTP请求头
        httpHeaders:
        # 请求的path
        path:
        # 请求的端口，必填项
        port:
        # 请求协议，默认是http
        scheme:
      # TCP socket型探针
      tcpSocket:
        # 请求的主机地址，默认是POD IP
        host:
        # 请求的端口号，端口范围是1-65535
        port:
        # 连续错误次数，默认3次，即默认连续3次检测错误才表示探测结果为异常
        failureThreshold:
        # 连续成功次数，默认1次，即当出现失败后，出现连续1次检测成功就认为探测结果是正常
        successThreshold:
        # 探测时间间隔，默认10秒
        periodSeconds:
        # 探测超时时间，默认1秒
        timeoutSeconds:
        # 起始探测时间间隔，表示pod启动后，该间隔之后才开始进行探测
        initialDelaySeconds:
    # 主容器内进程状态监测，其可用的检测探针类型和livenessProbe是一致的
        # 此检测和service调度有很强的关联性，
        # 当新调度一个pod时，如果没有指定就绪性检测，此时一旦pod创建就会立即被注册到service的后端
        # 如果此时pod内的程序尚无法对外提供服务，就会造成部分请求失败
        # 所以，我们应该让一个pod在注册到service中区之前，已经通过了可用性检测，保证可以对外提供服务
    readinessProbe:
    # 生命周期钩子方法
    lifecycle:
      # 容器启动后执行的命令，可用检测探针和livenessProbe是一致的
      postStart:
      # 容器启动前执行的命令
      preStop:
  # 重启策略，Always, OnFailure,Never. Default to Always.
  restartPolicy:
  # node选择器，可以根据node的标签选择POD运行在某些指定的node上
  nodeSelector:
  # 使pod运行在指定nodeName的节点之上
  nodeName: 
```



> docs: [spec & status](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status)


**resource object required fields:**


- apiVersion - 创建该对象所使用的 Kubernetes API 的版本
- kind - 想要创建的对象的类别
- metadata - 帮助唯一性标识对象的一些数据，包括一个 name 字符串、UID 和可选的 namespace
- spec - 你所期望的该对象的状态

**metadata:**


```yaml
metadata:
  # 对象的唯一标识，由系统生成。
  uid: string
  # 对象名称，在命名空间中必须是唯一的。
  name: string
  # 对象标签，用于分组
  labels: []string
  # 指定对象的名字空间。
  namespace:
  # 注解，非结构化的键值对信息，用于外部工具使用。
  annotations:
  # Finalizers 字段属于 Kubernetes GC 垃圾收集器，是一种删除拦截机制，能够让控制器实现异步的删除前（Pre-delete）回调。其存在于任何一个资源对象的 Meta[1] 中，在 k8s 源码中声明为 []string，该 Slice 的内容为需要执行的拦截器名称。
  # 对带有 Finalizer 的对象的第一个删除请求会为其 metadata.deletionTimestamp 设置一个值，但不会真的删除对象。一旦此值被设置，finalizers 列表中的值就只能被移除。
  # 当 metadata.deletionTimestamp 字段被设置时，负责监测该对象的各个控制器会通过轮询对该对象的更新请求来执行它们所要处理的所有 Finalizer。当所有 Finalizer 都被执行过，资源被删除。
  # metadata.deletionGracePeriodSeconds 的取值控制对更新的轮询周期。
  # 每个控制器要负责将其 Finalizer 从列表中去除。
  # 每执行完一个就从 finalizers 中移除一个，直到 finalizers 为空，之后其宿主资源才会被真正的删除。
  finalizers:
  # 集群名称，系统设置。
  clusterName:
  # 
  generation: 
  generateName:
  # 对象创建时间，系统设置。
  creationTimestamp:
  # 此对象从系统中删除之前允许正常终止的秒数。仅当还设置了deletionTimestamp 时才设置。
  deletionGracePeriodSeconds:
  deletionTimestamp:
  managedFields:
  ownerReferences:
  resourceVersion:
  selfLink: 
```



> docs: https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#objectmeta-v1-meta



### Resource List

- [Pod](./pod.md)
 










