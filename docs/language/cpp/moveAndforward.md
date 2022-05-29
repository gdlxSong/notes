---
title: "移动和完美转发"
date: 2020-04-25T12:09:39+08:00
lastmod: 2020-04-25T12:09:39+08:00
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


## 概念

左值是指表达式结束后依然存在的持久对象，右值是指表达式结束后不再存在的临时对象。

c++中有左值和右值之分。
在c++11后，右值又分为纯右值(prvalue,PureRvalue)和将亡值(x-value, expiring value)。
    
纯右值： 非引用返回的临时变量，运算表达式产生的临时变量，原始字面量，lambda表达式等。
将亡值： 与右值引用相关的表达式，将要移动的对象，T&&函数返回值， std::move返回值，转换为T&&类型的转换函数的返回值。

左值引用 和 右值引用一样，都只是个引用（是个右值），不同点是，左值引用只能绑定到左值； 右值引用可以绑定到右值，并且左值常量引用也可以绑定到右值。

## 引用折叠

```c++
    template<class T>
    void fun(T&& t){};
//在自动类型推到中
//这里的t是未定引用类型(universal reference), 她是左值还是右值取决于它的初始化参数，被左值初始化就是左值引用，被右值初始化就是右值引用。

-------------------------------
    template<class T>
    class Foo{

    public:
        Foo(Foo<T>&&){}
    }
//在这里Foo<T>是确定类型，不存在类型推断，所以不是universal reference。

-------------------------------
    template<class T>
    void fun(const T&& t){}
//这里因为存在const，所以不是universal reference.

```

注意！ universal reference仅仅在T&&下发生，任何一点附加条件都会使之失效，变成一个普通的右值引用。

引用折叠的规则如下：
1) 所有右值引用叠加到右值引用上还是一个右值引用。
2) 所有其他引用类型之间的叠加都将变成左值引用。

## std::move

对于std::move到底做了啥，让人爱恨交加难以自拔？

 事实上，std::move只是做了将对象的类型强制转换为该类型的右值，从而为浅拷贝的实现做准备，但是实现浅拷贝的真实地点不在于std::move，而是类本身的T(T&&)来实现支持，这里将std::move和浅拷贝联系起来的一个关键点就在于： 在约定俗程中我们默认认为T(T&)实现深拷贝，T(T&&)实现浅拷贝。

 std::move()强转对象为右值。

 所以说，右值引用 和 std::move 对那种包含一大块内存的 临时对象 具有很大的利用率。尤其是对于需要在内部new一些内存的对象（如vector, 很长的 string等等）。对于这些对象，自己要写 move 构造函数 和 move operator（对于自己编写的类，如果实现了copy operations, move operations, or destructors 这里头的任何一个函数，编译器就不会默认自动生成这些函数了，需要自己挨个实现——or 显示写=default）。 而且要考虑自己写的哪些函数会影响编译自动生成的函数（默认构造，默认复制，默认赋值 等等等）。

c++11所有的 stl 容器都已经实现了 move constructor 和 move assignment operator， 在使用标准容器的时候可以可以考虑优化一下代码。

>The compiler tries to elide copies, invokes a move constructor if it can’t remove copies, calls a copy constructor if it can’t move, and fails to compile if it can’t copy.
编译器尝试删除副本，如果无法删除副本则调用移动构造函数，如果无法移动则调用复制构造函数，如果无法复制则无法编译。

```c++
#include<iostream>
#include<memory>
std::unique_ptr<int> Func() {
       std::unique_ptr<int> m(new int(10));
       std::cout << "address of m: " << m.get() << std::endl;
       return (m);						//编译器优化
       return std::move(m);            //equal to previous line.
}
int main(int argc, char** argv)
{
       std::unique_ptr<int> m = Func();
       std::cout << "address of m: " << m.get() << std::endl;
       *m = 20;
       std::cout << *m << std::endl;
       return 0;
}
```

### std::move源码

```c++
// FUNCTION TEMPLATE move
template <class _Ty>
_NODISCARD constexpr remove_reference_t<_Ty>&& move(_Ty&& _Arg) noexcept { // forward _Arg as movable
    return static_cast<remove_reference_t<_Ty>&&>(_Arg);
}
// FUNCTION TEMPLATE move_if_noexcept
template <class _Ty>
_NODISCARD constexpr conditional_t<!is_nothrow_move_constructible_v<_Ty> && is_copy_constructible_v<_Ty>, const _Ty&,
    _Ty&&>
    move_if_noexcept(_Ty& _Arg) noexcept { // forward _Arg as movable, sometimes
    return _STD move(_Arg);
}


========std::remove_reference_t
// STRUCT TEMPLATE remove_reference
template <class _Ty>
struct remove_reference {
    using type = _Ty;
};
template <class _Ty>
struct remove_reference<_Ty&> {
    using type = _Ty;
};
template <class _Ty>
struct remove_reference<_Ty&&> {
    using type = _Ty;
};
template <class _Ty>
using remove_reference_t = typename remove_reference<_Ty
>::type;
```


### std::forward源码

```c++
// FUNCTION TEMPLATE forward
template <class _Ty>
_NODISCARD constexpr _Ty&& forward(
    remove_reference_t<_Ty>& _Arg) noexcept { // forward an lvalue as either an lvalue or an rvalue
    return static_cast<_Ty&&>(_Arg);
}
template <class _Ty>
_NODISCARD constexpr _Ty&& forward(remove_reference_t<_Ty>&& _Arg) noexcept { // forward an rvalue as an rvalue
    static_assert(!is_lvalue_reference_v<_Ty>, "bad forward call");
    return static_cast<_Ty&&>(_Arg);
}
```

### 谈谈对引用的思考

引用的本质：

```c++
class A
{
    int &a;
};
class B
{
};
int main()
{

    using std::cout;
    using std::endl;

    cout << sizeof(A)<<sizeof(B);
}
```

引用底层是用const指针实现的，分配额外的内存空间。


-------》
引用的定义反向于指针，用&标识

一个变量由标识符 + 类型 + 内存对象组成。



```bash
对于左值和右值之辩：
    定义是： =左边的值即是左值，实际上所谓左值就是变量（有名字的对象）
    而右值就是值得本身。

    但在面向对象的思考中， 和标识符绑定的是一个对象的reference，而不是对象本身，
    所以左值即是有名字的对象
    而右值就变成了没有名字的地址本身！！！


左值引用
    可以绑定左值
    const左值引用可以绑定右值

右值引用
    可以绑定右值(即地址)

```


## Reference

https://blog.csdn.net/gw569453350game/article/details/47080357

