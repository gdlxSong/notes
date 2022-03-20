---
title: Chart Template
sidebar_position: 4
---




Helm Chart 模板是按照 Go模板语言书写， 增加了50个左右的附加模板函数 来自 [Sprig](https://github.com/Masterminds/sprig) 库 和一些其他 [指定的函数](https://helm.sh/zh/docs/howto/charts_tips_and_tricks)。



所有模板文件存储在chart的 templates/ 文件夹。 当Helm渲染chart时，它会通过模板引擎遍历目录中的每个文件。

模板的Value通过两种方式提供：

- Chart开发者可以在chart中提供一个命名为 values.yaml 的文件。这个文件包含了默认值。
- Chart用户可以提供一个包含了value的YAML文件。可以在命令行使用 helm install命令时提供。

当用户提供自定义value时，这些value会覆盖chart的values.yaml文件中value。



**Example:**


```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: deis-database
  namespace: deis
  labels:
    app.kubernetes.io/managed-by: deis
spec:
  replicas: 1
  selector:
    app.kubernetes.io/name: deis-database
  template:
    metadata:
      labels:
        app.kubernetes.io/name: deis-database
    spec:
      serviceAccount: deis-database
      containers:
        - name: deis-database
          image: {{ .Values.imageRegistry }}/postgres:{{ .Values.dockerTag }}
          imagePullPolicy: {{ .Values.pullPolicy }}
          ports:
            - containerPort: 5432
          env:
            - name: DATABASE_STORAGE
              value: {{ default "minio" .Values.storage }}
```