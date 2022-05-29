---
title: "Explicit instantiation definitions ignore member access specifiers"
---



>原文地址：https://www.zhihu.com/question/37692782/answer/1212413278


## 源码

```cpp
#include <type_traits>
#include <iostream>

namespace dirty_hacks
{

template <class T>
using remove_cvref_t = typename std::remove_cv_t<std::remove_reference_t<T>>;

}

/** Yet another concat implementation. */
#define YA_CAT_IMPL(x, y) x##y
/** Yet another concat. */
#define YA_CAT(x, y) YA_CAT_IMPL(x, y)
/**
 * Init private class member hijacker.
 * @param class_ Class name.
 * @param member Private member to hijack.
 * @param __VA_ARGS__ Member type.
 */
#define HIJACKER(class_, member, ...) \
    namespace dirty_hacks { namespace hijack { \
    template <class> struct tag_##member; \
    inline auto get(tag_##member<class_>) -> __VA_ARGS__ class_::*; \
    template <> struct tag_##member<class_> { \
        tag_##member() {} \
        template <class T, class = std::enable_if_t<std::is_base_of<class_, T>::value>> \
        tag_##member(tag_##member<T>) {} \
    }; \
    template <__VA_ARGS__ class_::* Ptr> struct YA_CAT(hijack_##member##_, __LINE__) { \
        friend auto get(tag_##member<class_>) -> __VA_ARGS__ class_::* { return Ptr; } \
    }; \
    template struct YA_CAT(hijack_##member##_, __LINE__)<&class_::member>; \
    }}
/**
 * Hijack private class member.
 * @param ptr Pointer to class instance.
 * @param member Private member to hijack.
 */
#define HIJACK(ptr, member) \
    ((ptr)->*dirty_hacks::hijack::get( \
        dirty_hacks::hijack::tag_##member<dirty_hacks::remove_cvref_t<std::remove_pointer_t<decltype(ptr)>>>() \
    ))

class test
{
    int x_ = 0;

public:
    int x() { return x_; }
}; // class test

HIJACKER(test, x_, int);

int main()
{
    test t;
    std::cout << t.x() << "\n";
    HIJACK(&t, x_) = 233;
    std::cout << t.x() << std::endl;
    return 0;
}
```

## 编译

```bash
g++ -std=c++17 -O2 -Wall -pedantic main.cpp && ./a.out
```


## 输出

```bash
0
233
```


## 预编译

```cpp



//....各个库的编译预编译结果....

//......


//# 3 ".\\test_serials.cpp" 2


//# 4 ".\\test_serials.cpp"
namespace dirty_hacks
{

template <class T>
using remove_cvref_t = typename std::remove_cv_t<std::remove_reference_t<T>>;

}
//# 46 ".\\test_serials.cpp"
class test
{
    int x_ = 0;

public:
    int x() { return x_; }
};

namespace dirty_hacks {
   namespace hijack { 
     template <class> struct tag_x_; 
     inline auto get(tag_x_<test>) -> int test::*; 
     template <> struct tag_x_<test> { 
       tag_x_() {} 
       template <class T, class = std::enable_if_t<std::is_base_of<test, T>::value>> tag_x_(tag_x_<T>) {} }; 
       template <int test::* Ptr> struct hijack_x__54 { 
         friend auto get(tag_x_<test>) -> int test::* { 
           return Ptr; 
           } 
        }; 
        template struct hijack_x__54<&test::x_>; 
      }
    };

int main()
{
    test t;
    std::cout << t.x() << "\n";
    ((&t)->*dirty_hacks::hijack::get( dirty_hacks::hijack::tag_x_<dirty_hacks::remove_cvref_t<std::remove_pointer_t<decltype(&t)>>>() )) = 233;
    std::cout << t.x() << std::endl;
    return 0;
}

```

## 原理

&emsp;&emsp;Explicit instantiation definitions ignore member access specifiers: parameter types and return types may be private.

>c++20貌似是删除这一特性（毕竟如果实现反射了，自然就没必要了）.