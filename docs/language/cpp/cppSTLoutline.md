---
title: "C++STL解读"
---


## 基本概念

STL组成：容器，算法，迭代器，仿函数，适配器，空间分配器。


- 容器：各种数据结构，如vector、list、deque、set、map等,用来存放数据，从实现角度来看，STL容器是一种class template。容器分线性和非线性容器。

- 算法：各种常用的算法，如sort、find、copy、for_each。从实现的角度来看，STL算法是一种function tempalte.

- 迭代器：扮演了容器与算法之间的胶合剂，共有五种类型，从实现角度来看，迭代器是一种将operator* , operator-> , operator++,operator–等指针相关操作予以重载的class template. 所有STL容器都附带有自己专属的迭代器，只有容器的设计者才知道如何遍历自己的元素。原生指针(native pointer)也是一种迭代器。

- 仿函数：行为类似函数，可作为算法的某种策略。从实现角度来看，仿函数是一种重载了operator()的class 或者class template

- 适配器：一种用来修饰容器或者仿函数或迭代器接口的东西。

- 空间配置器：负责空间的配置与管理。从实现角度看，配置器是一个实现了动态空间配置、空间管理、空间释放的class tempalte.

STL六大组件的交互关系，容器通过空间配置器取得数据存储空间，算法通过迭代器存储容器中的内容，仿函数可以协助算法完成不同的策略的变化，适配器可以修饰仿函数。


### 算法分类

- 质变算法：是指运算过程中会更改区间内的元素的内容。例如拷贝，替换，删除等等
- 非质变算法：是指运算过程中不会更改区间内的元素内容，例如查找、计数、遍历、寻找极值等等。 非质变算法操作容器是线程安全的。


### 迭代器

迭代器(iterator)是一种抽象的设计概念，现实程序语言中并没有直接对应于这个概念的实物。 在`<<Design Patterns>>`一书中提供了23种设计模式的完整描述， 其中iterator模式定义如下：提供一种方法，使之能够依序寻访某个容器所含的各个元素，而又无需暴露该容器的内部表示方式。

迭代器的设计思维-STL的关键所在，STL的中心思想在于将容器(container)和算法(algorithms)分开，彼此独立设计，最后再一贴胶着剂将他们撮合在一起。

### 迭代器的分类

迭代器 | 功能 | 描述
-|-|-
| 输入迭代器	| 提供对数据的只读访问 | 只读，支持++、==、！=
| 输出迭代器	| 提供对数据的只写访问 | 只写，支持++
| 前向迭代器	| 提供读写操作，并能向前推进迭代器 | 读写，支持++、==、！=
| 双向迭代器	| 提供读写操作，并能向前和向后操作 | 读写，支持++、-
| 随机访问迭代器 | 提供读写操作，并能以跳跃的方式访问容器的任意数据，是功能最强的迭代器 | 读写，支持++、–、[n]、-n、<、<=、>、>=


# 顺序容器

## Array

>std::array 是封装固定大小数组的容器。底层就是线性分布的内存元素。

### 注意

零长 array （ N == 0 ）有特殊情况，该情况下， array.begin() == array.end() ，并拥有某个唯一值。在零长 array 上调用 front() 或 back() 的效应是未定义的。


```c++
#include <string>
#include <iterator>
#include <iostream>
#include <algorithm>
#include <array>
 
int main()
{
    // 用聚合初始化构造
    std::array<int, 3> a1{ {1, 2, 3} }; // CWG 1270 重申前的 C++11 中要求双花括号
                                        // （ C++11 之后的版本和 C++14 起不要求）
    std::array<int, 3> a2 = {1, 2, 3};  // = 后决不要求
    std::array<std::string, 2> a3 = { std::string("a"), "b" };
 
    // 支持容器操作
    std::sort(a1.begin(), a1.end());
    std::reverse_copy(a2.begin(), a2.end(), 
                      std::ostream_iterator<int>(std::cout, " "));
 
    std::cout << '\n';
 
    // 支持带范围 for 循环
    for(const auto& s: a3)
        std::cout << s << ' ';
}
```


