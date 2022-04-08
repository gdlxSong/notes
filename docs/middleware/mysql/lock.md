---
title: Lock
sidebar_position: 36
---


>　关键词：行锁、表锁、乐观锁、悲观锁、gap锁、next-key



## 行锁与表锁


### 表锁： 

> 锁定粒度是表。



1. 意向共享锁（IS）：事务如果想要读某一个数据行，那么必须取得该表的IS锁。
2. 意向排他锁（IX）：事务如果想要对某一个数据行进行更新操作，那么必须先取得该表的IX锁。
3. 加锁方式：

    - 意向共享锁（IS）：LOCK table tableName read;
    - 意向排他锁（IX）：LOCK table tableName write;

### 行锁（记录锁）--共享锁和排他锁： 

> 锁定粒度是数据行

1. 共享锁（读锁、S锁）：事务在读某一个数据行时，如果给当前数据行加上S锁，那么此时只允许其他事务读取当前数据行，而禁止其他事务对当前数据行进行写操作。
2. 排他锁（写锁、X锁）：事务在对某一个数据行进行更新操作时，如果给当前数据行加上X锁，那么会禁止其他事务对相同的数据行进行读或者写操作。
3. InnoDB引擎下的行锁分析：

    - 对于UPDATE、DELETE和INSERT语句，InnoDB会自动给涉及的数据集加排他锁（X)；
    - 对于普通SELECT语句，InnoDB不会加任何锁，事务可以通过以下语句显示给记录集加共享锁或排他锁。
    
        > 共享锁（S）：SELECT * FROM table_name WHERE ... LOCK IN SHARE MODE。

        > 排他锁（X)：SELECT * FROM table_name WHERE ... FOR UPDATE。  （悲观锁的实现方式)

    - InnoDB行锁是通过给索引上的索引项加锁来实现的，因此InnoDB这种行锁实现特点意味着：只有通过索引条件检索数据，InnoDB才使用行级锁，否则，InnoDB将使用表锁（主键字段默认是有索引的）。
4. MyISAM引擎下的行锁分析：MyISAM在执行查询语句(SELECT)前，会自动给涉及的所有表加读锁，在执行更新操作(UPDATE、DELETE、INSERT等)前，会自动给涉及的表加写锁。


> 锁只能保证单操作的原子性，事务能保证多操作的原子性，事务中脏读，幻读，不可重复读是由事务之间的数据竞争引起的。


#### 总结
 
1. 应用中我们只会使用到共享锁和排他锁，意向锁是mysql内部使用的，不需要用户干预。
2. InnoDB & Myisam引擎的锁机制：InnoDB支持事务，支持行锁和表锁用的比较多；Myisam不支持事务，只支持表锁。



## 乐观锁和悲观锁：

### 悲观锁

- 定义：正如其名，悲观。实际上就是说在操作数据的时候，总是还怕此时别的事务可能也会修改数据，所以，一旦操作数据，那么就对数据加锁，一旦操作数据，就对当前的数据加锁，防止其他事务操作这个数据。
- 实现：
    > select * from table where ... for update    （写锁）

    > select * from table where ... lock in share mode （读锁） 

### 乐观锁：
- 定义：正如其名，乐观。实际上就是说在操作数据的时候，不怕别的事务也在修改，总是觉得没事的，不会这么巧的。所以在刚开始操作数据的时候并没有对数据进行加锁。而是等到提交事务时，再对数据做一个检查，判断此时数据是否修改了。如果数据被修改了，那么此时返回错误信息，让用户自己再选择怎样做，一般是回滚事务。
- 实现：在修改数据的时候，首先记录下数据的原始值。然后在修改的时候再判断是否这个数据发生改变了。如果改变了说明出错了。此时用户再进行相对应的操作。否则说明没有错误，继续执行。




## 间隙锁（gap锁）：

> 定义： 在RR级别下，检索某个内容时，会对其间隙加间隙锁。本质上等同于S锁。

- 分析：
    > 比如此时表中有记录（id=6，number=5）与（id=8，number=5），那么此时（id=6，number=5）与（id=8，number=5）之间就是存在间隙的，比如可以插入记录（id=7，number=5）。所以此时如果开启了间隙锁的机制，那么会对（id=6,number=5）与（id=8,number=5）之间的间隙加锁，禁止在间隙添加记录。

**核心作用：**

在mysql的innodb引擎的RR级别下使用间隙锁的目的是为了防止幻读，其主要通过两个方面实现这个目的。
- 防止间隙内有新数据被插入；
- 防止已存在的数据，更新成间隙内的数据（例如防止numer=3的记录通过update变成number=5）。

**innodb自动使用间隙锁的条件：**
- 必须在RR级别下
- 当前读而且检索条件必须有索引（eg：主键）



## next-key锁：

1. next-key锁其实包含了行锁和间隙锁，即锁定一个范围，并且锁定记录本身。
2. 分析：如下数据表与sql语句：select * from news where number=4 for update; 这条SQL会为表中所有间隙加间隙锁，为 （number=4）的所有记录加记录锁。


> next-key锁 的目的应该是在于防止sql执行期间数据的insert，而相对于表锁粒度更小。




## 死锁

所谓死锁：是指两个或两个以上的进程在执行过程中,因争夺资源而造成的一种互相等待的现象,若无外力作用，它们都将无法推进下去.此时称系统处于死锁状态或系统产生了死锁，这些永远在互相等待的进程称为死锁进程。表级锁不会产生死锁.所以解决死锁主要还是针对于最常用的InnoDB。

> update users set age = age +1 where born_at 19910101; 一条sql锁定多条行记录，多个session执行类似的操作的时候，其对相同资源锁定的顺序不一致会造成死锁。




### 解决方式

```bash
# 查询是否有锁表
show OPEN TABLES where In_use > 0;

# 通过 数据库 information_scheme 查询
use information_scheme;
show tables;

# 查看正在锁的事务
SELECT * FROM INFORMATION_SCHEMA.INNODB_LOCKS; 

# 查看等待锁的事务
SELECT * FROM INFORMATION_SCHEMA.INNODB_LOCK_WAITS; 

# 查看锁阻塞线程信息
show processlist
show engine innodb status
```












