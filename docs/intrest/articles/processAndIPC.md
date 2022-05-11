---
title: "进程及进程通信"
date: 2020-04-25T15:05:04+08:00
lastmod: 2020-04-25T15:05:04+08:00
description: ""
tags: []
categories: []
author: "codecat"
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

进程是资源分配的基本单位，线程是执行的基本单位。

### ps一下，看看美不美

![](/images/process/psState.png)


### 进程状态

- D：无法中断的休眠状态（通常 IO 的进程）
- R：正在运行可中在队列中可过行的(运行或就绪)
- S：处于休眠状态
- T：停止或被追踪
- W：进入内存交换 （从内核2.6开始无效）
- X：死掉的进程 （基本很少见）
- Z：僵尸进程
- <：优先级高的进程 
- N：优先级较低的进程 
- L：有些页被锁进内存
- s：进程的领导者（在它之下有子进程）
- l：多线程，克隆线程（使用 CLONE_THREAD, 类似 NPTL pthreads）
- +：位于后台的进程组

### ps的简单使用

![](/images/process/ps.png)


## 创建进程相关函数

### 关于exec族函数

![](/images/process/exec.png)

![](/images/process/exec1.png)


### exec使用
```c
[gdl@Gdl link]$ cat test_for_ls.cpp
#include <unistd.h>
#include <string.h>
#include <stdio.h>


int main() {
  char* argv[] = {"ls","-a", "-l", NULL}; // 构造 vector，注意argv[0] 是占用参数
  if (execvp("ls", argv) == -1) { // 替换代码段和数据段，并重新从 ls 入口点执行
    perror("exec");
    return 1;
  }


  return 0;  
}
[gdl@Gdl link]$
```

### fork和vfork

```bash
首先说一下fork和vfork的差别：
    * fork 是 创建一个子进程，并把父进程的内存数据copy到子进程中。
    * vfork是 创建一个子进程，并和父进程的内存数据share一起用。
vfork的特征：
    1）保证子进程先执行。
    2）当子进程调用exit()或exec()后，父进程往下执行。
```

#### 为什么会有vfork？

man page：

>Historic Description
Under Linux, fork(2) is implemented using copy-on-write pages, so the only penalty incurred by fork(2) is the time and memory required to duplicate the parent’s page tables, and to create a unique task structure for the child. However, in the bad old days a fork(2) would require making a complete copy of the caller’s data space, often needlessly, since usually immediately afterwards an exec(3) is done. Thus, for greater efficiency, BSD introduced the vfork() system call, which did not fully copy the address space of the parent process, but borrowed the parent’s memory and thread of control until a call to execve(2) or an exit occurred. The parent process was suspended while the child was using its resources. The use of vfork() was tricky: for example, not modifying data in the parent process depended on knowing which variables are held in a register.

>意思是这样的—— 起初只有fork，但是很多程序在fork一个子进程后就exec一个外部程序，于是fork需要copy父进程的数据这个动作就变得毫无意了，而且这样干还很重（注：后来，fork做了优化，详见本文后面），所以，BSD搞出了个父子进程共享的 vfork，这样成本比较低。因此，vfork本就是为了exec而生。


#### 为什么vfork的子进程里用return，整个程序会挂掉，而且exit()不会？

&emsp;&emsp;这里很明显就是return和exit的区别所在了，我们知道return最后也是会调用exit(exit是系统调用_exit或_exitgroup的封装)，但是return会有资源清理的工作，析构函数会调用，函数堆栈会弹出....， 一般情况下你调用exit或return结束进程都是没问题的(不会报错)， 但是对于vfork，子进程先执行，然后父子进程又完全共享进程空间，这就意味着父子进程贡献堆栈，子进程在main return，堆栈销毁，然后父进程vfork返回，wtf？？？！！！，子进程把堆栈都销毁了，还咋执行？？？

#### 结论：

&emsp;&emsp;很明显，fork太重，而vfork又太危险，所以，就有人开始优化fork这个系统调用。优化的技术用到了著名的写时拷贝（COW）。
也就是说，对于fork后并不是马上拷贝内存，而是只有你在需要改变的时候，才会从父进程中拷贝到子进程中，这样fork后立马执行exec的成本就非常小了。所以，Linux的Man Page中并不鼓励使用vfork。


### wait和waitpid

man wait中的一段描述：

DESCRIPTION:

&emsp;&emsp;The wait() and waitpid() functions shall obtain status information pertaining to one of the caller's child processes. Various options permit status information to be obtained for child processes that have terminated  or stopped. If status information is available for two or more child processes, the order in which their status is reported is unspecified.

&emsp;&emsp;The  wait()  function  shall  suspend execution of the calling thread until status information for one of the terminated child processes of the calling process is available, or until delivery of a signal whose action is
either to execute a signal-catching function or to terminate the process. If more than one thread is suspended in wait() or waitpid() awaiting termination of the same process, exactly one thread shall return the process status at the time of the target process termination. If status information is available prior to the call to wait(), return shall be immediate.

&emsp;&emsp;The waitpid() function shall be equivalent to wait() if the pid argument is (pid_t)-1 and the options argument is 0. Otherwise, its behavior shall be modified by the values of the pid and options arguments.

&emsp;&emsp;The pid argument specifies a set of child processes for which status is requested. The waitpid() function shall only return the status of a child process from this set:

- If pid is equal to (pid_t)-1, status is requested for any child process. In this respect, waitpid() is then equivalent to wait(). 
- If pid is greater than 0, it specifies the process ID of a single child process for which status is requested.
- If pid is 0, status is requested for any child process whose process group ID is equal to that of the calling process.
- If pid is less than (pid_t)-1, status is requested for any child process whose process group ID is equal to the absolute value of pid.

```bash
pid > 0，表示 waitpid 只等待子进程 pid。
pid = 0，表示 waitpid 等待和当前调用 waitpid 一个组的所有子进程。
pid = -1，表示等待所有子进程。
pid < -1，表示等等组 id=|pid| id=|pid| （绝对值 pid）的所有子进程。
```

--------------------------------------

The options argument is constructed from the bitwise-inclusive OR of zero or more of the following flags, defined in the <sys/wait.h> header:


- **WCONTINUED**:
              The waitpid() function shall report the status of any continued child process specified by pid whose status has not been reported since it continued from a job control stop.
- **WNOHANG**:
              The waitpid() function shall not suspend execution of the calling thread if status is not immediately available for one of the child processes specified by pid.
- **WUNTRACED**:
              The status of any child processes specified by pid that are stopped, and whose status has not yet been reported since they stopped, shall also be reported to the requesting process.
```bash
上面指出：
    (1) wait是阻塞执行的。
    (2) wait 和 waitpid(-1, ...)等效。
    (3) waitpid带WNOHANG执行的时候是非阻塞的， 非阻塞wait子进程未结束时函数返回0.
```

### wait进程状态

&emsp;&emsp;只要子进程的状态发生了改变，它就会给父进程发信号(SIGCHLD)。比如子进程暂停执行，恢复执行。这些信号，父进程都可以忽略，没什么关系。当然父进程可以选择处理它，也不可不处理，没什么大问题。

进程的状态status：
```bash
1 进程正常退出
2 进程被信号终止
3 进程被暂停执行
4 进程被恢复执行
```

分别可以使用四个宏来进行判断：
```bash
WIFEXITED(status)        -> exited
WIFSIGNALED(status)      -> signaled
WIFSTOPPED(status)       -> stopped
WIFCONTINUED(status)     -> continued
```
所以可以说wait/waitpid函数并不是等待进程结束，而是获取进程的状态。

----------高能！！！！

&emsp;&emsp;能否接受到stopped和continued取决于waitpid的option参数：

1. 正常退出

	如果 WIFEXITED(status) 返回 true，这说明进程是正常退出。在这种情况下，你可以使用宏WEXITSTATUS(status)来获取进程的退出码（main 函数的 return 值或者 exit 函数的参数值）。
2. 进程被信号终止

	如果WIFSIGNALED(status) 返回 true，这说明进程是被信号终止的。这时候，可以通过宏 WTERMSIG(status) 来获取子进程是被哪种信号终止的。
3. 进程被暂停执行

	如果 WIFSTOPPED(status) 返回 true，说明进程收到信号暂停执行。这时候，可以通过宏 WSTOPSIG(status)来获取子进程是被哪个信号暂停的。
这时候你可以通过宏 WCOREDUMP(status) 返回 true 还是 false 来判断是否生生了 core 文件。在某些系统中，WCOREDUMP 宏可能没有定义，你需要使用 #ifdef WCOREDUMP ... #endif 来判断。
4. 进程被恢复执行

	如果 WIFCONTINUED(status) 返回 true，说明进程收到信号恢复执行（SIGCONT）。已经不需要额外的宏函数来获取是哪个信息让它恢复执行了，默认就是 SIGCONT。