## Vector

>vector 的存储是自动管理的，按需扩张收缩。 vector 通常占用多于静态数组的空间，因为要分配更多内存以管理将来的增长。 vector 所用的方式不在每次插入元素时，而只在额外内存耗尽时重分配。分配的内存总量可用 capacity() 函数查询。额外内存可通过对 shrink_to_fit() 的调用返回给系统。(c++11)

### 成员方法

- **reserve**

	增加 vector 的容量到大于或等于 new_cap 的值。若 new_cap 大于当前的 capacity() ，则分配新存储，否则该方法不做任何事。增加 vector 的容量到大于或等于 new_cap 的值。若 new_cap 大于当前的 capacity() ，则分配新存储，否则该方法不做任何事。

- **shrink_to_fit**

	请求移除未使用的容量。 它是减少 capacity() 到 size()非强制性请求。请求是否达成依赖于实现。 若发生重分配，则所有迭代器，包含尾后迭代器，和所有到元素的引用都被非法化。若不发生重分配，则没有迭代器或引用被非法化。

- **resize**

	resize, 重置size大小，可能会引起内存的重分配，导致迭代器失效。

### 非成员方法



- std::swap(std::vector)
  特化 std::swap 算法
- erase(std::vector)
- erase_if(std::vector) (C++20)

```c++
#include <iostream>
#include <vector>
 
int main()
{
    // 创建含有整数的 vector
    std::vector<int> v = {7, 5, 16, 8};
 
    // 添加二个整数到 vector
    v.push_back(25);
    v.push_back(13);
 
    // 迭代并打印 vector 的值
    for(int n : v) {
        std::cout << n << '\n';
    }
}
```

当容器所持内存发生重新分配，其迭代器失效。

## Deque

>std::deque （ double-ended queue ，双端队列）是有下标顺序容器，它允许在其首尾两段快速插入及删除。另外，在 deque 任一端插入或删除不会非法化指向其余元素的指针或引用。
与 std::vector 相反， deque的元素不是相接存储的：典型实现用单独分配的固定大小数组的序列，外加额外的登记，这表示下标访问必须进行二次指针解引用，与之相比 vector 的下标访问只进行一次。
deque 的存储按需自动扩展及收缩。扩张 deque 比扩展 std::vector 便宜，因为它不涉及到复制既存元素到新内存位置。另一方面， deque 典型地拥有较大的最小内存开销；只保有一个元素的 deque 必须分配其整个内部数组（例如 64 位 libstdc++ 上为对象大小 8 倍； 64 位 libc++ 上为对象大小 16 倍或 4096 字节的较大者）。

Deque与Vector非常相似，它也采用dynamic array进行管理，提供随机访问，同时具有与vector一模一样的接口。不同的是Deque的dynamic array头尾都是开放的，因此可以在两端进行快速的插入和删除。

![](/images/deque1.png)

为了提供这种能力，deque通常实现了一种独立区块（a bunch of individual blocks），第一区块朝某一方向扩展，最末区块朝另一方向扩展。

![](/images/deque2.png)

---

![](/images/deque3.png)



### 和vector相比

Deque与Vector相比，有所相同，又有所不同，下面是两者的异同点：

#### 相同之处

1. 支持随机访问，迭代器均属于random-access iterator；
2. 基于中间位置的元素的移除和插入，速度都比较慢，因为要进行大量元素的移动和复制操作；
3. vector所支持的接口在deque上都能使用，且具有相同的效果。

#### 不同之处

1. 两端都能够进行快速的插入和移除操作；
2. 访问deque时，内部结构会多一个间接过程，因此元素的访问以及迭代器的动作会相比vector较慢；
3. 迭代器需要在不同的区块间进行跳转，因此迭代器必须是smart_pointer,不能是寻常pointer；
4. Deque不支持对容量大小的控制，需要特别注意的是，除了首尾两端，在任何地点安插或者删除元素都会导致pointer、reference和iterator的失效；
5. Deque重新分配内存优于vector，因为其内部结构显示，deque重新分配内存的时候，不需要复制所有的元素；
6. Deque会释放不需要的内存块，Deque的大小是可缩减的，但是要不要这么做，如何做，取决于编译器。

