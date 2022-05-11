---
title: "c语言可变参数"
---


>我的源码来自于vs2015.win10。

c语言实现可变参数列表是用的可变参数宏

## tdarg.h

```c
//
// stdarg.h
//
//      Copyright (c) Microsoft Corporation. All rights reserved.
//
// The C Standard Library <stdarg.h> header.
//
#pragma once
#define _INC_STDARG
#include <vcruntime.h>
_CRT_BEGIN_C_HEADER
#define va_start __crt_va_start
#define va_arg   __crt_va_arg
#define va_end   __crt_va_end
#define va_copy(destination, source) ((destination) = (source))
_CRT_END_C_HEADER
```

---可见，可变参数宏的实现和运行时库是相关的.

## vadefs.h

```c
//
// vadefs.h
//
//      Copyright (c) Microsoft Corporation. All rights reserved.
//
// Definitions of macro helpers used by <stdarg.h>.  This is the topmost header
// in the CRT header lattice, and is always the first CRT header to be included,
// explicitly or implicitly.  Therefore, this header also has several definitions
// that are used throughout the CRT.
//
#pragma once
#define _INC_VADEFS
#define _CRT_PACKING 8
#pragma pack(push, _CRT_PACKING)
#ifdef __cplusplus
extern "C" {
#endif
#if !defined _W64
#define _W64
#endif
#ifndef _UINTPTR_T_DEFINED
    #define _UINTPTR_T_DEFINED
    #ifdef _WIN64
        typedef unsigned __int64  uintptr_t;
    #else
        typedef unsigned int uintptr_t;
    #endif
#endif
#ifndef _VA_LIST_DEFINED
    #define _VA_LIST_DEFINED
    #ifdef _M_CEE_PURE
        typedef System::ArgIterator va_list;
    #else
        typedef char* va_list;
    #endif
#endif
#ifdef __cplusplus
    #define _ADDRESSOF(v) (&const_cast<char&>(reinterpret_cast<const volatile char&>(v)))
#else
    #define _ADDRESSOF(v) (&(v))
#endif
#if defined _M_ARM && !defined _M_CEE_PURE
    #define _VA_ALIGN       4
    #define _SLOTSIZEOF(t)  ((sizeof(t) + _VA_ALIGN - 1) & ~(_VA_ALIGN - 1))
    #define _APALIGN(t,ap)  (((va_list)0 - (ap)) & (__alignof(t) - 1))
#elif defined _M_ARM64 && !defined _M_CEE_PURE
    #define _VA_ALIGN       8
    #define _SLOTSIZEOF(t)  ((sizeof(t) + _VA_ALIGN - 1) & ~(_VA_ALIGN - 1))
    #define _APALIGN(t,ap)  (((va_list)0 - (ap)) & (__alignof(t) - 1))
#else
    #define _SLOTSIZEOF(t)  (sizeof(t))
    #define _APALIGN(t,ap)  (__alignof(t))
#endif
#if defined _M_CEE_PURE || (defined _M_CEE && !defined _M_ARM && !defined _M_ARM64)
    void  __cdecl __va_start(va_list*, ...);
    void* __cdecl __va_arg(va_list*, ...);
    void  __cdecl __va_end(va_list*);
    #define __crt_va_start_a(ap, v) ((void)(__va_start(&ap, _ADDRESSOF(v), _SLOTSIZEOF(v),  __alignof(v), _ADDRESSOF(v))))
    #define __crt_va_arg(ap, t)     (*(t *)__va_arg(&ap, _SLOTSIZEOF(t), _APALIGN(t,ap),  (t*)0))
    #define __crt_va_end(ap)        ((void)(__va_end(&ap)))
#elif defined _M_IX86
    #define _INTSIZEOF(n)          ((sizeof(n) + sizeof(int) - 1) & ~(sizeof(int) - 1))
    #define __crt_va_start_a(ap, v) ((void)(ap = (va_list)_ADDRESSOF(v) + _INTSIZEOF(v)))
    #define __crt_va_arg(ap, t)     (*(t*)((ap += _INTSIZEOF(t)) - _INTSIZEOF(t)))
    #define __crt_va_end(ap)        ((void)(ap = (va_list)0))
#elif defined _M_ARM
    #ifdef __cplusplus
        void __cdecl __va_start(va_list*, ...);
        #define __crt_va_start_a(ap, v) ((void)(__va_start(&ap, _ADDRESSOF(v),  _SLOTSIZEOF(v), _ADDRESSOF(v))))
    #else
        #define __crt_va_start_a(ap, v) ((void)(ap = (va_list)_ADDRESSOF(v) +  _SLOTSIZEOF(v)))
    #endif
    #define __crt_va_arg(ap, t) (*(t*)((ap += _SLOTSIZEOF(t) + _APALIGN(t,ap)) -  _SLOTSIZEOF(t)))
    #define __crt_va_end(ap)    ((void)(ap = (va_list)0))
#elif defined _M_ARM64
    void __cdecl __va_start(va_list*, ...);
    #define __crt_va_start_a(ap,v) ((void)(__va_start(&ap, _ADDRESSOF(v), _SLOTSIZEOF(v),  __alignof(v), _ADDRESSOF(v))))
    #define __crt_va_arg(ap, t)                                                 \
        ((sizeof(t) > (2 * sizeof(__int64)))                                   \
            ? **(t**)((ap += sizeof(__int64)) - sizeof(__int64))               \
            : *(t*)((ap += _SLOTSIZEOF(t) + _APALIGN(t,ap)) - _SLOTSIZEOF(t)))
    #define __crt_va_end(ap)       ((void)(ap = (va_list)0))
#elif defined _M_X64
    void __cdecl __va_start(va_list* , ...);
    #define __crt_va_start_a(ap, x) ((void)(__va_start(&ap, x)))
    #define __crt_va_arg(ap, t)                                               \
        ((sizeof(t) > sizeof(__int64) || (sizeof(t) & (sizeof(t) - 1)) != 0) \
            ? **(t**)((ap += sizeof(__int64)) - sizeof(__int64))             \
            :  *(t* )((ap += sizeof(__int64)) - sizeof(__int64)))
    #define __crt_va_end(ap)        ((void)(ap = (va_list)0))
#endif
#ifdef __cplusplus
} // extern "C"
#endif
#if defined __cplusplus && !defined _CRT_NO_VA_START_VALIDATION
    extern "C++"
    {
        template <typename _Ty>
        struct __vcrt_va_list_is_reference
        {
            enum : bool { __the_value = false };
        };
        template <typename _Ty>
        struct __vcrt_va_list_is_reference<_Ty&>
        {
            enum : bool { __the_value = true };
        };
        template <typename _Ty>
        struct __vcrt_va_list_is_reference<_Ty&&>
        {
            enum : bool { __the_value = true };
        };
        template <typename _Ty>
        void __vcrt_va_start_verify_argument_type() throw()
        {
            static_assert(!__vcrt_va_list_is_reference<_Ty>::__the_value, "va_start  argument must not have reference type and must not be parenthesized");
        }
    } // extern "C++"
    #define __crt_va_start(ap, x)  ((void)(__vcrt_va_start_verify_argument_type<decltype(x)>(), __crt_va_start_a(ap, x)))
#else // ^^^ __cplusplus ^^^ // vvv !__cplusplus vvv //
    #define __crt_va_start(ap, x) __crt_va_start_a(ap, x)
#endif
#pragma pack(pop)
```


