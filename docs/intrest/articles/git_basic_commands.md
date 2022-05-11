---
title: "Git基本命令"
date: 2020-03-15T14:21:35+08:00
lastmod: 2020-03-15T14:21:35+08:00
description: ""
tags: ["Git", "xGdl"]
categories: ["Git"]
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

![This is an image in `static/images` folder.](/images/example.jpg)


> 努力する人は希望を语り、怠ける人は不満を语る。——いのうえ　やすし


## Git的基本命令应用

### git init

```bash
git init [-q | --quiet] [--bare] [--template=<template_directory>]
	  [--separate-git-dir <git dir>]
	  [--shared[=<permissions>]] [directory]
```
该命令将创建一个名为 .git 的子目录，这个子目录含有你初始化的 Git 仓库中所有的必须文件，这些文件是 Git 仓库的骨干。 但是，在这个时候，我们仅仅是做了一个初始化的操作，你的项目里的文件还没有被跟踪


*\-\-bare*
> Create a bare repository. If GIT_DIR environment is not set, it is set to the current working directory. 就是没有.git目录，数据仓库裸露出来。

### git clone

```bash
git clone [--template=<template_directory>]
	  [-l] [-s] [--no-hardlinks] [-q] [-n] [--bare] [--mirror]
	  [-o <name>] [-b <name>] [-u <upload-pack>] [--reference <repository>]
	  [--dissociate] [--separate-git-dir <git dir>]
	  [--depth <depth>] [--[no-]single-branch] [--no-tags]
	  [--recurse-submodules[=<pathspec>]] [--[no-]shallow-submodules]
	  [--[no-]remote-submodules] [--jobs <n>] [--sparse] [--] <repository>
	  [<directory>]
```
*\[\<directory\>\]*

> The name of a new directory to clone into. The "humanish" part of the source repository is used if no directory is explicitly given (repo for /path/to/repo.git and foo for host.xz:foo/.git). Cloning into an existing directory is only allowed if the directory is empty.




可以通过git clone --bare来创建服务端仓库：
```bash
PS C:\Users\Administrator\Desktop> ls


    目录: C:\Users\Administrator\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        2020/3/10     21:20                hugo
d-----         2020/1/5     19:36                KnowledgeBase
d-----        2020/2/21     15:48                markdown-js
d-----         2020/1/5     15:03                nginxSee
d-----        2020/3/14     18:29                Projects
d-----        2020/3/15     13:30                testGit
d-----        2020/3/14     19:13                xlsx


PS C:\Users\Administrator\Desktop> git clone .\testGit testgit.git --bare
Cloning into bare repository 'testgit.git'...
done.
PS C:\Users\Administrator\Desktop> ls


    目录: C:\Users\Administrator\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        2020/3/10     21:20                hugo
d-----         2020/1/5     19:36                KnowledgeBase
d-----        2020/2/21     15:48                markdown-js
d-----         2020/1/5     15:03                nginxSee
d-----        2020/3/14     18:29                Projects
d-----        2020/3/15     13:30                testGit
d-----        2020/3/15     14:40                testgit.git
d-----        2020/3/14     19:13                xlsx


PS C:\Users\Administrator\Desktop>
```

如果testgit.git放到服务端就可以通过https或者ssh传输协议进行clone了
```bash
git clone user@www.yqun.xyz:/home/user/Git/testgit.git
```


### git status

```bash
git status
```

查看工作区状态


### git diff

```bash
git diff 				#可以查看工作区(work dict)和暂存区(stage)的区别
git diff --cached 		#可以查看暂存区(stage)和分支(master)的区别
git diff HEAD -- <file> #可以查看工作区和版本库里面最新版本的区别

# git diff --staged 和 --cached效果相同，不过需要更高的版本支持。
```
查看内容修改

### git log

```bash
git log [<options>] [<revision range>] [[--] <path>…​]
```
```bash
-p
	-p参数输出更多信息

-number
	用来指定显示记录的条数

–skip=[skip]
	--skip=[skip]参数用来指定跳过前几条日志。
	# git log --skip=1 -2 --oneline #命令用来查看第二和第三条日志
--reflog
	Pretend as if all objects mentioned by reflogs are listed on the command line as <commit>.
–-stat
	显示每次更改的统计信息
--pretty
	--pretty[=<format>]
--format
	# git log --pretty=format:"%H"
	# git log --format="%H"
	%H: commit hash
	%h: 缩短的commit hash
	%T: tree hash
	%t: 缩短的 tree hash
	%P: parent hashes
	%p: 缩短的 parent hashes
	%an: 作者名字
	%aN: mailmap的作者名字 (.mailmap对应，详情参照git-shortlog(1)或者git-blame(1))
	%ae: 作者邮箱
	%aE: 作者邮箱 (.mailmap对应，详情参照git-shortlog(1)或者git-blame(1))
	%ad: 日期 (--date= 制定的格式)
	%aD: 日期, RFC2822格式
	%ar: 日期, 相对格式(1 day ago)
	%at: 日期, UNIX timestamp
	%ai: 日期, ISO 8601 格式
	%cn: 提交者名字
	%cN: 提交者名字 (.mailmap对应，详情参照git-shortlog(1)或者git-blame(1))
	%ce: 提交者 email
	%cE: 提交者 email (.mailmap对应，详情参照git-shortlog(1)或者git-blame(1))
	%cd: 提交日期 (--date= 制定的格式)
	%cD: 提交日期, RFC2822格式
	%cr: 提交日期, 相对格式(1 day ago)
	%ct: 提交日期, UNIX timestamp
	%ci: 提交日期, ISO 8601 格式
	%d: ref名称
	%e: encoding
	%s: commit信息标题
	%f: sanitized subject line, suitable for a filename
	%b: commit信息内容
	%N: commit notes
	%gD: reflog selector, e.g., refs/stash@{1}
	%gd: shortened reflog selector, e.g., stash@{1}
	%gs: reflog subject
	%Cred: 切换到红色
	%Cgreen: 切换到绿色
	%Cblue: 切换到蓝色
	%Creset: 重设颜色
	%C(...): 制定颜色, as described in color.branch.* config option
	%m: left, right or boundary mark
	%n: 换行

--oneline
	# git log --oneline
	# git log --pretty=oneline
--raw
	和oneline正好相反，用于显示更多的信息
--graph
	# git log --graph
	# git log --pretty=graph

--since, --after
	仅显示指定时间之后的提交。
	# git log --since=2.weeks

--until, --before
	仅显示指定时间之前的提交。
	# git log --pretty="%h - %s" --author=gitster --since="2008-10-01" --before="2008-11-01" --no-merges --t

	#时间格式：
		2.weeks
		"2008-10-01"
		"2 years 1 day 3 minutes ago"
--author
	仅显示指定作者相关的提交。
--committer
	仅显示指定提交者相关的提交。
--grep
	仅显示含指定关键字的提交
-S
	仅显示添加或移除了某个关键字的提交
	#$ git log -Sfunction_name
```


