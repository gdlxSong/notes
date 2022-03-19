---
title: Docker CLI
sidebar_position: 4
---

> docs: https://docs.docker.com/engine/reference/commandline/cli/


## Command List


### docker search

搜索 docker registry 中的镜像。


搜索 docker 中的镜像，并列出镜像的所有tag.


```bash
# 安装组件
apt install -y yajl-tools
# 列出镜像tag
curl -L -s https://registry.hub.docker.com/v1/repositories/hello-world/tags | json_reformat | grep -i name | awk '{print $2}' | sed 's/\"//g' | sort -u
```









