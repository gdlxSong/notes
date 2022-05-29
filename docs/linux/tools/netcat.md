---
title: "netcat"
date: 2020-06-24T23:01:18+08:00
lastmod: 2020-06-24T23:01:18+08:00
description: ""
tags: ["netcat", "linux", "net"]
categories: ["netcat"]
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


## 什么是netcat？ 

&emsp;&emsp;Netcat 是一款简单的Unix工具，使用UDP和TCP协议。 它是一个可靠的容易被其他程序所启用的后台操作工具，同时它也被用作网络的测试工具或黑客工具。 


## 安装netcat

`operator system: centos7`


如果你使用的是`yum install -y nc`，那么会出现很多问题：

当你使用上面的命令暗转后：

```bash
>netcat -z -v 118.25.216.246 1-10000 -w1
>Ncat: Version 7.50 ( https://nmap.org/ncat )
>Ncat: Connected to 127.0.0.1:1.
>Ncat: Connection refused.
```

我们通过排查：

```bash
[root@Gdl ]# whereis nc
nc: /usr/bin/nc /usr/share/man/man1/nc.1.gz
[root@Gdl ]# ls -al /usr/bin/nc
lrwxrwxrwx 1 root root 22 Jun 24 22:08 /usr/bin/nc -> /etc/alternatives/nmap
```

发现nc是一个nmap的软链接，并不是安装的netcat。其实nc(ncat)和netcat是一个东西，只是nc是nmap下面的一个组件。

### 重新安装

首先下载源码：`wget https://sourceforge.net/projects/netcat/files/netcat/0.7.1/netcat-0.7.1.tar.gz`

解压：`tar -zxvf netcat-0.7.1.tar.gz -C /usr/local`

切换目录：`cd /usr/local/netcat-0.7.1`

查看配置：`./configure`

编译安装：`make && make install`

编辑配置文件：`vi /etc/profile`

```bash
export NETCAT_HOME=/usr/local/netcat-0.7.1
export PATH=$PATH:$NETCAT_HOME/bin
```

刷新配置：`source /etc/profile`


## 使用netcat


`nc [-hlnruz][-g<网关...>][-G<指向器数目>][-i<延迟秒数>][-o<输出文件>][-p<通信端口>][-s<来源位址>][-v...][-w<超时秒数>][host][port]`


- g<网关> 设置路由器跃程通信网关，最多可设置8个。
- G<指向器数目> 设置来源路由指向器，其数值为4的倍数。
- h 在线帮助。
- i<延迟秒数> 设置时间间隔，以便传送信息及扫描通信端口。
- l 使用监听模式，管控传入的资料。
- n 直接使用IP地址，而不通过域名服务器。
- o<输出文件> 指定文件名称，把往来传输的数据以16进制字码倾倒成该文件保存。
- p<通信端口> 设置本地主机使用的通信端口。
- r 乱数指定本地与远端主机的通信端口。
- s<来源位址> 设置本地主机送出数据包的IP地址。
- u 使用UDP传输协议。
- v 显示指令执行过程。
- w<超时秒数> 设置等待连线的时间。
- z 使用0输入/输出模式，只在扫描通信端口时使用。


### 端口扫描

**tcp端口扫描：**

```bash
netcat -zv 118.25.216.246 1-1000
```

扫描118.25.216.246的1-1000端口服务。

**增加超时：**

```bash
netcat -zv -w1 118.25.216.246 1-1000
```

超时时长为1秒。

**udp端口扫描：**

```bash
netcat -zvu 118.25.216.246 1-1000 -w1
```


### 文件传输

##### 接收端：

```bash
netcat -l -p 8000 > outfile.tar
```

##### 发送端：

```bash
netcat 118.25.216.246 8000 < infile.tar
```

### 发送http请求


```bash
[root@Gdl gdl]# echo "GET / HTTP/1.1\r\rHost:yqun.xyz\r\n\r\n" | netcat -n 118.25.216.246 1313
HTTP/1.1 400 Bad Request
Content-Type: text/plain; charset=utf-8
Connection: close

400 Bad Request[root@Gdl gdl]#
```


```bash
[root@Gdl gdl]# echo "GET / HTTP/1.1\r\rHost:yqun.xyz\r\n\r\n" > request.txt
[root@Gdl gdl]# netcat www.yqun.xyz 80 < request.txt
HTTP/1.1 400 Bad Request
Server: nginx/1.6.2
Date: Wed, 24 Jun 2020 15:34:12 GMT
Content-Type: text/html
Content-Length: 172
Connection: close

<html>
<head><title>400 Bad Request</title></head>
<body bgcolor="white">
<center><h1>400 Bad Request</h1></center>
<hr><center>nginx/1.6.2</center>
</body>
</html>
[root@Gdl gdl]#

```

**发送目录：**

```bash
ls ./ -al | netcat 118.25.216.246 1313 -w2 
```


### 流媒体

```bash
netcat -l -p 5200 | mplayer
```


netcat 美中不足的是使用明文传输，而ncat就可以弥补这一不足。

