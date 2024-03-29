---
title: "内存屏障和原子操作"
---


## 内存屏障

### cpu读写数据费原子操作

&emsp;&emsp;学过汇编语言的都知道，高级语言中的一各操作往往对应多个汇编代码，下面是一个数据读写的简要过程：

```bash
x += 100;
```

**读取内存数据到cache -->  CPU读取cache/寄存器  -->  CPU的计算  -->  将结果写入cache/寄存器  -->  写回数据到内存**

上面的流程是简化流程，你的编译器和cpu为了更高效的利用缓存，可能会把变量提取到缓存或寄存器，每次直接操作缓存或寄存器，造成内存和缓存的不同步，就是所谓的内存屏障。



### 指令重排

&emsp;&emsp;指令重排是由编译器和CPU对程序执行的优化而产生的，cpu避免内存访问延迟的常见技术是将指令管道化，然后将这些管道重排，从而把因为缓存未命中引起的延迟降到最小。但当一个程序执行时，只要其最终的结果一样，指令是否重拍是不重要的（当然在多线程中就可能存在后遗症）。后遗症的原因在于缓存是cpu的私有域中的对象，对其他cpu是不可见的，而内存是共享的，`所以一个存在于内存中的共享变量被cpu载入缓存后，可能造成各个cpu对此变量的状态的不一致。`

![](/images/barrier1.png)

### 硬件并行

&emsp;&emsp;一个cpu内部可能包含多个执行单元，例如现代cpu包含6个执行单元，可以组合进行算术运算，逻辑条件判断及内存操作。每个执行单元执行上述的某种组合。这些执行单元是并行执行的，这样指令也就是并行执行的，站在cpu的角度来看，程序的执行顺序也就产生了不确定性。

&emsp;&emsp;**当一个缓存失效发生时，现代cpu可以先假设一个内存载入的值并根据这个值继续执行，知道内存载入返回正确的结果。** 如此拓展，那么是否有一种语言或者硬件可以在不知道具体的值得情境下进行公式的推导？

**内存屏障技术：** `一旦内存数据被推送到缓存，就会有消息协议来确保所有的缓存会对所有的共享数据同步并保持一致。这个使内存数据对CPU核可见的技术被称为内存屏障技术或内存栅栏技术。`

&emsp;&emsp;内存屏障技术提供了两个功能。首先，它们通过确保从另一个CPU来看屏障的两边的所有指令都是正确的程序顺序，而`保持程序顺序的外部可见性`；其次它们可以实现内存数据可见性，`确保内存数据会同步到CPU缓存子系统。`

![](/images/baerrier2.webp)

### 内存屏障的类型

1. `程序顺序(program order)`: 指给定的处理器上，程序最终编译后的二进制程序中的内存访问指令的顺序，因为编译器的优化可能会重排源程序中的指令顺序。
2. `执行顺序(execution order)`: 指给定的处理器上，内存访问指令的实际执行顺序。这可能由于处理器的乱序执行而与程序顺序不同。
3. `观察顺序(perceived order)`: 指给定的处理器上，其观察到的所有其他处理器的内存访问指令的实际执行顺序。这可能由于处理器的缓存及处理器间内存同步的优化而与执行顺序不同。

##### 写屏障(write barriers)

- 定义: 在写屏障之前的所有写操作指令都会在写屏障之后的所有写操作指令更早发生。
- 注意1: 这种顺序性是相对这些动作的承接者，即内存来说。也就是说，在一个处理器上加入写屏障不能保证别的处理器上看到的就是这种顺序，也就是观察顺序与执行顺序无关。

##### 读屏障(write barriers)

- 定义: 在读屏障之前的所有读操作指令都会在读屏障之后的所有读操作指令更早发生。
- 注意1: 这种顺序性是相对这些动作的承接者，即内存来说。也就是说，在一个处理器上加入读屏障不能保证别的处理器上实际执行的就是这种顺序，也就是观察顺序与执行顺序无关。
- 注意2: 读屏障不保证屏障之前的所有读操作在屏障指令结束前结束。也就是说，读屏障序列化了读操作的发生顺序，却没保证操作结果发生的序列化。

##### 通用屏障(general barriers)

- 定义: 在通用屏障之前的所有写和读操作指令都会在通用屏障之后的所有写和读操作指令更早发生。
- 注意1: 这种顺序性是相对这些动作的承接者，即内存来说。也就是说，在一个处理器上加入通用屏障不能保证别的处理器上看到的就是这种顺序，也就是观察顺序与执行顺序无关。
- 注意2: 通用屏障不保证屏障之前的所有写和读操作在屏障指令结束前结束。也就是说，通用屏障序列化了写和读操作的发生顺序，却没保证操作结果发生的序列化。
- 注意3: 通用屏障是最严格的屏障，这也意味着它的低效率。它可以替换在写屏障或读屏障出现的地方。

