---
title: "可变参数模板"
date: 2020-04-25T14:19:34+08:00
lastmod: 2020-04-25T14:19:34+08:00
description: ""
tags: ["c++", "c++Template"]
categories: ["c++"]
author: "xGdl"
keywords: ["c++"]
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


## 简介

我们使用模板来实现可变参数。

在c++11现世后，增强了模板的功能，允许模板定义0个或多个模板参数，可变参数模板和可变参数模板语义是一样的，只是需要在class或typename后面带上...

省略号的作用：
1) 声明一个参数包，这个参数包中可以包含0到人一个模板参数。
2) 在模板定义的右边，可以将参数包展开成一个又一个独立的参数。

```cpp
#include<iostream>
template<class... T>
void func(T... args) {
       std::cout << sizeof...(args) << std::endl;
}
int main() {
       func(1, 2, 3, 5, "啦啦啦");
       return 0;
}

// ------------------------
// output：5
```


## 模板函数参数包的展开

### 递归函数方式展开参数包

递归函数的方式展开参数包我们需要两个函数：一个递归函数，一个递归终止函数。

```cpp
#include<iostream>
void Func() {
       std::cout << std::endl;
       //end...
}
template<class HEAD, class ...Args>
void Func(HEAD head, Args... args) {
       std::cout << head << " " << std::ends;
       Func(args...);
}
int main() {
       Func(1, 2, 3, 5, "啦啦啦");
       return 0;
}
```

当递归函数存在返回值时(非void)

```c++
#include<iostream>
void Func() {
       std::cout << std::endl;
       //end...
}
template<class HEAD, class ...Args>
auto Func(HEAD head, Args... args) ->HEAD {
       std::cout << head << " " << std::ends;
       Func(args...);
       return head;
}
int main() {
       Func(1, 2, 3, 5, "啦啦啦");
       return 0;
}
```

1. 这里，因为递归函数最后的递归调用是Func();所以递归终止函数的返回类型是无所谓的，只要名字和参数(void)到位就行了，->  T Func(void);
2. 另外终止函数不一定是在0个参数的时候终止，在递归调用解包的原理上，递归解包只是利用函数调用在候选函数中，函数模板的优先级低于普通函数的原理。

### 使用都好表达式和初始化列表展开参数包

```cpp
template<class T>
void print(T t){
    std::cout<<t<<std::ends;
}

template<class... Args>
void Func(Args... args){
    std::initializer_list<int> expend = { (print(args), 0 )...};
}
```

```cpp
template<class... Args>
void Test(Args... args) {
       auto expend = { ([&] {std::cout << args << std::ends; }(), 0)... };
}
```

## 模板函类参数包的展开

### 模板递归+模板特化展开参数包

```cpp
template<class... Args>
struct Sum;

template<class First, class... Args>
struct Sum<First, Args...> {
       enum {value = Sum<First>::value + Sum<Args...>::value};
};

template<class Last>
struct Sum<Last> {
       enum {value = sizeof(Last) };
};
```

### 使用继承std::integral_constant展开参数包

```cpp
template<class... Args>
struct cSum : std::integral_constant<int, 0> {};

template<class First, class... Args>
class cSum<First, Args...> : public std::integral_constant<int, cSum<First>::value  + cSum<Args...>::value> {};

template<class Last>
class cSum<Last> : public std::integral_constant<int, sizeof(Last)> {};
```


