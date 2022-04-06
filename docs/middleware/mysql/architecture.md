---
title: 架构
sidebar_position: 2
---


mysql 服务端主要由连接管理器，缓存模块，解析器，查询优化器，执行器和数据引擎组成。

![mysql-server-artitecture](/images/mysql-server-artitecture.png)


### 连接管理器

连接管理器的作用是管理和维持所有MySQL客户端的请求连接，当我们向MySQL发起请求时，连接管理器会负责创建连接并校验用户的权限。
对于已经建立的连接，如果没有太久没有发送请求，连接管理器会自动断开连接，我们可以通过设置变量wait_timeout决定多久断开不活跃的连接。




### 查询缓存

当我们与连接器建立连接后，如果我们执行的是SELECT语句，那么连接器会先从查询缓存中查询，看看之前是否执行过这条语句，如果没有再往走，如果有则判断相应的权限，符合权限，则直接返回结果。
查询缓存其实是把查询语句当作一个key，查询结果当用value，建立起来的key-value缓存结构。
不过，当数据表的数据发生变化时，其所对应的查询缓存则会失败，因此很多时候往往不能命中查询缓存，所以一般建议不要使用查询缓存。

> mysql> select SQL_CACHE * from users where uid = 1000；

复制代码可能MySQL官方团队也意识到查询缓存的作用不大，在MySQL 8.0版本中已经将查询缓存的整块功能删掉了，所以如果你用的是MySQL 8.0的版本，查询缓存的功能就不存在了。


### 解析器

当在查询缓存中没有命令查询时，则需要真正执行语句，这时候就交给解析器先进行词法分析，对我们输入的语句进行拆解，折解后再进行语法分析，判断我们输入的语句是不是符合MySQL的语法规则，如果输入的语句不符合MySQL语法规则，则停止执行并提示错误。





### 查询优化器

我们输入的语句，经过分析器的词法和语法分析，MySQL服务器已经知道我们要查询什么了，不过，在开始查询前，还要交由查询优化器进行优化。
在优化的过程，优化器会根据SQL语句的查询条件决定使用哪一个索引，如果有连接(join)，会决定表的查询顺序，最终会根据优化的结果生成一个执行计划交由下面的执行器去执行。




### 执行器

SQL语句在经过查询优化器的优化后，接下来就交由执行器开始执行，不过执行器在开始执行前，会判断用户对相应的数据表是否有权限。
如果用户有权限，则开始调用数据，与其数据库不同的，MySQL的数据存储与调用交由存储实现，当我们调用时，执行器通过存储引擎API向底层的存储发送相应的指令，存储引擎负责具体执行，并将执行结果告诉执行器，然后再返回给客户端。



### 存储引擎

存储引擎，也叫做表类型，其具体作用便是决定一个数据表怎么处理和存储表中的数据，MySQL支持多种不同的存储引擎，而且存储引擎被设计为可插拔式的，在同一个数据库中，不同的数据表可以使用不同的存储引擎。



```bash
root@e327cea6e865:/# mysql --version
mysql  Ver 15.1 Distrib 10.7.3-MariaDB, for debian-linux-gnu (x86_64) using readline 5.2

MariaDB [(none)]> show engines
    -> ;
+--------------------+---------+-------------------------------------------------------------------------------------------------+--------------+------+------------+
| Engine             | Support | Comment                                                                                         | Transactions | XA   | Savepoints |
+--------------------+---------+-------------------------------------------------------------------------------------------------+--------------+------+------------+
| CSV                | YES     | Stores tables as CSV files                                                                      | NO           | NO   | NO         |
| MRG_MyISAM         | YES     | Collection of identical MyISAM tables                                                           | NO           | NO   | NO         |
| MEMORY             | YES     | Hash based, stored in memory, useful for temporary tables                                       | NO           | NO   | NO         |
| Aria               | YES     | Crash-safe tables with MyISAM heritage. Used for internal temporary tables and privilege tables | NO           | NO   | NO         |
| MyISAM             | YES     | Non-transactional engine with good performance and small data footprint                         | NO           | NO   | NO         |
| SEQUENCE           | YES     | Generated tables filled with sequential values                                                  | YES          | NO   | YES        |
| InnoDB             | DEFAULT | Supports transactions, row-level locking, foreign keys and encryption for tables                | YES          | YES  | YES        |
| PERFORMANCE_SCHEMA | YES     | Performance Schema                                                                              | NO           | NO   | NO         |
+--------------------+---------+-------------------------------------------------------------------------------------------------+--------------+------+------------+
8 rows in set (0.000 sec)
```

> tips: XA 指的是分布式事务，Savepoints指事务中的`保存点`，可以通过保存点部分回滚事务。






