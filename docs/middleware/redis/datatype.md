---
title: 数据类型
sidebar_position: 3
---

### String：


**应用场景：**

- 分布式锁实现，使用SetNX
- 缓存功能：String字符串是最常用的数据类型，不仅仅是Redis，各个语言都是最基本类型，因此，利用Redis作为缓存，配合其它数据库作为存储层，利用Redis支持高并发的特点，可以大大加快系统的读写速度、以及降低后端数据库的压力。
- 计数器：redis 命令执行都是原子的，许多系统都会使用Redis作为系统的实时计数器，可以快速实现计数和查询的功能。而且最终的数据结果可以按照特定的时间落地到数据库或者其它存储介质当中进行永久保存。
- 共享用户Session：用户重新刷新一次界面，可能需要访问一下数据进行重新登录，或者访问页面缓存Cookie，但是可以利用Redis将用户的Session集中管理，在这种模式只需要保证Redis的高可用，每次用户Session的更新和获取都可以快速完成。大大提高效率。


### List：


```c
/* Node, List, and Iterator are the only data structures used currently. */

typedef struct listNode {
    struct listNode *prev;
    struct listNode *next;
    void *value;
} listNode;

typedef struct listIter {
    listNode *next;
    int direction;
} listIter;

typedef struct list {
    listNode *head;
    listNode *tail;
    void *(*dup)(void *ptr);
    void (*free)(void *ptr);
    int (*match)(void *ptr, void *key);
    unsigned long len;
} list;
```




List 是有序列表，这个还是可以玩儿出很多花样的。
比如可以通过 List 存储一些列表型的数据结构，类似粉丝列表、文章的评论列表之类的东西。
比如可以通过 lrange 命令，读取某个闭区间内的元素，可以基于 List 实现分页查询，这个是很棒的一个功能，基于 Redis 实现简单的高性能分页，可以做类似微博那种下拉不断分页的东西，性能高，就一页一页走。
比如可以搞个简单的消息队列，从 List 头怼进去，从 List 屁股那里弄出来。
List本身就是我们在开发过程中比较常用的数据结构了，热点数据更不用说了。

消息队列：Redis的链表结构，可以轻松实现阻塞队列，可以使用左进右出的命令组成来完成队列的设计。比如：数据的生产者可以通过Lpush命令从左边插入数据，多个数据消费者，可以使用BRpop命令阻塞的“抢”列表尾部的数据。
文章列表或者数据分页展示的应用。
比如，我们常用的博客网站的文章列表，当用户量越来越多时，而且每一个用户都有自己的文章列表，而且当文章多时，都需要分页展示，这时可以考虑使用Redis的列表，列表不但有序同时还支持按照范围内获取元素，可以完美解决分页查询功能。大大提高查询效率。



### Hash：

redis 的 hash 实现基本和 `java HashTable` 实现一致。

![redis-data-hash](/images/redis-data-hash.jpg)



```c
// hash table 定义
typedef struct dictht {
    // 哈希表数组
    dictEntry **table;
    // 哈希表大小
    unsigned long size;
    // 哈希表大小掩码，用于计算索引值，总是等于 size - 1
    unsigned long sizemask;
    // 该哈希表已有节点的数量
    unsigned long used;
} dictht;

// 字典定义
typedef struct dict {
    dictType *type;
    void *privdata;
    // 内部有两个 dictht 结构
    dictht ht[2];
    long rehashidx; /* rehashing not in progress if rehashidx == -1 */
    unsigned long iterators; /* number of iterators currently running */
} dict;

// 字典元素类型数据定义
typedef struct dictEntry {
  	// 无类型指针，Key指向Val值
    void *key;
    // 值，是一个公用体,他有可能是一个指针，或者一个64位正整数，或者64位int，浮点数
    union {
       	// 值指针
        void *val;
      	// 64位正整数
        uint64_t u64;
      	// 64位int
        int64_t s64;
      	// 浮点数
        double d;
    } v;
  	// next节点，每一个dictEntry都是一个链表，用于处理Hash冲突
    struct dictEntry *next;
} dictEntry;
```


#### redis hash 通过链式地址解决hash碰撞