总结：显然，deque具有vector的特性，且比vector更强大，但C++之中，更强大的功能往往意味这更大的时空开销，如何在性能和开销上作取舍，取决于具体应用场景。

### Deque适用场景

1. 移除和插入操作发生在首尾两端（Deque的特性决定了该操作效率惊人）；
2. 无须迭代器指向其元素（Deque扩容机制导致了其迭代器更容易失效）；
3. 要求不再使用的元素必须释放（Deque能够释放不使用的内存块，但C++ standard并不保证这一点，依赖于编译器实现）。

### 迭代器失效

- 从 deque 任一端插入时， insert 和 emplace 不会非法化引用。
- push_front 、 push_back 、 emplace_front 和 emplace_back 不会非法化任何到 deque 元素的引用。
- 从 deque 任一端擦除时， erase 、 pop_front 和 pop_back 不会非法化到未擦除元素的引用。
- 以较小的大小调用 resize 不会非法化任何到未擦除元素的引用。
- 以较大的大小调用 resize 不会非法化任何到 deque 元素的引用。



## Forward_list

>std::forward_list 是支持从容器中的任何位置快速插入和移除元素的容器。不支持快速随机访问。它实现为单链表，且实质上与其在 C 中实现相比无任何开销。与 std::list 相比，此容器提在不需要双向迭代时提供更有效地利用空间的存储。

### 物理存储

链表当然就是以节点链存储的。


### 成员方法


- merge

	归并二个已排序链表为一个。链表应以升序排序。不复制元素。操作后容器other变为空。若other与 \*this指代同一对象则函数不做任何事。若 get_allocator() != other.get_allocator() ，则行为未定义。没有引用和迭代器变得非法，除了被移动元素的迭代器现在指代到 *this 中，而非到 other 中，第一版本用 operator< 比较元素，第二版本用给定的比较函数 comp 。此操作是稳定的：对于二个链表中的等价元素，来自 *this 的元素始终前驱来自 other 的元素，而且 *this 和 other 的等价元素顺序不更改。


- splice_after

	从另一 forward_list 移动元素到 *this 。不复制元素。 pos 必须是指向 *this 中的可解引用迭代器或 before_begin() 迭代器（特别是 end() 不是 pos 的合法参数值）。若 get_allocator() != other.get_allocator() 则行为未定义。没有迭代器或引用被非法化，指向被移动的元素的迭代器现在指代到 *this 中，而非 other 中。

	1) 从 other 移动所有元素到 *this 。元素被插入到 pos 所指向的元素后。操作后 other 变为空。若 other 与 *this 指代同一对象则行为未定义。

	2) 从 other 移动后随 it 的迭代器所指向的元素到 *this 。元素被插入到 pos 所指向的元素后，若 pos == it 或若 pos == ++it 则无效果。

	3) 从 other 移动范围 (first, last) 中的元素到 *this 。元素被插入到 pos 所指向的元素后。不移动 first 所指向的元素。若 pos 是范围 (first,last) 中的元素则行为未定义。


### 迭代器失效

在链表内或跨数个链表添加、移除和移动元素，不会非法化当前指代链表中其他元素的迭代器。然而，在从链表移除元素（通过 erase_after ）时，指代对应元素的迭代器或引用会被非法化。


## List


>std::list 是支持常数时间从容器任何位置插入和移除元素的容器。不支持快速随机访问。它通常实现为双向链表。与 std::forward_list 相比，此容器提供双向迭代但在空间上效率稍低。
在 list 内或在数个 list 间添加、移除和移动元素不会非法化迭代器或引用。迭代器仅在对应元素被删除时非法化。


![](/images/list.png)


### 迭代器失效

