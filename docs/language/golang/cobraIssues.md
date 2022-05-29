---
title: "cobra Issues"
---





## 简介

&emsp;&emsp;Cobra 是一个 Golang 包，它提供了简单的接口来创建命令行程序。同时，Cobra 也是一个应用程序，用来生成应用框架，从而开发以 Cobra 为基础的应用。

![](/images/cobralogo.png)

### cobra 的主要功能如下：

- 简易的子命令行模式，如 app server， app fetch 等等
- 完全兼容 posix 命令行模式
- 嵌套子命令 subcommand
- 支持全局，局部，串联 flags
- 使用 cobra 很容易的生成应用程序和命令，使用 cobra create appname 和 cobra add cmdname
- 如果命令输入错误，将提供智能建议，如 app srver，将提示 srver 没有，是不是 app server
- 自动生成 commands 和 flags 的帮助信息
- 自动生成详细的 help 信息，如 app help
- 自动识别帮助 flag -h，--help
- 自动生成应用程序在 bash 下命令自动完成功能
- 自动生成应用程序的 man 手册
- 命令行别名
- 自定义 help 和 usage 信息
- 可选的与 viper apps 的紧密集成



## cobra 中的主要概念

&emsp;&emsp;cobra 中重要的概念有 commands、arguments 和 flags。其中 commands 代表行为，arguments 就是命令行参数(或者称为位置参数)，flags 代表对行为的改变(也就是我们常说的命令行选项)。执行命令行程序时的一般格式为：

```bash
APPNAME COMMAND ARG --FLAG
比如下面的例子：

# server是 commands，port 是 flag
hugo server --port=1313

# clone 是 commands，URL 是 arguments，brae 是 flag
git clone URL --bare
```



## 安装


    go get github.com/spf13/cobra/cobra


## 使用

基本使用如下：






```c

package cmd

import (
    "fmt"

    "github.com/spf13/cobra"
    "strings"
)
var rootCmd = &cobra.Command{
    Use:   "cobrademo",
    Short: "sparkdev's cobra demo",
    Long: "the demo show how to use cobra package",
    PersistentPreRun: func(cmd *cobra.Command, args []string) {
        fmt.Printf("Inside rootCmd PersistentPreRun with args: %v\n", args)
    },
    PreRun: func(cmd *cobra.Command, args []string) {
        fmt.Printf("Inside rootCmd PreRun with args: %v\n", args)
    },
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Printf("cobra demo program, with args: %v\n", args)
    },
    PostRun: func(cmd *cobra.Command, args []string) {
        fmt.Printf("Inside rootCmd PostRun with args: %v\n", args)
    },
    PersistentPostRun: func(cmd *cobra.Command, args []string) {
        fmt.Printf("Inside rootCmd PersistentPostRun with args: %v\n", args)
    },
}
// imageCmd represents the image command
var imageCmd = &cobra.Command{
    Use:   "image",
    Short: "Print images information",
    Long: "Print all images information",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Println("image one is ubuntu 16.04")
        fmt.Println("image two is ubuntu 18.04")
        fmt.Println("image args are : " + strings.Join(args, " "))
    },
}

var echoTimes int
var cmdTimes = &cobra.Command{
    Use:   "times [string to echo]",
    Short: "Echo anything to the screen more times",
    Long: `echo things multiple times back to the user by providing
a count and a string.`,
    Args: cobra.MinimumNArgs(1),
    Run: func(cmd *cobra.Command, args []string) {
        for i := 0; i < echoTimes; i++ {
            fmt.Println("Echo: " + strings.Join(args, " "))
        }
    },
}

func init() {
    rootCmd.AddCommand(imageCmd)
    cmdTimes.Flags().IntVarP(&echoTimes, "times", "t", 1, "times to echo the input")
    imageCmd.AddCommand(cmdTimes)
}
```

首先通过&cobra.Command来添加command，然后通过cobra.Command.Flags()来添加flag，使用cobra.Command.Args来给flag添加限制条件。


