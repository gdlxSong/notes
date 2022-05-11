---
title: "自动类型推导"
date: 2020-04-25T11:53:16+08:00
lastmod: 2020-04-25T11:53:16+08:00
description: ""
tags: ["c++11", "c++"]
categories: ["c++"]
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

## auto

1. 自动类型推导，推导表达式必须是具有初始化的。
2. 同一个auto只能推导一种类型。
                auto a = 10, b = 20.0;
3. auto在c++11语法中不再表示存储类型控制符，而是一个类型占位符，在编译器被推导出来的类型替换。
4. 当表达式中带有const(volatile)时，auto会把const属性抛弃，其实就是顶层与底层constant。
                const int a = 10; auto b  = a; //b->int;
5. auto虽然可以简化我们的编程，但是使得代码的可维护性和可读性就降低了很多。

## decltype
0. 在编译时推导一个表达式的类型。
1. decltype之于auto的不同之处在于不需要初始化就定义自动类型推导的变量。
2. decltype可以完整的保留cv限定符(const,volatile)和引用符号，因为是根据代码的字符串在编译器推导的。
3. 对于decltype和引用的结合的推导规则遵循引用的折叠规则。
4. 推导规则1：exp是一个标识符，类访问表达式，decltype(exp)与exp的类型一致。
5. 推导规则2：exp是一个函数调用，decltype(exp)与函数返回值类型一致。
6. 推导规则3：其他情况，若exp是一个左值，decltype(exp)是exp类型的左值引用，否则和exp类型一致。

```cpp
//test for decltype.

strcut Foo{int x;};
const struct Foo foo;

decltype(foo.x)  a = 0;     //a -> int        //decltype推导规则1
decltype((foo.x)) b = a;    //b -> const int&    //规则3
```


在《深入应用c++11》书p12页有这么一个例子：

```cpp
#include<vector>
template<class ContainerT>
class Foo {
       typename ContainerT::iterator it_;
public:
       void func(ContainerT& container) {
              it_ = container.begin();
       }
       //void func(const ContainerT& container) {
       //     it_ = container.begin();
       //}
};
//按照cv的参数传递规则不应该是这样呀。


int main() {
       typedef  std::vector<int> container_t;
       container_t arr;
       Foo<container_t> foo;
       foo.func(arr);
       return 0;
}
```
//对于单独的Foo的设计，表面上是莫得问题的，其问题在于begin函数的返回值类型并不总是ContainerT::iterator， 也有可能是ContainerT::const_iterator, 所以产生了一个非泛型的结果。


可以使用模板来解决此问题。

```cpp
#include<vector>
template<class ContainerT>
class Foo {
       typename ContainerT::iterator it_;
public:
       void func(ContainerT& container) {
              it_ = container.begin();
       }
       //void func(const ContainerT& container) {
       //     it_ = container.begin();
       //}
};
template<class ContainerT>
class Foo<const ContainerT> {
       typename ContainerT::const_iterator it_;
public:
       void func(const ContainerT& container) {
              it_ = container.begin();
       }
};
int main() {
       typedef const std::vector<int> container_t;
       container_t arr;
       Foo<container_t> foo;
       foo.func(arr);
       return 0;
}
```
//这样特化，不可谓是一个不好的解决方案，因为这回导致大量的代码重写。

那就使用decltype？何如！

```cpp
#include<vector>
template<class ContainerT>
class Foo {
       decltype(ContainerT().begin()) it_;
public:
       void func(ContainerT& container) {
              it_ = container.begin();
       }
};
int main() {
       typedef const std::vector<int> container_t;
       container_t arr;
       Foo<container_t> foo;
       foo.func(arr);
       return 0;
}
```

## auto和decltype结合实现返回值后置

### add实现1

```cpp
template<P1 p1, P2 p2>
    decltype(p1()+p2()) add(p1 c1 p2 c2){
        return c1+c2;
	}
```
但是这样是否想过，万一类型p1，p2不存在默认构造函数呢。

### add实现2

```cpp
template<class T, class U>
    decltype((*(T*)0) + (*(U*)0)) add(T t, U u){
        return t+u;
    }
```
这样做呢，在理论上是莫得毛病的，但是其实还是有问题不是，就是泰复炸了。

### add实现3

```cpp
template<class T, class U>
    auto add(T t, U u) -> decltype(u+t){
        return t+u;
    }
```
这样呢，因为u，t是对象实例，是标识符，符合decltype的推到规则，ojbk，漂亮。