在 list 内或在数个 list 间添加、移除和移动元素不会非法化迭代器或引用。迭代器仅在对应元素被删除时非法化。

```c++
#include <algorithm>
#include <iostream>
#include <list>
 
int main()
{
    // 创建含整数的 list
    std::list<int> l = { 7, 5, 16, 8 };
 
    // 添加整数到 list 开头
    l.push_front(25);
    // 添加整数到 list 结尾
    l.push_back(13);
 
    // 以搜索插入 16 前的值
    auto it = std::find(l.begin(), l.end(), 16);
    if (it != l.end()) {
        l.insert(it, 42);
    }
 
    // 迭代并打印 list 的值
    for (int n : l) {
        std::cout << n << '\n';
    }
}
```




# 关联容器

## 有序关联容器

>关联容器实现能快速查找（ O(log n) 复杂度）的数据结构。

## Set/Multiset

>std::set 是关联容器，含有 Key 类型对象的已排序集。用比较函数 Compare 进行排序。搜索、移除和插入拥有对数复杂度。 set通常以**红黑树**实现。

>multiset特性及用法和set完全相同，唯一的差别在于它允许键值重复。set和multiset的底层实现是红黑树.

### 成员方法

- extract
    
    extract从set中带走移动节点。返回其节点句柄。
    ```c++
    //node_type extract( const_iterator position ); (1) (C++17 起) 
    //node_type extract( const key_type& x ); (2) (C++17 起) 
    //g++ test.cpp -std=c++17
    ```


    ```c++


    #include<iostream>
    #include<set>
    #include<iterator>
    #include<algorithm>



    int main() {

        std::set<int> is{12, 55, 85, 27, 3};
        std::copy(is.begin(), is.end(), 
                    std::ostream_iterator<int>(std::cout, " "));
        std::cout<<"\n";

        auto r = is.extract(2);
        std::copy(is.begin(), is.end(), 
                        std::ostream_iterator<int>(std::cout, " "));
        std::cout<<"\n";

        std::cout<<r.value()<<std::endl;


        return 0;
    }
    ```

- merge

    试图释出（“接合”） source 中每个元素，并用 *this 的比较对象插入到 *this 。 若 *this 中有元素，其关键等价于来自 source 中元素的关键，则不从 source 释出该元素。 不复制或移动元素，只会重指向容器结点的内部指针。指向被转移元素的所有指针和引用保持合法，但现在指代到 *this 中而非到 source 中。若 get_allocator() != source.get_allocator() 则行为未定义。

    >不抛异常，除非比较抛出。

- 查找 
    

函数名称 | 功能
-|-|
| count | 返回匹配特定键的元素数量
| find | 寻找带有特定键的元素 
| contains(C++20) | 检查容器是否含有带特定关键的元素
| equal_range | 返回匹配特定键的元素范围
| lower_bound | 返回指向首个不小于给定键的元素的迭代器
| upper_bound |返回指向首个大于给定键的元素的迭代器 

需要注意的是这些比较都是基于set的比较器的，equal_range返回pair。


## Map/MultiMap

>std::map 是有序键值对容器，它的元素的键是唯一的。用比较函数 Compare 排序键。搜索、移除和插入操作拥有对数复杂度。 map 通常实现为红黑树。


函数名称 | 功能
-|-|
| insert_or_assign(C++17) | 插入元素，或若关键已存在则赋值给当前元素
| try_emplace(C++17) | 若键不存在则原位插入，若键存在则不做任何事
| contains(C++20) | 检查容器是否含有带特定关键的元素
| merge(C++17) | 从另一容器接合结点
| equal_range | 返回匹配特定键的元素范围
| lower_bound | 返回指向首个不小于给定键的元素的迭代器
| upper_bound |返回指向首个大于给定键的元素的迭代器 


## unordered_set

>unordered_set is 是含有 Key 类型唯一对象集合的关联容器。搜索、插入和移除拥有平均常数时间复杂度。
在内部，元素并不以任何特别顺序排序，而是组织进桶中。元素被放进哪个桶完全依赖其值的哈希。这允许对单独元素的快速访问，因为哈希一旦，就准确指代元素被放入的桶。

