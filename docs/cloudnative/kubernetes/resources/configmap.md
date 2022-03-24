---
title: ConfigMap
sidebar_position: 3
---


> https://kubernetes.io/zh/docs/tasks/configure-pod-container/configure-pod-configmap/

ConfigMap和Secret是Kubernetes系统上两种特殊类型的存储卷，ConfigMap对象用于为容器中的应用提供配置文件等信息。但是比较敏感的数据，例如密钥、证书等由Secret对象来进行配置。它们将相应的配置信息保存于对象中，而后在Pod资源上以存储卷的形式挂载并获取相关的配置，以实现配置与镜像文件的解耦。


> 说明： ConfigMap 应该引用属性文件，而不是替换它们。可以将 ConfigMap 理解为类似于 Linux /etc 目录及其内容的东西。例如，如果你从 ConfigMap 创建 Kubernetes 卷，则 ConfigMap 中的每个数据项都由该数据卷中的单个文件表示。 


### 用途
- 以卷volume的方式挂载到容器内部的文件或目录，通过spec.volumes引用。
- 生成容器内的环境变量，在pod中可以通过 env 或者 envFrom 进行引用。



## 使用


### 指定文件创建 ConfigMap

文件名变成 cm 中的 data 字段的 key。

```bash 
kubectl create configmap game-config --from-file=configure-pod-container/configmap/ 
```

### 指定文件指定key

```bash 
kubectl create configmap game-config --from-file=core-conf=configure-pod-container/configmap/core-conf.yaml
```


### 使用  --from-env-file 指定数据来源

```bash
kubectl create configmap game-config-env-file \
       --from-env-file=configure-pod-container/configmap/game-env-file.properties
```


### 根据字面值创建 ConfigMap 


```bash
kubectl create configmap special-config --from-literal=special.how=very --from-literal=special.type=charm
```

### 基于生成器创建 ConfigMap


```bash
# 创建包含 ConfigMapGenerator 的 kustomization.yaml 文件
$ cat <<EOF >./kustomization.yaml
configMapGenerator:
- name: game-config-4
  files:
  - configure-pod-container/configmap/kubectl/game.properties
EOF


$ kubectl apply -k .
```




### ConfigMap 生成器




## 应用

### 将 ConfigMap 应用到环境变量

通过 env 来将 ConfigMap 中的 <key, value> 映射成为 环境变量。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "echo $(SPECIAL_LEVEL_KEY) $(SPECIAL_TYPE_KEY)" ]
      env:
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special.level
        - name: SPECIAL_TYPE_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special.type
  restartPolicy: Never
```

通过使用 envFrom 将 ConfigMap 所有的 <key, value> 映射到环境变量。

```yaml


apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "env" ]
      envFrom:
      - configMapRef:
          name: special-config
  restartPolicy: Never
```


### 将 ConfigMap 挂载到 Pod 的 volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: busybox:1.32
      command: [ "/bin/sh", "-c", "ls /etc/config/" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: special-config
  restartPolicy: Never
```


**使用path指定挂载文件名：**


```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh","-c","cat /etc/config/keys" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        name: special-config
        items:
        - key: SPECIAL_LEVEL
          path: keys
  restartPolicy: Never
```






### 存疑

1. --from-env-file 和 --from-file 有啥区别？








### 限制


- 在 Pod 规范中引用之前，必须先创建一个 ConfigMap（除非将 ConfigMap 标记为"可选"）。 如果引用的 ConfigMap 不存在，则 Pod 将不会启动。同样，引用 ConfigMap 中不存在的键也会阻止 Pod 启动。
- 如果你使用 envFrom 基于 ConfigMap 定义环境变量，那么无效的键将被忽略。 可以启动 Pod，但无效名称将记录在事件日志中（InvalidVariableNames）。 日志消息列出了每个跳过的键。
- ConfigMap 位于特定的名字空间 中。每个 ConfigMap 只能被同一名字空间中的 Pod 引用。

