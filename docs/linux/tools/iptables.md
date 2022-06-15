---
title: iptables
sidebar_position: 1
---



在早期的 Linux 系统中，默认使用的是 iptables 配置防火墙。尽管新型 的 firewalld 防火墙已经被投入使用多年，但是大量的企业在生产环境中依然出于各种原因而继续使用 iptables。考虑到 iptables 在当前生产环境中还具有顽强的生命力，我觉得还是有必要再好好地讲解一下这项技术。



### iptables 简介

1、什么是iptables？

> iptables 是 Linux 防火墙工作在用户空间的管理工具，是 netfilter/iptablesIP 信息包过滤系统是一部分，用来设置、维护和检查 Linux 内核的 IP 数据包过滤规则。

2、iptables特点

> iptables 是基于内核的防火墙，功能非常强大；iptables 内置了filter，nat和mangle三张表。所有规则配置后，立即生效，不需要重启服务。

### iptables 组成

iptables的结构是由表（tables）组成，而tables是由链组成，链又是由具体的规则组成。因此我们在编写iptables规则时，要先指定表，再指定链。tables的作用是区分不同功能的规则，并且存储这些规则。


![iptables_tables.png](/images/iptables_tables.png)



### iptables 的内置表

- **nat:**

    - 用于网络地址装换。
    - 包含 prerouting, output, postrouting 规则链。
    - tips: 相对而言我更喜欢 `natp`。

- **filter:**
    - 用于过滤数据包。
    - 包含 input, forward, output 规则。

- **mangle:**
    - 用于修改数据包，流量整形，给数据包打标识等。
    - 包含 prerouting, input, forward, output, postrouting 规则。



### iptables 的内置规则链

![iptables_rule_chain_arch.png](/images/iptables_rule_chain_arch.png)



- prerouting: 修改目的地址，用来做 DNAT。
- input: 匹配目标IP是本机的数据包。
- forward: 匹配流经本机的数据包。
- output: 出口数据包 ， 一般不在此链上做配置。
- postrouting: 修改源地址，用来做 SNAT。如：局域网共享一个公网IP接入Internet。



## Installation & Usage

```bash
# stop firewall
systemctl stop firewalld //关闭firewalld服务
systemctl disable firewalld //禁止firewalld开机自启动

# install iptables.
yum -y install iptables-services

# start iptables
systemctl start iptables //启动iptables
systemctl start iptables //设置iptables开机自启动

# configuration
/etc/sysconfig/iptables

# save configurations.
iptables-save > /etc/sysconfig/iptables

# backup configurations.
cp /etc/sysconfig/iptables etc/sysconfig/iptables.20220614

# recover configurations.
iptables-restore < etc/sysconfig/iptables.20220614
```




### Commands

> iptables [-t 表名] 命令选项 ［链名］ ［条件匹配］ ［-j 目标动作或跳转］

![iptables_tables_commands.jpg](/images/iptables_tables_commands.jpg)


**目标动作:**

- *ACCEPT:* 允许数据包通过
- *DROP:* 直接丢弃数据包，不给任何回应信息
- *REJECT:* 拒绝数据包通过，必要时会给数据发送端一个响应的信息。
- *LOG:* 在/var/log/messages文件中记录日志信息，然后将数据包传递给下一条规则
- *SNAT:* 源地址转换，支持转换为单IP，也支持转换到IP地址池
- *DNAT:* 目的地址转换，支持转换为单IP，也支持转换到IP地址池
- *MASQUERADE:* 动态SNAT转换（适用于动态 IP 场景 ）



```bash
-A 在指定链的末尾添加（append）一条新的规则
-D 删除（delete）指定链中的某一条规则，可以按规则序号和内容删除
-I 在指定链中插入（insert）一条新的规则，默认在第一行添加
-R 修改、替换（replace）指定链中的某一条规则，可以按规则序号和内容替换
-L 列出（list）指定链中所有的规则进行查看
-E 重命名用户定义的链，不改变链本身
-F 清空（flush）
-N 新建（new-chain）一条用户自己定义的规则链
-X 删除指定表中用户自定义的规则链（delete-chain）
-P 设置指定链的默认策略（policy）
-Z 将所有表的所有链的字节和数据包计数器清零
-n 使用数字形式（numeric）显示输出结果
-v 查看规则表详细信息（verbose）的信息
-V 查看版本(version)
-h 获取帮助（help）
```





### Example

```bash
# 列出所有规则
iptables -nL --line-number

# 拒绝所有人访问服务器（作为最后一条规则）
iptables -A INPUT -j DROP
# 禁止本机访问 百度
iptables -A OUTPUT -d www.baidu.com -j DROP
# 禁止 10.10.10.10 ping 通本机
iptables -A INPUT -s 10.10.10.10 -p icmp -j DROP

# 允许10.10.10.1主机访问本机
iptables -I INPUT 2 -s 10.10.10.1 -j ACCEPT

# 删除 filter 表中 INPUT 链中的第二条规则（默认操作filter表）
iptables -D INPUT 2

# 设置 filter 表 INPUT 链的默认规则是 DROP
iptables -P INPUT DROP

# 清空filter 表中INPUT链上的规则
iptables -F INPUT 
# 清空filter 表中所有链上的规则
iptables -F 
# 清空NAT表中PREROUTING链上的规则
iptables -t nat -F PREROUTING 
# 清空NAT表中所有链上的规则
iptables -t nat -F 


# 清空 filter 表中 INPUT 链上的计数器
iptables -Z INPUT


# 允许外部数据访问本机80端口
iptables -A INPUT -p tcp –dport 80 -j ACCEPT


# 将内网 192.168.1.0/24 转换为公网18.18.18.18地址；SNAT，用于访问互联网
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -j SNAT --to 18.18.18.18
# 将内网 192.168.1.0/24 映射到公网地址池
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -j SNAT --to 18.18.18.18-18.18.18.28
# 把从eth0口进来访问TCP/80端口的数据包目的地址改成192.168.1.1
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to 192.168.1.1
# 把从eth0口进来访问TCP/80端口的数据包目的地址改成192.168.1.1-192.168.1.10地址池
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to 192.168.1.1-192.168.1.10
# 将源地址是 192.168.1.0/24 的数据包进行地址伪装，转换成 eth0 上的 IP 地址
iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE

# 将目前已运行的服务端口全部放行！无风险，良心推荐使用
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
# 拒绝来自某 MAC 地址的数据包进入本机
iptables -A INPUT -m mac --mac-source xx:xx:xx:xx:xx:xx -j DROP


# -m limit --limit 匹配速率, 使用这两条规则实现数据包速率
iptables -A FORWARD -d 192.168.1.1 -m limit --limit 50/s -j ACCEPT
iptables -A FORWARD -d 192.168.1.1 -j DROP

# 允许访问本机TCP/22,53,80,443端口 
iptables -A INPUT -p tcp -m multiport --dports 22,53,80,443 -j ACCEPT
# 开通多端口
iptables -A INPUT -p tcp -m multiport --dport 20,21,25,110,1250:1280 -j ACCEPT

# 禁止 ip 范围
iptables -A FORWARD -p tcp -m iprange --src-range 192.168.1.20-192.168.1.99 -j DROP


# 拒绝新建连接的数据包
iptables -A INPUT -p tcp -m state --state NEW -j DROP 
# 允许已经连接的数据包
iptables -A INPUT -p tcp -m state --state ESTABLISHED,RELATED -j ACCEPT
```







