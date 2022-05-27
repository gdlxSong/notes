---
title: ssh client
sidebar_position: 3
---


- ssh 连接
- ssh 隧道
    - ssh 本地端口转发
    - ssh 远程端口转发


## ssh 远程连接

1. 秘钥配置：使用 `ssh-keygen` 生成 publickey 和 privatekey 存在 `$HOME/.ssh/` 路径下。
2. 将公钥 `$HOME/.ssh/id_rsa.pub` 追加到远程主机的 `$HOME/.ssh/authorized_keys` 文件中。
3. ssh root@tomas 连接远程 ssh 终端。


```bash
$ ssh user@host 'mkdir -p .ssh && cat >> .ssh/authorized_keys' < ~/.ssh/id_rsa.pub
```

> note: ssh-keyagen 生成秘钥的时候不加密码更好使。

```bash
## 登陆远程
ssh username@host 
## 指定端口
ssh -p 22 username@host
## 指定登陆的私钥
ssh -i id_rsa_idc username@host
## 远程执行命令
## 远程执行命令适用于脚本批量操作
ssh root@tomas 'pm2 list'
```



## ssh 隧道

ssh 提供端口转发(port forward) 功能，它能够将其他 TCP 端口的网络数据通过 SSH 链接来转发，并且自动提供了相应的加密及解密服务。这一过程有时也被叫做隧道（tunneling），这是因为 SSH 为其他 TCP 链接提供了一个安全的通道来进行传输而得名。



> note: ssh 的端口转发与 iptables 不同，他是基于传输层和应用层的数据转发和路由。



### ssh 本地端口转发

本地端口转发通俗的说来就是将远程的资源映射到本地，使得用户如同访问本地资源一样访问远程资源。

> example: 有远程数据库 mariadb(139.198.126.50:3306), 假使用户想通过 localhost:3306 访问远程 mariadb，那么我们应该如何做呢？

```bash
ssh -CfNgL 0.0.0.0:3306:139.198.126.50:3306 root@localhost
```

```bash
## -L 做本地端口转发
## proxy-host 表示代理转发的主机
## proxy-port 表示代理转发的端口
## target-host 表示目标资源所在主机
## target-port 表示目标资源主机端口
## tunnel-host 表示 ssh-server 所在主机，隧道由 ssh-server 建立
$ ssh -CfNgL proxy-host:proxy-port:target-host:target-port tunnel-host
```


ssh 选项：
- -C	压缩传输数据
- -f	建立SSH连接后放置后台，静默模式
- -N	不要执行远程命令。 这对于仅转发端口很有用（仅限协议版本2）
- -g	允许远程主机连接本地端口转发
- -T    表示不需要为此随时连接分配TTY，表示只传输数据，不执行命令
- -L	指定本地（客户端）主机上的给定端口要转发到远程端的给定主机和端口。这通过分配一个套接字侦听本地端口，可选绑定到指定的bind_address工作。每当与此端口建立连接时，都会通过安全通道转发连接，	并从远程机器连接到主机端口主机端口，记住本地转发时候用L选项就可以了。


现有两个场景：

#### 场景一：

远程有一个 tomcat(139.198.126.50:80)，我想通过本地主机Dong的 localhost:80 访问该资源。

```bash
## 在本地通过 ssh-server 构建一个 http 代理
$ ssh -CfNgL 0.0.0.0:80:139.198.126.50:80 root@localhost
```

#### 场景二：

![ssh-client-port-forward-example](/images/ssh-client-port-forward-example.png)

如图存在 主机A，B，C，主机 A 和 B 处于同一局域网，主机 A 有绑定公网IP。现在主机 C 想要通过主机 A 访问主机 B 上面的 tomcat(172.10.20.3:80) 服务。


1. 通过跳板机A实现HTTP代理

```bash
## 在主机 A 上执行：
$ ssh -CfNgL 0.0.0.0:80:172.10.20.3:80 root@172.10.20.2
```

2. 直接在 主机C上做本地端口转发

```bash
## 在主机 C 上执行
$ ssh 0.0.0.0:80:172.10.20.2:80 root@139.198.126.50
```


### ssh远程端口转发

远程端口转发通过远程主机代理本地服务。

```bash
## remote-host: 远程代理主机需要监听的地址
## remote-port: 远程代理主机端口
## target-host: 本地目标服务地址
## target-port: 本地目标服务端口
## remotehost:  远程主机，配置端口转发需要登录
$ ssh -CNfgR  remote-host:remote-port:target-host:target-port remotehost
```


ssh 选项：
- -C	压缩传输数据
- -f	建立SSH连接后放置后台，静默模式
- -N	不要执行远程命令。 这对于仅转发端口很有用（仅限协议版本2）
- -g	允许远程主机连接本地端口转发
- -R    表示远程端口转发


#### 场景 Demo

我在本地机器上构建 docusaurus 博客系统，现在我想讲博客运行在本地(192.168.3.226:3000)，通过我的云服务器(139.198.126.50)代理出去。

```bash
$ ssh -CNfgR 0.0.0.0:60080:192.168.3.226:3000 root@139.198.126.50
```
!DONE, 我现在就可以通过 `http://139.198.126.50:60080` 访问我的博客了。



> note: 不要忘记配置防火墙规则。





### How to make SSH remote port forward that listens 0.0.0.0 ？


> stackoverflow: https://stackoverflow.com/questions/23781488/how-to-make-ssh-remote-port-forward-that-listens-0-0-0-0

**解决方案:**

将代理机器(跳板机) 上的 `/etc/ssh/sshd_config` 中 `GatewayPorts` 变量设置为 yes。 







> 反向(远程)端口转发 22, ssh 单连接可能不稳定，建议使用 autossh/frp










