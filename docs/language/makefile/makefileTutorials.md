---
title: "Makefile语法规则详解"
date: 2020-05-03T23:24:54+08:00
lastmod: 2020-05-03T23:24:54+08:00
description: ""
tags: []
categories: []
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



## 简介

 Makefile 描述的是文件编译的相关规则，它的规则主要是两个部分组成，分别是依赖的关系和执行的命令，其结构如下所示：

 ```makefile
targets : prerequisites
    command
 ```
或者
```makefile
targets : prerequisites; command
    command
```

- targets：规则的目标，可以是 Object File（一般称它为中间文件），也可以是可执行文件，还可以是一个标签；
- prerequisites：是我们的依赖文件，要生成 targets 需要的文件或者是目标。可以是多个，也可以是没有；
- command：make 需要执行的命令（任意的 shell 命令）。可以有多条命令，每一条命令占一行。

>注意：我们的目标和依赖文件之间要使用冒号分隔开，命令的开始一定要使用Tab键。

简单的概括一下Makefile 中的内容，它主要包含有五个部分，分别是：

1. 显式规则
	
	显式规则说明了，如何生成一个或多的的目标文件。这是由 Makefile 的书写者明显指出，要生成的文件，文件的依赖文件，生成的命令。

2) 隐晦规则

	由于我们的 make 命名有自动推导的功能，所以隐晦的规则可以让我们比较粗糙地简略地书写 Makefile，这是由 make 命令所支持的。

3) 变量的定义

	在 Makefile 中我们要定义一系列的变量，变量一般都是字符串，这个有点像C语言中的宏，当 Makefile 被执行时，其中的变量都会被扩展到相应的引用位置上。

4) 文件指示

	其包括了三个部分，一个是在一个 Makefile 中引用另一个 Makefile，就像C语言中的 include 一样；另一个是指根据某些情况指定 Makefile 中的有效部分，就像C语言中的预编译 #if 一样；还有就是定义一个多行的命令。有关这一部分的内容，我会在后续的部分中讲述。

5) 注释

	Makefile 中只有行注释，和 UNIX 的 Shell 脚本一样，其注释是用“#”字符，这个就像 C/C++ 中的“//”一样。如果你要在你的 Makefile 中使用“#”字符，可以用反斜框进行转义，如：“\#”。

## 工作流程

```makefile
main:main.o test1.o test2.o
	gcc main.o test1.o test2.o -o main
main.o:main.c test.h
	gcc -c main.c -o main.o
test1.o:test1.c test.h
	gcc -c test1.c -o test1.o
test2.o:test2.c test.h
	gcc -c test2.c -o test2.o
```

&emsp;&emsp;在我们编译项目文件的时候，默认情况下，make 执行的是 Makefile 中的第一规则（Makefile 中出现的第一个依赖关系），此规则的第一目标称之为“最终目标”或者是“终极目标”。

对这些 ".o" 文件为目标的规则处理有下列三种情况：

- 目标 ".o" 文件不存在，使用其描述规则创建它；
- 目标 ".o" 文件存在，目标 ".o" 文件所依赖的 ".c" 源文件 ".h" 文件中的任何一个比目标 ".o" 文件“更新”（在上一次 make 之后被修改）。则根据规则重新编译生成它；
- 目标 ".o" 文件存在，目标 ".o" 文件比它的任何一个依赖文件（".c" 源文件、".h" 文件）“更新”（它的依赖文件在上一次 make 之后没有被修改），则什么也不做。


## 清除编译的过程文件

Makefile 文件的时候会在末尾加上这样的规则语句：
```makefile
.PHONY:clean
clean:
    rm -rf *.o test
```

## Makefile使用通配符

&emsp;&emsp;Makefile 是可以使用 shell 命令的，所以 shell 支持的通配符在 Makefile 中也是同样适用的。

|通配符|使用说明
|-|-
*|	匹配0个或者是任意个字符
？|	匹配任意一个字符
[]|	我们可以指定匹配的字符放在 "[]" 中
%|匹配任意个任意字符

```makefile
test:*.c
    gcc -o $@ $^
```

### 通配符和变量的联合使用

不能直接通过引用变量的方式来使用

```makefile
OBJ=*.c
test:$(OBJ)
    gcc -o $@ $^
```
我们去执行这个命令的时候会出现错误，提示我们没有 "*.c" 文件，实例中我们相要表示的是当前目录下所有的 ".c" 文件，但是我们在使用的时候并没有展开，而是直接识别成了一个文件。文件名是 "*.c"。


### wildcard函数展开变量中的通配符

```makefile
OBJ=$(wildcard *.c)
test:$(OBJ)
    gcc -o $@ $^
```
这样我们再去使用的时候就可以了。调用函数的时候，会帮我们自动展开函数。


## Makefile变量

### 语法

```makefile
变量的名称=值列表
```

