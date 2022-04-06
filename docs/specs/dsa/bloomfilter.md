---
title: Bloom Filter
sidebar_position: 2
---



直观的说，bloom算法类似一个hash set，用来判断某个元素（key）是否在某个集合中（bitmap）。
和一般的hash set不同的是，这个算法无需存储key的值，对于每个key，只需要k个比特位，每个存储一个标志，用来判断key是否在集合中。


![bloomfilter](/images/bloomfilter.jpg)



算法：
1. 首先需要k个hash函数，每个函数可以把key散列成为1个整数
2. 初始化时，需要一个长度为n比特的数组，每个比特位初始化为0
3. 某个key加入集合时，用k个hash函数计算出k个散列值，并把数组中对应的比特位置为1
4. 判断某个key是否在集合时，用k个hash函数计算出k个散列值，并查询数组中对应的比特位，如果所有的比特位都是1，认为在集合中。

优点：不需要存储key，节省空间

缺点：
1. 算法判断key在集合中时，有一定的概率key其实不在集合中
2. 无法删除




### 使用什么方式来解决 bloom 无法删除的问题呢？

bloom filter 实际上是使用一个[]bit来标记key是否被创建过，但由于hash函数的输出可能存在碰撞的不确定性，随意我们是否可以对创建过的key的hash值进行一个计数，来实现删除。
- 使用[]uint16, []uint8, []uint4, []uint2 来对key进行计数。

当然计数是存在上限的，uint16可以忽略这个问题，uint8基本也可以忽略这个问题，但实际不能根除此bug，既然如此我们其实可以将上述两种方案结合， 使用[]uint4，来实现bloom filter，当key计数达到上限时（7），那么该key不允许删除。







### 应用场景：

- 缓存穿透
- 爬虫去环






## References

- https://www.cnblogs.com/liyulong1982/p/6013002.html
- https://zhuanlan.zhihu.com/p/140545941