![](/images/hashmap.png) 
 
我们知道unordered_set是hash桶存储的，所以有不同的桶，所以我们有两种级别的操作，容器级别和bucket级别。所以也有桶级别迭代器和容器级别迭代器。


函数名称 | 功能 
-|-|
| contains(C++20) | 检查容器是否含有带特定关键的元素
| merge(C++17) | 从另一容器接合结点 
| begin(size_type) cbegin(size_type) | 返回一个迭代器，指向指定的桶的开始
| end(size_type) cend(size_type) | 返回一个迭代器，指向指定的桶的末尾
| bucket_count | 返回桶数 
| max_bucket_count | 返回桶的最大数量
| bucket_size | 返回在特定的桶中的元素数量
| bucket | 返回带有特定键的桶
| load_factor | 返回每个桶的平均元素数量
| max_load_factor | 管理每个桶的平均元素数量的最大值
| rehash | 为至少为指定数量的桶预留存储空间。这会重新生成哈希表。
| reserve | 为至少为指定数量的元素预留存储空间。 这会重新生成哈希表。
| hash_function | 返回用于对关键哈希的函数
| key_eq | 返回用于比较键的相等性的函数


## unordered_map

>unordered_map其底层原理也是hash表。

函数名称 | 功能 
-|-|
| contains(C++20) | 检查容器是否含有带特定关键的元素
| equal_range | 返回匹配特定键的元素范围
| begin(size_type) cbegin(size_type) | 返回一个迭代器，指向指定的桶的开始
| end(size_type) cend(size_type) | 返回一个迭代器，指向指定的桶的末尾
| bucket_count | 返回桶数 
| max_bucket_count | 返回桶的最大数量
| bucket_size | 返回在特定的桶中的元素数量
| bucket | 返回带有特定键的桶
| load_factor | 返回每个桶的平均元素数量
| max_load_factor | 管理每个桶的平均元素数量的最大值
| rehash | 为至少为指定数量的桶预留存储空间。这会重新生成哈希表。
| reserve | 为至少为指定数量的元素预留存储空间。 这会重新生成哈希表。
| hash_function | 返回用于对关键哈希的函数
| key_eq | 返回用于比较键的相等性的函数


### 迭代器失效

- swap 函数不非法化容器内的任何迭代器，但它们非法化标记交换区域结尾的迭代器。
- 指向存储于容器中的关键或元素的引用和指针仅因擦除该元素才被非法化





unordered_multiset，unordered_multimap(C++11 起)，和unordered_set，unordered_map类似，只是键不在唯一。



# 适配器

## Stack

>std::stack 类是容器适配器，它给予程序员栈的功能——特别是 FILO （先进后出）数据结构。
该类模板表现为底层容器的包装器——只提供特定函数集合。栈从被称作栈顶的容器尾部推弹元素。

## Queue

>std::stack 类是容器适配器，它给予程序员栈的功能——特别是 FILO （先进后出）数据结构。
该类模板表现为底层容器的包装器——只提供特定函数集合。栈从被称作栈顶的容器尾部推弹元素。


## priority_queue

>priority_queue 是容器适配器，它提供常数时间的（默认）最大元素查找，对数代价的插入与释出。
可用用户提供的 Compare 更改顺序，例如，用 `std::greater<T>` 将导致最小元素作为 top() 出现。
用 priority_queue 工作类似管理某些随机访问容器中的堆，优势是不可能突然把堆非法化。




所谓适配器，是一种对容器接口的一种高层次的封装和应用，上层接口不依赖于具体容器。



## Span

>类模板 span 所描述的对象能指代对象的相接序列，序列的首元素在零位置。 span 能拥有静态长度，该情况下序列中的元素数已知并编码于类型中，或拥有动态长度。
典型实现只保有二个成员：指向 T 的指针和大小。


>c++20还未商业化，用到再说。