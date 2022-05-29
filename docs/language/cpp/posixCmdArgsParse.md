---
title: "linux的命令行参数解析"
date: 2020-06-04T11:06:30+08:00
lastmod: 2020-06-04T11:06:30+08:00
description: ""
tags: ["CmdLine", "API"]
categories: ["API"]
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

&emsp;&emsp;golang有flag库提供命令行参数解析，其实posix也是一直有的，由`getopt.h`来提供。



## getopt


>&emsp;&emsp;通常使用GNU C提供的函数`getopt`、`getopt_long`、`getopt_long_only`函数来解析命令行参数。 命令行参数可以分为两类，一类是短选项，一类是长选项，短选项在参数前加一杠"-"，长选项在参数前连续加两杠"--"，如下表（ls 命令参数）所示，其中-a，-A,-b都表示短选项，--all,--almost-all, --author都表示长选项。他们两者后面都可选择性添加额外参数。比如--block-size=SIZE，SIZE便是额外的参数。



```c
#include <unistd.h>  
extern char *optarg;  
extern int optind, opterr, optopt;  
#include <getopt.h>
int getopt(int argc, char * const argv[],const char *optstring);  
int getopt_long(int argc, char * const argv[], const char *optstring, const struct option *longopts, int *longindex);  
int getopt_long_only(int argc, char * const argv[], const char *optstring, const struct option *longopts, int *longindex);
```


&emsp;&emsp;`getopt`函数只能处理短选项，而`getopt_long`函数两者都可以，可以说`getopt_long`已经包含了`getopt`的功能。因此，这里就只介绍`getopt_long`函数。而`getopt_long`与`getopt_long_only`的区别很小，等介绍完`getopt_long`，在提起会更好。


### 短选项的解析规则

1. 只有一个字符，不带冒号——只表示选项， 如-c 
2. 一个字符，后接一个冒号——表示选项后面带一个参数，如-a 100
3. 一个字符，后接两个冒号——表示选项后面带一个可选参数，即参数可有可无，如果带参数，则选项与参数直接不能有空格形式应该如-b200

如：`ab::c:d:`, a是无参选项，b是可选参数选项（-b200），c是带参数选项，d是带参数选项。

### 长选项参数的解析规则

对于长选项参数需要注册才能解析，依赖于结构体`option`

```c
struct option			/* specification for a long form option...	*/
{
  const char *name;		/* option name, without leading hyphens */
  int         has_arg;	/* does it take an argument?		*/
  int        *flag;		/* where to save its status, or NULL	*/
  int         val;		/* its associated status value		*/
};

enum    				/* permitted values for its `has_arg' field...	*/
{
  no_argument = 0,      	/* option never takes an argument	*/
  required_argument,		/* option always requires an argument	*/
  optional_argument			/* option may take an argument		*/
};
```


##### require规则


- `no_argument`(或者是0)时 ——参数后面不跟参数值，eg: --version,--help
- `required_argument`(或者是1)时 ——参数输入格式为：--参数 值 或者 --参数=值。eg:--dir=/home
- `optional_argument`(或者是2)时  ——参数输入格式只能为：--参数=值


##### flag规则

- 如果flag==NULL，`getopt_long`返回val, 模拟了`getopt`
- 如果flag！=NULL，`getopt_long`返回0，并将flag指向val。


`longindex非空，它指向的变量将记录当前找到参数符合longopts里的第几个元素的描述，即是longopts的下标值。`


### 全局辅助变量

1. `optarg`：表示当前选项对应的参数值。
2. `optind`：表示的是下一个将被处理到的参数在argv中的下标值。
3. `opterr`：如果opterr = 0，在getopt、getopt_long、getopt_long_only遇到错误将不会输出错误信息到标准输出流。opterr在非0时，向屏幕输出错误。
4. `optopt`：表示没有被未标识的选项。


### 返回值

1. 如果短选项找到，那么将返回短选项对应的字符。
2. 如果长选项找到，如果flag为NULL，返回val。如果flag不为空，返回0
3. 如果遇到一个选项没有在短字符、长字符里面。或者在长字符里面存在二义性的，返回“？”
4. 如果解析完所有字符没有找到（一般是输入命令参数格式错误，eg： 连斜杠都没有加的选项），返回“-1”
5. 如果选项需要参数，忘了添加参数。返回值取决于optstring，如果其第一个字符是“：”，则返回“：”，否则返回“？”。


### getopt_long_only

&emsp;&emsp;getopt_long_only 函数与 getopt_long 函数使用相同的参数表，在功能上基本一致，只是 getopt_long 只将 --name 当作长参数，但 getopt_long_only 会将 --name 和 -name 两种选项都当作长参数来匹配。getopt_long_only 如果选项 -name 不能在 longopts 中匹配，但能匹配一个短选项，它就会解析为短选项。


### Example

>http://www.yqun.xyz:1313/post/webbench


## Reference

[0] man getopt

[1] https://blog.csdn.net/qq_33850438/article/details/80172275

[2] https://www.cnblogs.com/chenliyang/p/6633739.html