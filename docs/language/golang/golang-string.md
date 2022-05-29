---
title: "Golang之string"
date: 2020-07-02T22:18:38+08:00
lastmod: 2020-07-02T22:18:38+08:00
description: ""
tags: ["golang", "string"]
categories: ["golang"]
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


## string的定义

在runtime.h中的定义如下：

```c
struct string {
	byte* str;				//typedef uint8_t byte， 因为采用utf8字符集，所以不使用char
	intgo len;
}
```

可以看到，string内部包含一个byte类型的数组，存储utf8的字符序列，len存储byte序列的长度。

而在golang，指针不可类型转换（非unsafe），不可移位运算，所以不可直接方位byte数组，而是重载string的operator[]运算符，来个read only，至于string也就自然而然成为了int一样的值类型。


在golang中做一个关于string的测试（值类型）：

```c
package main
import "fmt"
import "reflect"


func main() {
    
    var s = "123456"
    fmt.Printf("str address = %x\n", &s)
    s = "456789sadwadwa"
    fmt.Printf("str address = %x\n", &s)
    s = s[3:] + "拟把疏狂"
    fmt.Printf("str address = %x\n", &s)
    fmt.Println(s)
    var c = s[0]
    fmt.Println(reflect.TypeOf(c))
}
```

**程序输出：**

```bash
str address = c21001e140
str address = c21001e140
str address = c21001e140
789sadwadwa拟把疏狂
uint8
```


在上面的程式中，变量s的存储地址没有发生变化，改变其值，发生改变的是s.str，这点在c++中很好理解。



### 偷偷地取出一个string.str的序列地址。

```c
package main
import "fmt"
import "unsafe"


type String struct{
    Str []byte
    Len int32
}

func main() {
    
    var str = "123456"
    var p = (*String)(unsafe.Pointer(&str))
    fmt.Printf("对tring数据重新解析 p.Str = %s", string(p.Str))
}
```


**输出如下：**

```c
对tring数据重新解析 p.Str = 123456
```






问：

临江一任雨潇潇，迭起新潮似旧潮。 	//雨飘落到江面，时雨绵绵，江水涨潮，一个浪头淹没一个浪头，回忆也如波涛，汹涌向我拍打而来。
每逢蓬舟思远渡，时闻燕语叹清寮。 	//理想如蓬舟向往汪洋，远行的人总是有一个孤独的背影，燕归巢，家又在何方？
深情未敢朝天许，残阕难成入梦遥。 	//不敢指天为誓，划地为盟（嘶声力竭，海誓山盟毕竟是小孩子的事情，有担当的人不敢轻易许下承诺），物质生活撕扯着我们向前，相爱的人各奔西东，离散飘零。
问使当垆谁卖酒，今生可否到前朝？	//这个是时代的爱情，还有没有当垆卖酒的传说，我是否能去找到她，像东汉的司马相如和卓文君，'愿得一人心，白首不相离。'

清寮：清幽静寂
残阕：破败的房子
当垆卖酒：东汉司马相如和卓文君私奔的爱情故事。



答：

平生不许伤往事，					//我希望我这一生都不要为往事烦恼
文君犹有怨郎词。					//在世人看来司马相如和卓文君那么传奇的爱情中，卓文君也有《怨郎词》怨怼司马相如喜新厌旧。
勿须待此成追忆，					//不要等到所有的事情尘埃落定，再去追忆往事，空空留遗憾
沧海抱柱不敢辞。					//沧海抱柱出自《庄子·盗跖》，指代信守诺言的人，我想到我以前许下的誓言，坚定信念，去追逐，去拥抱，失而复得的美好，不让时光蹉跎，空留遗憾。
								//没有遗憾，也就不会为往事烦恼，解释第一句。


勿须待此成追忆：和李商隐《锦瑟》：“此情可待成追忆，只是当时已惘然。”取反义。
沧海抱柱：典故《庄子·盗跖》：“尾生与女子期于梁下，女子不来，水至不去，抱梁柱而死。”，尾生是一个人。







题外：

喜剧演员李诞有一本书《人间不值得》，我不觉得，使然这个世界上有太多两条腿的禽兽，是有太多事情远比小说故事更加荒诞，但每当夜深人静的时候，也就是这个时候吧，我问我自己，你到底想要什么？
渺小的，伟大的，干净的，肮脏的，整齐的，凌乱的，正经的，荒唐的？ 我承认这个世界上有太多不平凡的伟大，有一些脑壳尖的，长得乖的，有正气凌然的猥琐大叔，也有邋里邋遢的绝世高手。 可是我想要的，
是和我相关的，









