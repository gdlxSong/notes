---
title: "千里之行，始于切糕(git checkout)"
date: 2020-04-03T21:37:01+08:00
lastmod: 2020-04-03T21:37:01+08:00
description: ""
tags: ["git", "checkout", "xGdl"]
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


>美人兮美人，为暮雨兮为朝云。

## 理解分支

要理解checkout就需要从git的分支说起。很久很久以前....


- 我们知道，在git add的时候，会生成所提交的文件的blob文件存入仓库。在git commit的时候会生成当前目录信息的tree对象和包含提交信息的commit对象存储入库。
![git存储的对象](/images/gitobject.png)

- 每一次的git commit操作都会生成一个commit对象，即一次完整的快照。
![git快照关系图](/images/gitcommit.png)

- 那么分支呢？brunch？分支的本质就是指向commit对象的可变指针。master是主分支的默认名称。

![git分支](/images/gitrepos.png)

- 多个分支是啥情况？

![多个分支示意图](/images/gitbrunch.png)

## checkout命令

```bash
1. git checkout [-q] [<commit>] [--] <paths> ...

2. git checkout [<branch>]

3. git checkout [-m] [ [-b | -- orphan ] <new_branch>]  [start_point] 
```

### HEAD, master, hash-id
```bash
Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit (master)
$ cat .git/HEAD
ref: refs/heads/master

Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit (master)
$ cat .git/refs/heads/
b1      master

Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit (master)
$ cat .git/refs/heads/master
e7b21b04d64b29ee10924759e4b58763d01958bf

Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit (master)
```

>从上面我们可以知道HEAD，分支，包括tag的本质都是hash-id。

>分支切换的本质：最大的功臣就是.git目录下的HEAD引用，她宛如一个芭蕾舞者，从一个分支飘逸的跳到另一个分支，虽无声无息，却精准无比。

### git checkout的功能：

1. 切换分支
```bash
//1. 切换指定分支：
$ git checkout b1

//2. 切换到某一个commit对象
$ git checkout 191ae47

//3. 使用tag来切换到某一个commit对象
$ git checkout tagname

```

需要注意的是：当HEAD指向的不是分支的时候，如
```bash
Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit ((191ae47...))
$ git checkout 191ae47
HEAD is now at 191ae47 this is first commited.

Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit ((191ae47...))
$ cat .git/HEAD
191ae47d4711597e5683bf69370a4dfadd4002d3

Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit ((191ae47...))
$ git status
HEAD detached at 191ae47
nothing to commit, working tree clean

```

那么此时，git处于"分离头指针状态"。

>在"分离头指针状态", git没有办法对仓库进行管理。

2. 检出文件

在1中，切换分支也伴随着文件的检出，即是用切换的目的分支的commit对象所对应的快照覆盖工作目录和暂存区。

```bash
git checkout [-q] [<commit>] [--] <paths> ...

# 检出文件：
# 1. 指定文件, 检出当前分支的某一文件，这个reset也可以办到。
$ git checkout -- a.txt

# 2. 指定检出某一分支的某一文件.
$ git checkout b1 -- a.txt

# 3. 指定检出某一commit对象的某一文件
$ git checkout 191ae47 -- a.txt
```

> 存在 -- 的原因在于防止分支名与文件名同名。


3. 创建并切换分支

```bash
$ git checkout -b b2
```


4. 基于指定的hash-id进行创建分支并切换分支
```bash
git checkout -b <new_branch> <start point>

# 例子.
$ git checkout -b newbrunch 191ae47 
```


5. 切换到分支游离状态

```bash
git checkout --datch <branch>
# 就是让HEAD指向一个hash-id， 处于"分离头指针状态"
```

6. 强制创建分支

```bash
git checkout -B <branch>
# 如果分支存在的情况下，覆盖原来的同名分支。
```

7. 创建'干净'的分支。

```bash
git checkout --orphan <branch>

# 就是将当前分支内容保留到工作区，创建一个新的分支，但是新的分支上不存在任何提交记录，赤裸裸的，就像刚刚git init一样。
```

8. 切换并合并分支
```bash
git checkout --merge <branch>
# 这个命令适用于在切换分支的时候，将当前分支修改的内容一起打包带走，同步到切换的分支下。
# 危险，慎用。
```

9. 打补丁
```bash
git checkout -p <branch>
```

```bash
Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit (master)
$ git checkout -p b1
diff --git b/a.txt a/a.txt
index d8a2f12..e69de29 100644
--- b/a.txt
+++ a/a.txt
@@ -1,3 +0,0 @@
-12
-123456
-1234567.
Apply this hunk to index and worktree [y,n,q,a,d,e,?]? y
error: patch failed: a.txt:1
error: a.txt: patch does not apply
The selected hunks do not apply to the index!
Apply them to the worktree anyway? y


Administrator@CHINA-20200103V MINGW64 ~/Desktop/testGit (master)
$ git status
On branch master
Your branch is ahead of 'origin/master' by 1 commit.
  (use "git push" to publish your local commits)

Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        modified:   a.txt

```


> 最后总结一下，reset改变的是brunch的指向，checkout改变的是HEAD的指向。