### command的执行过程


Command 执行的操作是通过 Command.Run 方法实现的，为了支持我们在 Run 方法执行的前后执行一些其它的操作，Command 还提供了额外的几个方法，它们的执行顺序如下：

    1. PersistentPreRun
    2. PreRun
    3. Run
    4. PostRun
    5. PersistentPostRun


### flag的两种分类：

1. persistent
2. local

对于 persistent 类型的选项，既可以设置给该 Command，又可以设置给该 Command 的子 Command。对于一些全局性的选项，比较适合设置为 persistent 类型，比如控制输出的 verbose 选项：

```c
var Verbose bool
rootCmd.PersistentFlags().BoolVarP(&Verbose, "verbose", "v", false, "verbose output")
```

local 类型的选项只能设置给指定的 Command，比如下面定义的 source 选项：

```c
var Source string
rootCmd.Flags().StringVarP(&Source, "source", "s", "", "Source directory to read from")
```

该选项不能指定给 rootCmd 之外的其它 Command。
默认情况下的选项都是可选的，但一些用例要求用户必须设置某些选项，这种情况 cobra 也是支持的，通过 Command 的 MarkFlagRequired 方法标记该选项即可：

```c
var Name string
rootCmd.Flags().StringVarP(&Name, "name", "n", "", "user name (required)")
rootCmd.MarkFlagRequired("name")
```

### 对flag的参数限制

首先我们来搞清楚命令行参数(arguments)与命令行选项的区别(flags/options)。以常见的 ls 命令来说，其命令行的格式为：
    
    ls [OPTION]... [FILE]…

其中的 OPTION 对应本文中介绍的 flags，以 - 或 -- 开头；而 FILE 则被称为参数(arguments)或位置参数。一般的规则是参数在所有选项的后面，上面的 … 表示可以指定多个选项和多个参数。

cobra 默认提供了一些验证方法：

- NoArgs - 如果存在任何位置参数，该命令将报错
- ArbitraryArgs - 该命令会接受任何位置参数
- OnlyValidArgs - 如果有任何位置参数不在命令的 ValidArgs 字段中，该命令将报错
- MinimumNArgs(int) - 至少要有 N 个位置参数，否则报错
- MaximumNArgs(int) - 如果位置参数超过 N 个将报错
- ExactArgs(int) - 必须有 N 个位置参数，否则报错
- ExactValidArgs(int) 必须有 N 个位置参数，且都在命令的 ValidArgs 字段中，否则报错
- RangeArgs(min, max) - 如果位置参数的个数不在区间 min 和 max 之中，报错




### Demo

```c
package cmd

import (
    "fmt"

    "github.com/spf13/cobra"
    "strings"
)

// imageCmd represents the image command
var imageCmd = &cobra.Command{
    Use:   "image",
    Short: "Print images information",
    Long: "Print all images information",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Println("image one is ubuntu 16.04")
        fmt.Println("image two is ubuntu 18.04")
        fmt.Println("image args are : " + strings.Join(args, " "))
    },
}

var echoTimes int
var cmdTimes = &cobra.Command{
    Use:   "times [string to echo]",
    Short: "Echo anything to the screen more times",
    Long: `echo things multiple times back to the user by providing
a count and a string.`,
    Args: cobra.MinimumNArgs(1),
    Run: func(cmd *cobra.Command, args []string) {
        for i := 0; i < echoTimes; i++ {
            fmt.Println("Echo: " + strings.Join(args, " "))
        }
    },
}

func init() {
    rootCmd.AddCommand(imageCmd)
    cmdTimes.Flags().IntVarP(&echoTimes, "times", "t", 1, "times to echo the input")
    imageCmd.AddCommand(cmdTimes)
}
```



cobra会自动添加help命令，并使用其Use字段和flag的描述信息进行输出。









## Reference

[1] https://github.com/spf13/cobra

[2] https://www.cnblogs.com/sparkdev/p/10856077.html

















