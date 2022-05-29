---
title: "Docker Issues"
date: 2020-07-03T21:00:54+08:00
lastmod: 2020-07-03T21:00:54+08:00
description: ""
tags: ["docker"]
categories: ["docker"]
author: "xGdl"
comment: true
toc: true
autoCollapseToc: true
postMetaInFooter: false
hiddenFromHomePage: false
contentCopyright: true
reward: true
mathjax: true
mathjaxEnableSingleDollar: false
mathjaxEnableAutoNumber: false
---

## 由头

这篇文章对我所遇到的docker的坑进行填埋和记录。


## 已解决问题汇总

问题汇总，对问题进行描述，并给出解决方案。



### ERROR: registry.docker.io: net/http: TLS handshake timeout

>Error response from daemon: Get https://registry-1.docker.io/v2/library/alpine/manifests/latest: Get https://auth.docker.io/token?scope=repository%3Alibrary%2Falpine%3Apull&service=registry.docker.io: net/http: TLS handshake timeout


大概看一下，我们就可以知道客户端向远程docker仓库建立连接的时候TLS握手超时，导致拉取镜像失败。 

#### 失败原因

1. 失败原因在于远程仓库地址是https://registry-1.docker.io（dockerHub），国外的网站，超时正常。
2. 因为域名解析超时引起的。


#### 解决方案

##### 原因1解决方案

按照上面的描述，我可以换一个远程仓库，换成国内的就ok了。

在docker的远程仓库配置更换成国内的源，如阿里云，中科院等。

**阿里云镜像：**

```json
{
 "registry-mirrors":["https://6kx4zyno.mirror.aliyuncs.com"]
}
```

**中科院镜像：**

```json
{
    "registry-mirrors":["https://docker.mirrors.ustc.edu.cn"]
}
```


	sudo vim /etc/docker/daemon.json

在配置文件中加入阿里云的远程仓库地址。

**重启docker：**

```bash
systemctl daemon-reload 
systemctl restart docker
```

###### 原因2解决方案

如果是域名解析问题，可以直接在host重映射仓库的ip地址，跳过域名解析过程。

**查询registry-1.docker.io的ip：**

```bash
[root@Gdl ~]# dig @114.114.114.114 registry-1.docker.io

; <<>> DiG 9.11.4-P2-RedHat-9.11.4-16.P2.el7_8.6 <<>> @114.114.114.114 registry-1.docker.io
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 59258
;; flags: qr rd ra; QUERY: 1, ANSWER: 8, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;registry-1.docker.io.		IN	A

;; ANSWER SECTION:
registry-1.docker.io.	55	IN	A	3.218.162.19
registry-1.docker.io.	55	IN	A	107.23.149.57
registry-1.docker.io.	55	IN	A	3.211.199.249
registry-1.docker.io.	55	IN	A	18.232.227.119
registry-1.docker.io.	55	IN	A	3.223.220.229
registry-1.docker.io.	55	IN	A	54.85.107.53
registry-1.docker.io.	55	IN	A	23.22.155.84
registry-1.docker.io.	55	IN	A	18.213.137.78

;; Query time: 34 msec
;; SERVER: 114.114.114.114#53(114.114.114.114)
;; WHEN: Fri Jul 03 21:57:50 CST 2020
;; MSG SIZE  rcvd: 177

[root@Gdl ~]# 

```

显然人家的服务器是做了负载均衡的，随便选一个ip：3.218.162.19

**修改/etc/hosts:**

加入：

	3.218.162.19 registry-1.docker.io

这一条映射规则，ok，重新`docker image pull alhine:latest`



### ERROR: may require 'docker login'

>Error response from daemon: pull access denied for alpine, repository does not exist or may require 'docker login'


#### 失败原因

首先检查你的镜像名称是否正确，如果正确，那么失败的原因在于docker仓库没有登录。


###### 解决方案

没有别的办法，直接去docker hub创建一个账户，然后`docker login`登录就好了。


```bash
Login with your Docker ID to push and pull images from Docker Hub. If you don't have a Docker ID, head over to https://hub.docker.com to create one.
Username: itrace
Password: 
Login Succeeded

[root@Gdl ~]# docker image pull alpine:latest
latest: Pulling from library/alpine
df20fa9351a1: Pull complete 
Digest: sha256:185518070891758909c9f839cf4ca393ee977ac378609f700f60a771a2dfe321
Status: Downloaded newer image for alpine:latest
[root@Gdl ~]# 
[root@Gdl ~]# 
[root@Gdl ~]# docker image ls
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
alpine              latest              a24bb4013296        4 weeks ago         5.57MB
[root@Gdl ~]# 
```


### connect: permission denied


>Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get http://%2Fvar%2Frun%2Fdocker.sock/v1.37/images/json: dial unix /var/run/docker.sock: connect: permission denied


#### 失败原因

原因是当前用户不在docker用户组，将当前用户加入docker用户组，然后重启docker就可以了。


#### 解决方案

```bash
# 添加docker用户组
sudo groupadd docker 

# 查看docker用户组是否存在了
[gdl@Gdl ~]$ cat /etc/group|grep docker
docker:x:992:gdl 		# 当然我已经配置好了
					
# 将登陆用户加入到docker用户组中
sudo gpasswd -a $USER docker 

# 更新用户组
newgrp docker 

# 重启docker
systemctl daemon-reload
systemctl restart docker
```

**在非root用户就可以使用了：**

```bash
[gdl@Gdl ~]$ docker rmi a24bb4013296
Untagged: alpine:latest
Untagged: alpine@sha256:185518070891758909c9f839cf4ca393ee977ac378609f700f60a771a2dfe321
Deleted: sha256:a24bb4013296f61e89ba57005a7b3e52274d8edd3ae2077d04395f806b63d83e
Deleted: sha256:50644c29ef5a27c9a40c393a73ece2479de78325cae7d762ef3cdc19bf42dd0a
[gdl@Gdl ~]$ 
[gdl@Gdl ~]$ 
[gdl@Gdl ~]$ 
[gdl@Gdl ~]$ docker image pull alpine:latest
latest: Pulling from library/alpine
df20fa9351a1: Pull complete 
Digest: sha256:185518070891758909c9f839cf4ca393ee977ac378609f700f60a771a2dfe321
Status: Downloaded newer image for alpine:latest
[gdl@Gdl ~]$ 
[gdl@Gdl ~]$ 
[gdl@Gdl ~]$ docker image ls
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
alpine              latest              a24bb4013296        4 weeks ago         5.57MB
[gdl@Gdl ~]$ 
```






## 尚未解决的问题




