---
title: Chart Values
sidebar_position: 5
---



Values通过模板中.Values对象可访问的values.yaml文件（或者通过 --set 参数)提供， 但可以模板中访问其他预定义的数据片段。



```notes
模板的Value通过两种方式提供：
- Chart开发者可以在chart中提供一个命名为 values.yaml 的文件。这个文件包含了默认值。
- Chart用户可以提供一个包含了value的YAML文件。可以在命令行使用 helm install命令时提供。
```


### 预定义的Values


以下值是预定义的，对每个模板都有效，并且可以被覆盖。和所有值一样，名称 区分大小写。


- Release.Name: 版本名称(非chart的)
- Release.Namespace: 发布的chart版本的命名空间
- Release.Service: 组织版本的服务
- Release.IsUpgrade: 如果当前操作是升级或回滚，设置为true
- Release.IsInstall: 如果当前操作是安装，设置为true
- Chart: Chart.yaml的内容。因此，chart的版本可以从 Chart.Version 获得， 并且维护者在Chart.Maintainers里。
- Files: chart中的包含了非特殊文件的类图对象。这将不允许您访问模板， 但是可以访问现有的其他文件（除非被.helmignore排除在外）。 使用{{ index .Files "file.name" }}可以访问文件或者使用{{.Files.Get name }}功能。 您也可以使用{{ .Files.GetBytes }}作为[]byte访问文件内容。
- Capabilities: 包含了Kubernetes版本信息的类图对象。({{ .Capabilities.KubeVersion }}) 和支持的Kubernetes API 版本({{ .Capabilities.APIVersions.Has "batch/v1" }})


> tips: 任何未知的Chart.yaml字段会被抛弃。在Chart对象中无法访问。因此， Chart.yaml不能用于将任意结构的数据传递到模板中。不过values文件可用于此。



### Values文件