Makefile 中的变量的使用其实非常的简单，因为它并没有像其它语言那样定义变量的时候需要使用数据类型。变量的名称可以由大小写字母、阿拉伯数字和下划线构成。等号左右的空白符没有明确的要求，因为在执行 make 的时候多余的空白符会被自动的删除。至于值列表，既可以是零项，又可以是一项或者是多项。如：

```makefile
VALUE_LIST = one two three
```

### 使用

调用变量的时候可以用 "$(VALUE_LIST)" 或者是 "${VALUE_LIST}" 来替换，这就是变量的引用。实例：

```makefile
OBJ=main.o test.o test1.o test2.o
test:$(OBJ)
      gcc -o test $(OBJ)
```

### 变量的赋值

知道了如何定义，下面我们来说一下 Makefile 的变量的四种基本赋值方式：

1. 简单赋值 ( := ) 编程语言中常规理解的赋值方式，只对当前语句的变量有效。

	```bash
	x:=foo
	y:=$(x)b
	x:=new
	test：
	      @echo "y=>$(y)"
	      @echo "x=>$(x)"
	```
	在 shell 命令行执行make test我们会看到:
	```makefile
	y=>foob
	x=>new
	```
2. 递归赋值 ( = ) 赋值语句可能影响多个变量，所有目标变量相关的其他变量都受影响。
	```bash
	x=foo
	y=$(x)b
	x=new
	test：
	      @echo "y=>$(y)"
	      @echo "x=>$(x)"
	```
	在 shell 命令行执行make test我们会看到:
	```bash
	y=>newb
	x=>new
	```
3. 条件赋值 ( ?= ) 如果变量未定义，则使用符号中的值定义变量。如果该变量已经赋值，则该赋值语句无效。
	```bash
	x:=foo
	y:=$(x)b
	x?=new
	test：
	      @echo "y=>$(y)"
	      @echo "x=>$(x)"
	```
	在 shell 命令行执行make test 我们会看到:
	```bash
	y=>foob
	x=>foo
	```
4. 追加赋值 ( += ) 原变量用空格隔开的方式追加一个新值。
	```bash
	x:=foo
	y:=$(x)b
	x+=$(y)
	test：
	      @echo "y=>$(y)"
	      @echo "x=>$(x)"
	```
	在 shell 命令行执行make test我们会看到:
	```bash
	y=>foob
	x=>foo foob
	```


## Makefile中的自动化变量

|变量|说明
|-|-
$@	|表示规则的目标文件名。如果目标是一个文档文件（Linux 中，一般成 .a 文件为文档文件，也成为静态的库文件），那么它代表这个文档的文件名。在多目标模式规则中，它代表的是触发规则被执行的文件名。
$%	|当目标文件是一个静态库文件时，代表静态库的一个成员名。
$<	|规则的第一个依赖的文件名。如果是一个目标文件使用隐含的规则来重建，则它代表由隐含规则加入的第一个依赖文件。
$?|	所有比目标文件更新的依赖文件列表，空格分隔。如果目标文件时静态库文件，代表的是库文件（.o 文件）。
$^	|代表的是所有依赖文件列表，使用空格分隔。如果目标是静态库文件，它所代表的只能是所有的库成员（.o 文件）名。一个文件可重复的出现在目标的依赖中，变量“$^”只记录它的第一次引用的情况。就是说变量“$^”会去掉重复的依赖文件。
$+	|类似“$^”，但是它保留了依赖文件中重复出现的文件。主要用在程序链接时库的交叉引用场合。
$*	|在模式规则和静态模式规则中，代表“茎”。“茎”是目标模式中“%”所代表的部分（当文件名中存在目录时，“茎”也包含目录部分）。

### 栗子1

```bash
test:test.o test1.o test2.o
	gcc -o $@ $^
test.o:test.c test.h
	gcc -o $@ $<
test1.o:test1.c test1.h
	gcc -o $@ $<
test2.o:test2.c test2.h
	gcc -o $@ $<
```

这个规则模式中用到了 "$@" 、"$<" 和 "$^" 这三个自动化变量，对比之前写的 Makefile 中的命令，我们可以发现 "$@" 代表的是目标文件test，“$^”代表的是依赖的文件，“$<”代表的是依赖文件中的第一个。我们在执行 make 的时候，make 会自动识别命令中的自动化变量，并自动实现自动化变量中的值的替换，这个类似于编译C语言文件的时候的预处理的作用。


### 栗子2

```bash
lib:test.o test1.o test2.o
    ar r $?
```

假如我们要做一个库文件，库文件的制作依赖于这三个文件。当修改了其中的某个依赖文件，在命令行执行 make 命令，库文件 "lib" 就会自动更新。"$?" 表示修改的文件。

GNU make 中在这些变量中加入字符 "D" 或者 "F" 就形成了一系列变种的自动化变量，这些自动化变量可以对文件的名称进行操作。

