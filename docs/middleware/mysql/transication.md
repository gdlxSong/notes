---
title: 事务
sidebar_position: 4
---


事务是一组原子性的 SQL 执行，或者说是一个独立的工作单元。事务内的所有操作要么全部执行成功，要么全部执行失败。


### 四个基本特性

- Atomicity（原子性）：事务是一个不可分割的整体，事务内所有操作要么全部提交成功，要么全部失败回滚。
- Consistency（一致性）：事务执行前后，数据从一个状态到另一个状态必须是一致的（A向B转账，不能出现A扣了钱，B却没收到）。
- Isolation（隔离性）：多个并发事务之间相互隔离，不能互相干扰。或者说一个事务所做的修改在最终提交以前，对其他事务是不可见的。
- Durablity（持久性）：事务完成后，对数据库的更改是永久保存的，不能回滚。



### 事务隔离级别


> tps: Repeatable Read(可重复读) 是 MySQL 默认事务隔离级别。

#### Read Uncommitted(未提交读)

在 Read Uncommitted 级别，事务中的修改，即使没有提交，对其他事务也都是可见的。事务可以读取未提交的数据，这也被称为脏读(Dirty Read)。性能不会好太多，但是问题却一大堆，实际应用中一般很少使用。

#### Read Committed(提交读)

大多数数据库系统的默认隔离级别都是 Read Committed。Read Committed 满足前面提到的隔离性的简单定义：一个事务开始时，只能“看见”已经提交的事务所做的修改。换句话说：一个事务从开始直到提交之前，所做的任何修改对其他事务都是不可见的。有时也叫不可重复读(Nonrepeatable Read)。


#### Repeatable Read(可重复读)

Repeatable Read 解决了脏读的问题。但是还是无法解决另一个幻读(Phantom Read)问题。所谓幻读，指的是当某个事务在读取某个范围内的记录时，另外一个事务又在该范围内插入了新的记录，当之前的事务再次读取该范围的记录时，会产生幻行(Phantom Row)。InnoDB 和 XtraDB 存储引擎通过多版本并发控制(MVCC，Multiversion Concurrency Control)解决了幻读的问题。


#### Serializable(可串行化)

Serializable 是最高的隔离级别。它通过强制事务串行执行，避免了前面说的幻读问题。简单来说，Serializable 会在读取的每一行数据上都加锁，所以导致大量的超时和锁争用的问题。实际中，极少使用。




### 事务存在的问题


|隔离级别|脏读|不可重复读|幻读|丢失更新1|丢失更新2|
|-|-|-|-|-|-|
|Read Uncommitted|yes|yes|yes|no|yes|
|Read Committed|no|yes|yes|no|yes|
|Repeatable Read|no|no|yes|no|no|
|Serializable|no|no|no|no|no|


> tips: 虽然Serializable可以解决事务引入的问题，但是同时会引入激烈的行数据竞争抑或死锁。


#### 脏读

A 事务执行过程中，B 事务读取了A事务的修改。但是由于某些原因，A 事务可能没有完成提交，发生 RollBack 了操作，则B事务所读取的数据就会是不正确的。这个未提交数据就是脏读（Dirty Read）。


![mysql-durty-read](/images/mysql-durty-read.png)




#### NonRepeatable Read(不可重复读)

B 事务读取了两次数据，在这两次的读取过程中 A 事务修改了数据，B 事务的这两次读取出来的数据不一样。B 事务这种读取的结果，即为不可重复读（Nonrepeatable Read）。相反，“可重复读”在同一个事务中多次读取数据时，能够保证所读数据一样，也就是后续读取不能读到另一个事务已提交的更新数据。不可重复读的产生的流程如下：

![mysql-unrepeatable-read-issue](/images/mysql-unrepeatable-read-issue.png)


> InnoDB 和 XtraDB 存储引擎通过多版本并发控制(MVCC，Multiversion Concurrency Control)解决了幻读的问题。


#### Phantom Read(幻读)

B 事务读取了两次数据，在这两次的读取过程中A事务添加了数据，B 事务的这两次读取出来的集合不一样。幻读产生的流程如下：

![mysql-Phantom-read](/images/mysql-Phantom-read.png)

> 这个流程看起来和不可重复读差不多，但幻读强调的`集合`的增减，而不是单独一条数据的修改。






####  Lost Update(第一类丢失更新)

在完全未隔离事务的情况下，两个事务更新同一条数据资源，某一事务完成，另一事务异常终止，回滚造成第一个完成的更新也同时丢失 。这个问题现代关系型数据库已经不会发生。


#### Lost Update(第二类丢失更新)

不可重复读有一种特殊情况，两个事务更新同一条数据资源，后完成的事务会造成先完成的事务更新丢失。这种情况就是大名鼎鼎的第二类丢失更新。主流的数据库已经默认屏蔽了第一类丢失更新问题（即：后做的事务撤销，发生回滚造成已完成事务的更新丢失），但我们编程的时候仍需要特别注意第二类丢失更新。它产生的流程如下：


![mysql-lost-write2](/images/mysql-lost-write2.png)






### 解决 不可重复读的原理



InnoDB 使用 MVCC 来解决幻读问题。MVCC 的实现，是通过保存数据在某个时间点的快照来实现的。不管需要执行多长时间，每个事务看到的数据都是一致的。根据事务开始的时间不同，每个事务对同一张表，同一时刻看到的数据可能都是不一样的。 MVCC 只能在 Repeatable Read 和 Read Committed 下工作，其他级别和 MVCC 不兼容。

InnoDB 的 MVCC，是通过在每行记录后面保存两个隐藏的列来实现的。一个保存了行的创建时间，一个保存行的过期时间（或删除时间）。实际保存的是系统版本号（system version number）。每开始一个新的事务，系统版本号就会自动递增。事务开始时刻的系统版本号会作为事务的版本号，用来和查询到的每行记录的版本号进行比较。

- SELECT

    InnoDB 会根据以下两个条件检查每行记录：

    InnoDB 只查找版本早于当前事务版本的数据行（也就是，行的系统版本号小于或等于事务的系统版本号），这样可以确保事务读取的行，要么是在事务开始前已经存在的，要么是事务自身插入或者修改过的。

    行的删除版本要么未定义，要么大于当前事务版本号。这可以确保事务读取到的行，在事务开始之前未被删除。

- INSERT

    InnoDB 为新插入的每一行保存当前系统版本号作为行版本号。
- DELETE

    InnoDB 为删除的每一行保存当前系统版本号作为行删除标识。
- UPDATE

    InnoDB 为插入一行新记录，保存当前系统版本号作为行版本号，同时保存当前系统版本号到原来的行作为行删除标识。



> 其实 etcd 也是使用 mvcc 来实现一致性问题的。


