### git reflog

同git log --reflog

### git status

```bash

```

### git commit

```bash
-m
	添加提交信息
	# git commit -m "Story 182: Fix benchmarks for speed"
-a
	跳过git add阶段
	# git commit -a -m 'added new benchmarks'
--amend
	尝试重新提交
	$ git commit --amend
```

### git rm

```bash
--cached
	将某一个文件或者文件夹提出git的监控。然后你可以添加.gitignore文件来忽略它。
使用glob匹配
	#$ git rm log/\*.log
	#$ git rm \*~
```

让我来分析一下git rm到底干了啥子事儿：
```bash
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
nothing to commit, working tree clean
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git rm .\test\a.txt
rm 'test/a.txt'
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        deleted:    test/a.txt

PS C:\Users\Administrator\Desktop\testGit>



-------

PS C:\Users\Administrator\Desktop\testGit> git reset HEAD --hard
HEAD is now at a38a45c second commited
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
nothing to commit, working tree clean
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> rm .\test\a.txt
PS C:\Users\Administrator\Desktop\testGit> git add *
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        deleted:    test/a.txt

PS C:\Users\Administrator\Desktop\testGit>
```
所以git rm == rm + git add

那么，--cached又做了什么呢？

```bash
PS C:\Users\Administrator\Desktop\testGit> git reset HEAD --hard
HEAD is now at a38a45c second commited
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
nothing to commit, working tree clean
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git rm .\test\a.txt --cached
rm 'test/a.txt'
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        deleted:    test/a.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        test/

PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git reset HEAD --hard
HEAD is now at a38a45c second commited
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
nothing to commit, working tree clean
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> git rm .\test\a.txt --cached
rm 'test/a.txt'
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        deleted:    test/a.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        test/

PS C:\Users\Administrator\Desktop\testGit>
PS C:\Users\Administrator\Desktop\testGit> ls .\test\


    目录: C:\Users\Administrator\Desktop\testGit\test


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        2020/3/15     16:01              6 a.txt


PS C:\Users\Administrator\Desktop\testGit>

---------


PS C:\Users\Administrator\Desktop\testGit> git reset HEAD --hard
HEAD is now at a38a45c second commited
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
nothing to commit, working tree clean
PS C:\Users\Administrator\Desktop\testGit> echo "create new file" > .\test\b.txt
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
Untracked files:
  (use "git add <file>..." to include in what will be committed)

        test/b.txt

nothing added to commit but untracked files present (use "git add" to track)
PS C:\Users\Administrator\Desktop\testGit> git rm .\test\a.txt
rm 'test/a.txt'
PS C:\Users\Administrator\Desktop\testGit> git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        deleted:    test/a.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        test/

PS C:\Users\Administrator\Desktop\testGit>
```
其实让我们思考一下，所谓的git追踪是什么时候开始的？显然是git add，是的文件在仓库中生成快照blob文件，然后stage area引用该blob名字开始的，那么反之我们将文件对应blob名字从'索引'中移除就不再追踪了。

但应当注意的是七blob文件无论如何也是没有被git rm删除的。


### git mv

```bash
#git mv == mv + git add

$ mv README.md README
$ git rm README.md
$ git add README
```

### git reset

> reference:https://www.jianshu.com/p/c2ec5f06cf1a

> Reset current HEAD to the specified state; 就是让HEAD指针指向其他地方。

#### git reset有三种模式

```bash
1. git reset --hard
2. git reset --mixed(默认mixed模式执行reset)
3. git reset --soft
```
> reset命令，其执行的操作是：（1）HEAD和所在分支branch指针同时移位。 HEAD指向branch。 （2）soft模式下不改变暂存区和工作目录; mixed模式下使用仓库覆盖暂存区; hard模式下使用仓库文件覆盖暂存区和工作目录。

> 其实reset的本质就是改变HEAD所在分支的branch的值(如果HEAD指向branch的话)。

```bash
# 当前所在分支branch1
git reset --hard branch2
# 此时branch1和branch2指向同一个commit节点。
```

> 还可以reset单个文件，规则一样的。

```bash
git reset <commit_id> <file_path>
```

