---
title: "matlab计算方差均值"
date: 2020-04-22T15:38:14+08:00
lastmod: 2020-04-22T15:38:14+08:00
description: ""
tags: ["概率论", "数学"]
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

## 首先谈谈概念

### 均值

均值表示信号中直流分量的大小，用E(x)表示。对于高斯白噪声信号而言，它的均值为0，所以它只有交流分量。

![](/images/expect.png)

### 均值的平方

均值的平方，用{E(x)}^2表示，它表示的是信号中直流分量的功率。

### 均方值

均方值表示信号平方后的均值，用E(x^2)表示。均方值表示信号的平均功率。信号的平均功率 = 信号交流分量功率 + 信号直流分量功率

例如：x、y、z 3项求均方值。

E(x^2)=（x^2+y^+z^）/3

>关于功率请参考帕斯瓦尔定律

### 均方根值

均方根值，用RMS（root mean square）,既均方值的开根号  

![](/images/expectsqueare.png)

### 均方差

均方差（mean square error），用MSE表示。均方差是各数据偏离真实值的距离平方和的平均数，也即误差平方和的平均数，计算公式形式上接近方差，它的开方叫均方根误差，均方根误差才和标准差形式上接近。均方差有时候被认为等同于方差。

![](/images/expectsuqareerror.png)

### 均方根误差

均方根误差用RMSE（root mean square error）表示。它是观测值与真值偏差的平方和观测次数n比值的平方根，在实际测量中，观测次数n总是有限的，真值只能用最可信赖（最佳）值来代替.方根误差对一组测量中的特大或特小误差反映非常敏感，所以，均方根误差能够很好地反映出测量的精密度。均方根误差有时候被认为是标准差。

![](/images/rootexpectsquaer.png)

### 方差

方差用variance或deviation 或Var表示。 方差描述信号的波动范围，表示信号中交流分量的强弱，即交流信号的平均功率。

![](/images/var001.png)


### 标准差（Standard Deviation）

标准差（Standard Deviation）用σ表示，有的时候标准差又可以被称为均方根误差RMSE。 标准差是各数据偏离平均数的距离的平均数，它是离均差平方和平均后的方根，用σ表示，标准差能反映一个数据集的离散程度。

标准差σ， 反映了测量数据偏离真实值的程度，σ越小，表示测量精度越高，因此可用σ作为评定这一测量过程精度的标准。

![](/images/sigma.png)

## matlab求解

### 求解均值

#### matlab函数mean

**Syntax**

```bash
M = mean(A)
M = mean(A,'all')
M = mean(A,dim)
M = mean(A,vecdim)
M = mean(___,outtype)
M = mean(___,nanflag)
```

1. M = mean(A) 返回 A 沿大小不等于 1 的第一个数组维度的元素的均值。
如果 A 是向量，则 mean(A) 返回元素均值。
如果 A 为矩阵，那么 mean(A) 返回包含每列均值的行向量。
如果 A 是多维数组，则 mean(A) 沿大小不等于 1 的第一个数组维度计算，并将这些元素视为向量。此维度会变为 1，而所有其他维度的大小保持不变。

2. M = mean(A,'all') 计算 A 的所有元素的均值。此语法适用于 MATLAB® R2018b 及更高版本。

3. M = mean(A,dim) 返回维度 dim 上的均值。例如，如果 A 为矩阵，则 mean(A,2) 是包含每一行均值的列向量。

4. M = mean(A,vecdim) 计算向量 vecdim 所指定的维度上的均值。例如，如果 A 是矩阵，则 mean(A,[1 2]) 是 A 中所有元素的均值，因为矩阵的每个元素都包含在由维度 1 和 2 定义的数组切片中。

5. M = mean(___,outtype) 使用前面语法中的任何输入参数返回指定的数据类型的均值。outtype 可以是 'default'、'double' 或 'native'。

6. M = mean(___,nanflag) 指定在上述任意语法的计算中包括还是忽略 NaN 值。mean(A,'includenan') 会在计算中包括所有 NaN 值，而 mean(A,'omitnan') 则忽略这些值。


### 求方差

### matlab函数var

**Syntax**
```bash
V=var(X,flag,dim) 
```
参数解释如下： 
```bash
X为矩阵或者向量; 
flag为权值，当flag等于0时：前置因子是1/(n-1)，当flag等于1时：前置因子是1/(n)，默认是0； 
dim为维数，当dim=1时，表示计算列，当dim=2时，表示计算行。
```

>Y = var(X,W,DIM) takes the variance along the dimension DIM of X.  Pass in 0 for W to use the default normalization by N-1, or 1 to use N.
The variance is the square of the standard deviation (STD).


### 求标准差

#### matlab函数std

**Syntax**
```bash
V=std(X,flag,dim) 
```
参数解释如下： 
```bash
X为矩阵或者向量; 
flag为权值，当flag等于0时：前置因子是1/(n-1)，当flag等于1时：前置因子是1/(n)，默认是0； 
dim为维数，当dim=1时，表示计算列，当dim=2时，表示计算行。
```

## 栗子

### std和var

```bash
clc;clear;
matrix=[1, 2, 3; 4, 5, 6];

matrix_var_col=var(matrix); % 计算方差，权值为0，维度为1，也就是计算列方差
%matrix_var_col =
%    4.5000    4.5000    4.5000

matrix_var_row=var(matrix,0,2);% 计算方差，权值为0，维度为2，也就是计算行方差
%matrix_var_row =
%     1
%     1

matrix_std_col=std(matrix,1);% 计算标准差，权值为1，维度为1，也就是计算列标准差
%matrix_std_col =
%    1.5000    1.5000    1.5000

matrix_std_row=std(matrix,1,2);% 计算标准差，权值为1，维度为2，也就是计算行标准差
%matrix_std_row =
%    0.8165
%    0.8165

```