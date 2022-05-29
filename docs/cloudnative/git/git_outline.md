---
title: "Git, 初めまして，どうぞよろしく"
date: 2020-03-15T13:00:41+08:00
lastmod: 2020-03-15T13:00:41+08:00
description: ""
tags: ["git"]
categories: ["git"]
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



## Git的安装

```bash
# 在Centos
$ sudo yum install git
```

```bash
# 在Debian
$ sudo apt-get install git
```

## Git的配置

```bash
 git config #查看本机是否配置了个人信息
 git config --global user.name "……" #定义全局的用户名
 git config --global user.email "……" #定义全局的邮件地址
 git config --list #查看配置信息
 ```
```bash
# git config key也可以查看环境配置
PS C:\Users\Administrator\Desktop\testGit> git config user.name
gdlxSong
```



## Git的特点

- 速度

- 简单的设计

- 对非线性开发模式的强力支持（允许成千上万个并行开发的分支）

- 完全分布式

- 有能力高效管理类似 Linux 内核一样的超大规模项目（速度和数据量）

- 近乎所有操作都是本地执行

- Git 支持多种数据传输协议，https://，git://或者SSH 传输协议

> 可以在自己的服务器搭建git，使用ssh传输协议访问user@server:path/to/repo.git

## Git的原理

Git 对待数据更像是一个快照流。 每一次的git add都会将更改或新增的文件生成一个blob对象纳入git的数据仓库，git rm也不会丢失。 然后我们所见的版本管理是对该blob对象的索引进行管理，就形成了一个层次的抽象
，那就是将数据的物理存储和数据管理分开，在管理数据的时候，以某一时刻git commit生成的tree对象作为一次版本迭代，但tree对象依赖的仅仅是blob的索引。很高明的设计，和计算机的内存映射原理类似。


## Git的三种状态

已提交（committed）、已修改（modified）和已暂存（staged）

由此引入 Git 项目的三个工作区域的概念：Git 仓库、工作目录以及暂存区域。

### Git仓库

Git 仓库目录是 Git 用来保存项目的元数据和对象数据库的地方。 这是 Git 中最重要的部分，从其它计算机克隆仓库时，拷贝的就是这里的数据。

### Git暂存区

暂存区域是一个文件，保存了下次将提交的文件列表信息，一般在 Git 仓库目录中。 有时候也被称作`‘索引’`，不过一般说法还是叫暂存区域, 其实就是.git/index的二进制文件。

```bash
PS C:\Users\Administrator\Desktop\testGit> git ls-files --stage
100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 0       a.txt
100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 0       test/a.txt
```

可以使用`git ls-files --stage`来查看暂存区内容，其次是暂存区文件包含路径信息。



### Git工作目录

工作目录是对项目的某个版本独立提取出来的内容。 这些从 Git 仓库的压缩数据库中提取出来的文件，放在磁盘上供你使用或修改。





## Git的基本工作流程如下：

1. 在工作目录中修改文件。

2. 暂存文件，将文件的快照放入暂存区域。

3. 提交更新，找到暂存区域的文件，将快照永久性存储到 Git 仓库目录。




## 获取仓库

### 本地创建 init

```bash
$ mkdir testGit
$ cd testGit/
$ git init
```
该命令将创建一个名为 .git 的子目录，这个子目录含有你初始化的 Git 仓库中所有的必须文件，这些文件是 Git 仓库的骨干。 但是，在这个时候，我们仅仅是做了一个初始化的操作，你的项目里的文件还没有被跟踪。 

### 克隆现有的仓库 clone

```bash
$ git clone https://github.com/libgit2/libgit2

# 或者你可以指定本地名称
$ git clone https://github.com/libgit2/libgit2 mylibgit
```