|变量|说明
|-|-
$(@D)|表示文件的目录部分（不包括斜杠）。如果 "$@" 表示的是 "dir/foo.o" 那么 "$(@D)" 表示的值就是 "dir"。如果 "$@" 不存在斜杠（文件在当前目录下），其值就是 "."。
$(@F)|表示的是文件除目录外的部分（实际的文件名）。如果 "$@" 表示的是 "dir/foo.o"，那么 "$@F" 表示的值为 "foo.o"。
$(*D)&nbsp;$(*F)|分别代表 "茎" 中的目录部分和文件名部分
$(%D)&nbsp;$(%F)|当以 "archive(member)" 形式静态库为目标时，分别表示库文件成员 "member" 名中的目录部分和文件名部分。踏进对这种新型时的目标有效。
$(<D)&nbsp;$(<F)|表示第一个依赖文件的目录部分和文件名部分。
$(^D)&nbsp;$(^F)|分别表示所有依赖文件的目录部分和文件部分。
$(+D)&nbsp;$(+F)|分别表示所有的依赖文件的目录部分和文件部分。
$(?D)&nbsp;$(?F)|分别表示更新的依赖文件的目录部分和文件名部分。


## Makefile路径问题

&emsp;&emsp;Makefile常见的搜索的方法的主要有两种：一般搜索 VPATH 和选择搜索vpath。乍一看只是大小写的区别，其实两者在本质上也是不同的。

### VPATH搜索

VPATH 是变量，更具体的说是环境变量，Makefile 中的一种特殊变量，使用时需要指定文件的路径。

```bash
VPATH := src
# 我们可以这样理解，把 src 的值赋值给变量 VPATH，所以在执行 make 的时候会从 src 目录下找我们需要的文件。

# 当存在多个路径的时候我们可以这样写：
VPATH := src car
# 或者：
VPATH := src:car
```

>注意：无论你定义了多少路径，make 执行的时候会先搜索当前路径下的文件，当前目录下没有我们要找的文件，才去 VPATH 的路径中去寻找。如果当前目录下有我们要使用的文件，那么 make 就会使用我们当前目录下的文件。搜索的顺序为我们书写时的顺序。



### vpath搜索

vpath 是关键字，按照模式搜索，也可以说成是选择搜索。搜索的时候不仅需要加上文件的路径，还需要加上相应限制的条件。

VPATH 是搜索路径下所有的文件，而 vpath 更像是添加了限制条件，会过滤出一部分再去寻找。

```bash
1) vpath PATTERN DIRECTORIES 
2) vpath PATTERN
3) vpath
```

#### 用法一

```bash
# 可以这样理解，在 src 路径下搜索文件 test.c。
vpath test.c src
# 多路径的用法其实和 VPATH 差不多，都是使用空格或者是冒号分隔开，搜索路径的顺序是先 src 目录，然后是 car 目录。
vpath test.c src car         
# 或者是 :
vpath test.c src : car

# 使用通配符过滤
vpath %.c src : car
```


#### 用法二

```bash
vpath test.c
# 用法二的意思是清除符合文件 test.c 的搜索目录。
```

#### 用法三

```bash
vpath
# vpath 单独使的意思是清除所有已被设置的文件搜索路径。
```

### 使用路径的栗子

假设有以下工程，目录数为:

	./
	├── bardir
	│   ├── bar.c
	│   └── bar.h
	├── command.h
	├── foodir
	│   ├── foo.c
	│   └── foo.h
	├── main.c
	├── Makefile
	└── README.md

#### 原始makefile

```bash
OBJS = main.o foodir/foo.o bardir/bar.o
 
CINCLUDES = -I./foodir -I./bardir
CFLAGS = -Wall
 
TARGET = test
 
$(TARGET):$(OBJS)
    $(CC) $(CFLAGS) $^ -o $@ $(CINCLUDES)

.PHONY:clean
 
clean:
    rm  $(OBJS) $(TARGET)
```

# 试过可行，但是为什么没有对main.o的生成做命令呢？（2020.5.4）


#### 使用VPATH

```bash
VPATH = ./foodir:./bardir
OBJS = foo.o bar.o main.o
CINCLUDES = -I./foodir -I./bardir

CFLAGS = -Wall $(CINCLUDES)
TARGET = test
$(TARGET):$(OBJS)
	$(CC) $(CFLAGS) $^ -o $@

.PHONY:clean

clean:
	@-rm -f $(TARGET) $(OBJS)
```


>注意：通过VPATH告知文件搜寻路径是告知的make，这利于它隐式推导时的文件搜索，而不是告知的gcc，所以还是得通过-I指定gcc预编译时头文件搜索路径。**就是说-I是gcc参数，VPATH是make的变量。**

[##原文地址请访问##](https://www.cnblogs.com/thammer/p/5533224.html)















## 引用文献

[0] http://c.biancheng.net/makefile/

[1] https://www.cnblogs.com/thammer/p/5533224.html