### 原子性和顺序一致性

&emsp;&emsp;在c11和c++11的新的内存模型中，我们可以选择原子操作具有屏障或者不具有屏障。当使用不有屏障的原子操作，其只保证其原子性，称之为“relaxed atomic”。在java和scala中，他们几乎可以保证所有的原生类型都具备原子操作，从而表现为“relaxed atomic”，并且所有被声明为顺序一致性的变量可以在整个程序中保持性质（Java中使用sun.misc.unsafe除外），我觉得这也就是c、c++的底层和高性能之处吧。


### atomic使用方法

```c++
typedef enum memory_order {
     memory_order_relaxed,
     memory_order_consume,
     memory_order_acquire,
     memory_order_release,
     memory_order_acq_rel,
     memory_order_seq_cst
} memory_order;
```

- **memory_order_relaxed**
	宽松操作，只保证原子性，不保证其顺序和同步制约。
- **memory_order_consume**
	消费方式内存顺序，保证原子性，保证度擦做顺序严格，而不保证写操作顺序严格，通常不会插入内存屏障，只通过影响编译器优化来产生效果。（大多数情况下没有人使用此选项，编译器也会直接将其提升memory_order_acquire）
- **memory_order_acquire**
	取用方式内存顺序，保证原子性，保证度擦做顺序严格，而不保证写操作顺序严格，编译器可能插入内存屏障来保证读取操作不会提早于原子操作的读取操作，从而防止过早获取到数据，使锁失去作用。
- **memory_order_release**
	释放方式内存顺序。与取用方式相反，释放方式通过插入内存屏障保证先前的写入操作都完成后，再更新原子信号使取用者可以观测到原子信号变化。（其实就是讲缓存同步到内存（刷新缓存））
- **memory_order_acq_rel**
	取用与释放方式内存顺序， 是memory_order_acquire和memory_order_release的结合，先保证先前写入过程完成后，更新或读取原子信号，然后再进行读取过程。
- **memory_order_seq_cst**
	严格保证内存顺序。它确保前面的读写等操作都完成后，再进行原子操作，然后再进行后续的读写。这是最安全的内存顺序。


### 原子性保证的原理

atomic使用lock指令来保证其原子操作。

&emsp;&emsp;LOCK指令前缀会设置处理器的LOCK#信号（译注：这个信号会使总线锁定，阻止其他处理器接管总线访问内存），直到使用LOCK前缀的指令执行结束，这会使这条指令的执行变为原子操作。在多处理器环境下，设置LOCK#信号能保证某个处理器对共享内存的独占使用。 另外，XCHG指令默认会设置LOCK#信号，无论是否使用LOCK指令前缀。 




## 话外

&emsp;&emsp;Java内存模型中volatile变量在写操作之后会插入一个store屏障，在读操作之前会插入一个load屏障。一个类的final字段会在初始化后插入一个store屏障，来确保final字段在构造函数初始化完成并可被使用时可见。

&emsp;&emsp;在c/c++中，volatile在标准中是不保证其原子性的，只有msvc实现了其原子性，而在gcc得不到保障。volatile的作用在于阻止编译器优化，保证其变量在不同线程之间的可见性（因为直接从内存获取数据）。





## Reference

[0] http://ifeve.com/memory-barriers-or-fences/

[1] https://www.jianshu.com/p/08a0a8c984ab

[2] https://www.0xaa55.com/forum.php?mod=viewthread&tid=25820&highlight=%E5%8E%9F%E5%AD%90%E6%93%8D%E4%BD%9C

[3] https://www.cnblogs.com/hehehaha/archive/2013/05/07/6332846.html

[4] https://www.dazhuanlan.com/2019/12/14/5df40323d6adf/?__cf_chl_jschl_tk__=6c6b87fa5daae343dae55974eb9bd4d99df493bc-1590237796-0-AQqtANsfEfxCkatVnYfVmtbdkNNyiE0V20RsXPLs46fehSBDpfgBjGmY9oEeLzronneuACS0ILgWsrWP6UYLzavoiN27iSj3E5Bx3cG7TYFkPN40Dr1TW3s2H9q77ZKfQWzh_NDRJyrue4iLC72tIcgF82iu_ZxEWTHvwonaJw_dAYtEImKBfKEg9rutr2WLa04uI2sTx2lIB-lKVtj8e0LM0m1lhf-Vm6DgTVAL-zT7_yA6HgSzWS6QPt2LGOi34DjTNGMSpQUQaYZEaKV601IbaTmSj_r7DBgNAkkuXtV3UWpnaXz1U7OAxzwbmWrxVA

[5] https://my.oschina.net/u/269082/blog/873612/

[6] https://blog.csdn.net/imred/article/details/51994189