----------------------------------------
#### waitpid参数 options

参数 options 是可个组合选项，这也是参数写 options 而不是 option 原因。

options 的三个可组合选项如下（可以理解成开关组合）：

1. WNOHANG (设置非阻塞，即使子进程全部正常运行，waitpid 也会立即返回 0)
2. WUNTRACED (可获取子进程暂停状态，也就是可获取 stopped 状态)
3. WCONTINUED (可获取子进程恢复执行的状态，也就是可获取 continued 状态)

你可以任意使用位或 || 运算符自由组合他们。如果 options 置空（这三个开关都不打开），也就是 0，这意味着 waitpid 函数是阻塞的（在有子进程正常运行的情况下）。

>waitpid 能否接收 stopped 和 continued 状态，取决于 WUNTRACED 和 WCONTINUED 开关是否打开。

如果你的 WUNTRACED 开关未打开，waitpid 函数是不会理会子进程停止状态的。同理，如果 WCONTINUED 开关未打开，waitpid 也不会理会子进程恢复执行的状态。后面的实验，读者可以自行验证，代码也会提供。


#### waitpid返回值

waitpid 的返回值通常也会有 > 0, = 0, 以及 = -1 这几种情况。

- =−1，意味着没有子进程或者其它错误。
- =0，这只有在打开了 WNOHANG 的情况下才会可能出现。如果子进程都是正常运行没有发生状态改变，它就会返回 0.
- \>0，只要有任意一个子进程状态发生改变，比如停止，终止，恢复执行，waitpid 就会返回该子进程的 pid。


所以，可以使用SIGCHILD信号来异步wait子进程。

#### 栗子

```c
#include<iostream>
#include<unistd.h>
#include<sys/types.h>
#include<sys/wait.h>
#include<errno.h>



int main(){


std::cout<<"father process start......."<<std::endl;


//create child process....
int num_process = 3;
while(num_process --){


        pid_t pid = fork();
        if(-1 == pid)
                std::cout<<"fork"<<std::endl;


        if(0 == pid){
                while(true){
                        //子进程....
                        std::cout<<"i am child process, pid = "<<getpid()<<std::endl;
                        sleep(5);
                }
        }
}


std::cout<<"i am father process, create process end."<<std::endl;


//father process sync wait child process.
pid_t ret_pid = -1;
do{
        int status = 0;
        ret_pid = waitpid(-1, &status, WUNTRACED | WCONTINUED);
        //if waited any child process.
        if(ret_pid > 0){
                std::cout<<"....child process "<<ret_pid<<" status changed, "<<std::ends;
                //判断变化类型.
                if(WIFEXITED(status)){
                        //子进程退出..
                        std::cout<<"child exited, ExitedCode = "<<WEXITSTATUS(status)<<std::endl;
                }
                if(WIFSIGNALED(status)){
                        //子进程被信号终止.
                        std::cout<<"child terminated by signal = "<<WTERMSIG(status)<<std::endl;
                }
                if(WIFSTOPPED(status)){
                        //子进程被挂起..
                        std::cout<<"child suspend by signal = "<<WSTOPSIG(status)<<std::endl;
                }
                if(WIFCONTINUED(status)){
                        //子进程恢复执行..
                        std::cout<<"child resumed."<<std::endl;
                }
        }
        else{
                //不要忘记信号中断可能使得waitpid函数中断执行...
                if(EINTR == errno){
                        std::cout<<errno<<std::endl;
                        //EINTR  WNOHANG was not set and an unblocked signal or a SIGCHLD was caught; see signal(7).
                        continue;
                }
        }
}while(0 < ret_pid);


std::cout<<"father process exit."<<std::endl;
return 0;
```

#### 栗子执行

```bash
#在另一个终端kill发送命令...
kill -1 pid 	#：终止进程
kill -9 pid 	#：终止进程
kill -18 pid 	#: 恢复进程执行
kill -19 pid 	#：挂起进程执行

#....
#kill -l：列出所有信号.
```


## 信号

信号：信号是事件发生时对进程的通知机制。

信号的产生场景：

- 键盘事件
- 非法内存操作
- 硬件故障
- 从用户态切换到内核态
- 用户kill等函数制造


