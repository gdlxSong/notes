---
title: "概率论随记"
date: 2020-04-16T16:49:27+08:00
lastmod: 2020-04-16T16:49:27+08:00
description: ""
tags: ["概率论"]
categories: ["概率论"]
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



## 概率论

### 独立同分布

>独立同分布（independent and identically distributed，i.i.d.）在概率统计理论中，指随机过程中，任何时刻的取值都为随机变量，如果这些随机变量服从同一分布，并且互相独立，那么这些随机变量是独立同分布。

>如果随机变量 X1 和 X2 独立，是指 X1 的取值不影响 X2 的取值， X2 的取值也不影响 X1 的取值且随机变量。 X1 和 X2 服从同一分布，这意味着 X1 和 X2 具有相同的分布形状和相同的分布参数，对离随机变量具有相同的分布律，对连续随机变量具有相同的概率密度函数，有着相同的分布函数，相同的期望、方差。

#### 独立
每次抽样之间是没有关系的，不会相互影响。

就像抛骰子每次抛到几就是几这就是独立的，但如果要两次抛的和大于8，其余的不算，那么第一次抛和第二次抛就不独立了，因为第二次抛的时候结果是和第一次相关的。

#### 同分布
每次抽样，样本都服从同样的一个分布。

抛骰子每次得到任意点数的概率都是1/6，这就是同分布的。但如果第一次抛一个6面的色子，第二次抛一个正12面体的色子，就不再是同分布了。