```c
/* 添加一个元素到目标哈希表 */
int dictAdd(dict *d, void *key, void *val)
{
  	// 向字典中添加key
    dictEntry *entry = dictAddRaw(d,key,NULL);

    if (!entry) return DICT_ERR;
  	// 然后设置节点的值
    dictSetVal(d, entry, val);
    return DICT_OK;
}


/* 低级添加或查找:
 * 此函数添加了元素，但不是设置值而是将dictEntry结构返回给用户，这将确保按需填写值字段.
 *
 * 此函数也直接公开给要调用的用户API主要是为了在哈希值内部存储非指针，例如:
 * entry = dictAddRaw(dict,mykey,NULL);
 * if (entry != NULL) dictSetSignedIntegerVal(entry,1000);
 * 
 * 返回值:
 *
 * 如果键已经存在，则返回NULL，如果不存在，则使用现有条目填充“ * existing”.
 * 如果添加了键，则哈希条目将返回以由调用方进行操作。
 */
dictEntry *dictAddRaw(dict *d, void *key, dictEntry **existing)
{
    long index;
    dictEntry *entry;
    dictht *ht;
	// 判断是否正在ReHash，如果需要则调用_dictRehashStep（后续ReHash中的步骤），每次ReHash一条数据，直到完成整个ReHash
    if (dictIsRehashing(d)) _dictRehashStep(d);

    /* 获取新元素的索引,根据Key计算索引，并且判断是否需要进行扩容ReHash(！！！重点)（第一次ReHash调用） */
    if ((index = _dictKeyIndex(d, key, dictHashKey(d,key), existing)) == -1)
        return NULL;

  	/* 解决Hash冲突，以及ReHash时效率问题 */
    /* 分配内存并存储新条目。假设在数据库系统中更有可能更频繁地访问最近添加的条目，则将元素插入顶部 */
  	// 判断是否需要ReHash，如果是那么当前的HashTable为字典下的第二个，如果不需要扩容则使用原来的的
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    // 创建元素,分配内存
    entry = zmalloc(sizeof(*entry));
  	// 进行元素链表操作，元素的下一个节点指向Hash表中的相应索引，如果以前这个下标有元素则链到当前元素后面
    entry->next = ht->table[index];
  	// Hash表节点索引设置为自己，替换原来的元素
    ht->table[index] = entry;
    ht->used++;

    /* 设置这个Hash元素的Key. */
    dictSetKey(d, entry, key);
    return entry;
}
```



指的注意的即是上面的代码片段中 `ht->table[index] = entry;` 使用链表头插法来实现 kv 的设置，确实是挺高效的，其次对于从hash中查询key，而言首先通过hash得到 hash table 的index，然后遍历链表，得到返回值， 这里hash table 中的链表长度不均匀可能会导致 hash 查询效率下降，但是我们却可以根据 hash 当前状态对hash table 进行rehash，妙极！

> 其实可以通过， hash table 中的元素数量和hash table的占用情况来决定是否进行rehash。


**渐进式rehash：**

redis 的 hash 扩容也是挺有意思的一件事儿，大字典的扩容是比较耗时间的，需要重新申请新的数组，然后将旧字典所有链表中的元素重新挂接到新的数组下面，这是一个 O(n) 级别的操作，作为单线程的 Redis 很难承受这样耗时的过程，所以 Redis 使用 渐进式 rehash 小步搬迁。





这个是类似 Map 的一种结构，这个一般就是可以将结构化的数据，比如一个对象（前提是这个对象没嵌套其他的对象）给缓存在 Redis 里，然后每次读写缓存的时候，可以就操作 Hash 里的某个字段。
但是这个的场景其实还是多少单一了一些，因为现在很多对象都是比较复杂的，比如你的商品对象可能里面就包含了很多属性，其中也有对象。我自己使用的场景用得不是那么多。



### Set：

Set 是无序集合，会自动去重的那种。
直接基于 Set 将系统里需要去重的数据扔进去，自动就给去重了，如果你需要对一些数据进行快速的全局去重，你当然也可以基于 JVM 内存里的 HashSet 进行去重，但是如果你的某个系统部署在多台机器上呢？得基于Redis进行全局的 Set 去重。
可以基于 Set 玩儿交集、并集、差集的操作，比如交集吧，我们可以把两个人的好友列表整一个交集，看看俩人的共同好友是谁？对吧。
反正这些场景比较多，因为对比很快，操作也简单，两个查询一个Set搞定。


### Sorted Set：

Sorted set 是排序的 Set，去重但可以排序，写进去的时候给一个分数，自动根据分数排序。
有序集合的使用场景与集合类似，但是set集合不是自动有序的，而Sorted set可以利用分数进行成员间的排序，而且是插入时就排序好。所以当你需要一个有序且不重复的集合列表时，就可以选择Sorted set数据结构作为选择方案。

- 排行榜：有序集合经典使用场景。例如视频网站需要对用户上传的视频做排行榜，榜单维护可能是多方面：按照时间、按照播放量、按照获得的赞数等。
- 用Sorted Sets来做带权重的队列，比如普通消息的score为1，重要消息的score为2，然后工作线程可以选择按score的倒序来获取工作任务。让重要的任务优先执行。
- 微博热搜榜，就是有个后面的热度值，前面就是名称

高级用法： 


### Bitmap:

位图是支持按 bit 位来存储信息，可以用来实现 布隆过滤器（BloomFilter）；


### HyperLogLog:

供不精确的去重计数功能，比较适合用来做大规模数据的去重统计，例如统计 UV；



### Geospatial:

可以用来保存地理位置，并作位置距离计算或者根据半径计算位置等。有没有想过用Redis来实现附近的人？或者计算最优地图路径？
这三个其实也可以算作一种数据结构，不知道还有多少朋友记得，我在梦开始的地方，Redis基础中提到过，你如果只知道五种基础类型那只能拿60分，如果你能讲出高级用法，那就觉得你有点东西。

### pub/sub：

功能是订阅发布功能，可以用作简单的消息队列。 


### Pipeline：
可以批量执行一组指令，一次性返回全部结果，可以减少频繁的请求应答。


### Lua：

Redis 支持提交 Lua 脚本来执行一系列的功能。
我在前电商老东家的时候，秒杀场景经常使用这个东西，讲道理有点香，利用他的原子性。
话说你们想看秒杀的设计么？我记得我面试好像每次都问啊，想看的直接点赞后评论秒杀吧。
 

