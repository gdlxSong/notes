---
title: ssh server
sidebar_position: 2
---

- sshd 管理
- sshd 配置


### sshd 管理

```bash
################### sshd #################
## 开启服务
systemctl start sshd   
## 关闭服务
systemctl stop sshd    
## 重启服务
systemctl restart sshd 
## 重新加载服务配置
systemctl reload sshd  
## 设定服务开机启动
systemctl enable sshd  
## 设定服务开机不启动
systemctl disable sshd 
## 列出已经开启服务当前状态
systemctl list-units
## 列出服务的倚赖
systemctl list-dependencies 
## 设定系统启动级别为多用户模式（无图形）
systemctl set-default multi-user.target 
## 设定系统启动级别为图形模式
systemctl set-default graphical.target 
## 查看服务状态，inactive(不可用)，active（可用） 
systemctl status sshd  
```





### sshd 配置 

> path: /etc/ssh/ssh_config

```yaml
# Port 22：指定监听的端口号；
# ListenAddress 0.0.0.0：指定监听的IP地址默认值0.0.0.0表示监听本机所有的IP地址。
# PermitRootLogin：是否允许root用户利用SSH远程登录。
# PermitEmptyPasswords：是否允许使用空密码的用户远程登录。
# LoginGraceTime：限制用户登录验证过程的时间，默认是2分钟。
# MaxAuthTries：限制用户登录时的最大重试次数，默认是6次
# DenyUsers：设置黑名单，拒绝指定的用户登录
# AllowUsers：设置白名单，只允许指定的用户登录
# 白名单和黑名单需要在/etc/ssh/sshd_config 中自行添加设置
# AllowUsers root@192.168.1.1
# DenyUsers root@192.168.1.1
# PubkeyAuthentication yes 启用基于密钥对的认证方式
# AuthorizedKeysFile .ssh/authorized_keys 指定保存用户公钥的数据文件路径
# PasswordAuthentication yes 启用基于口令的认证方式
```






## References

- [ssh 端口转发](https://kionf.com/2017/01/09/linux-ssh/)