typedef char* va_list;//转字节地址.

上面的实现看起来也很简单, 利用函数参数的入栈规则, 然后找到第一个参数的地址作为参考，然后根据参数类型依次推倒取出数据.
但是 上面的实现有一个明显的地方(也不能说是缺点，只能说没有尽善尽美.): 函数必须至少有一个参数。

然后来看一看c++的可变参数是如何实现的:

c++的可变形参的声明有三种方式，听起来似乎要任性一些, 然后我们来看一看吧.

1. 返回值类型 函数名(形参列表, ...);
2. 返回值类型 函数名(形参列表...);
3. 返回之类型 函数名(...);			//其实这个主要是用来对上面的两个声明的封装，或者说wrapper。 


然后我来简单分析下printf吧，
搞点事儿？ 让printf不能正确打印.

```c
char arr[5] = "0000";
arr[4] = '0';
printf(arr);
```
arr[] = ""; //是拷贝字符串， 字符串面量是c风格的，然后又'\0'结尾; 所以我得去掉'\0';
然后由于数组作为函数形参，传递的只是数组的手元素的地址，传递的信息并不完整，没有长度，所以可变参数列表对串的解析只能停留在'\0'结尾，即c-string的格式上, so,我去掉arr的'\0', printf就莫得办法正常打印了。