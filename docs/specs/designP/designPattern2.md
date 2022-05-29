---
title: "设计模式之单例模式"
date: 2020-03-13T15:23:51+08:00
lastmod: 2020-03-13T15:23:51+08:00
description: ""
tags: ["设计模式", "Design Pattern", "xGdl"]
categories: ["设计模式"]
author: "xGdl"
keywords: ["单例模式"]
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


#### 什么事单利模式：

单例 Singleton 是设计模式的一种，其特点是只提供唯一一个类的实例,具有全局变量的特点，在任何位置都可以通过接口获取到那个**唯一实例**;

###### 应用场景：

-	设备管理器，系统中可能有多个设备，但是只有一个设备管理器，用于管理设备驱动;
-	数据池，用来缓存数据的数据结构，需要在一处写，多处读取或者多处写，多处读取;

###### 实现要点：

-	全局只有一个实例：static 特性，同时禁止用户自己声明并定义实例（把构造函数设为 private）
-	线程安全
-	禁止赋值和拷贝
-	用户通过接口获取实例：使用 static 类成员函数

#### 单例模式的实现：
###### 懒汉式实现0 --- 不安全：

```c++

#include <iostream>
// version1:
// with problems below:
// 1. thread is not safe
// 2. memory leak

class Singleton{
private:
    Singleton(){
        std::cout<<"constructor called!"<<std::endl;
    }
    Singleton(Singleton&)=delete;
    Singleton& operator=(const Singleton&)=delete;
    static Singleton* m_instance_ptr;
public:
    ~Singleton(){
        std::cout<<"destructor called!"<<std::endl;
    }
    static Singleton* get_instance(){
        if(m_instance_ptr==nullptr){
              m_instance_ptr = new Singleton;
        }
        return m_instance_ptr;
    }
    void use() const { std::cout << "in use" << std::endl; }
};

Singleton* Singleton::m_instance_ptr = nullptr;

//test.
int main(){
    Singleton* instance = Singleton::get_instance();
    Singleton* instance_2 = Singleton::get_instance();
    return 0;
}
```


###### 懒汉式实现1 --- 安全版本
```c++

#include <iostream>

class Singleton
{
public:
    ~Singleton(){
        std::cout<<"destructor called!"<<std::endl;
    }
    Singleton(const Singleton&)=delete;
    Singleton& operator=(const Singleton&)=delete;
    static Singleton& get_instance(){
        static Singleton instance;
        return instance;

    }
private:
    Singleton(){
        std::cout<<"constructor called!"<<std::endl;
    }
};

int main(int argc, char *argv[])
{
    Singleton& instance_1 = Singleton::get_instance();
    Singleton& instance_2 = Singleton::get_instance();
    return 0;
}


```

> 这种实现依赖于c++11的magic static特性：
> If control enters the declaration concurrently while the variable is being initialized, the concurrent execution shall wait for completion of the initialization.
如果当变量在初始化的时候，并发同时进入声明语句，并发线程将会阻塞等待初始化结束。




###### 线程安全，内存安全实现

```cpp
#include <iostream>
#include <memory> // shared_ptr
#include <mutex>  // mutex

// version 2:
// with problems below fixed:
// 1. thread is safe now
// 2. memory doesn't leak

class Singleton{
public:
    using Ptr = std::shared_ptr<Singleton>;
    ~Singleton(){
        std::cout<<"destructor called!"<<std::endl;
    }
    Singleton(Singleton&)=delete;
    Singleton& operator=(const Singleton&)=delete;
    static Ptr get_instance(){

        // "double checked lock"
        if(m_instance_ptr==nullptr){
            std::lock_guard<std::mutex> lk(m_mutex);
            if(m_instance_ptr == nullptr){
              m_instance_ptr = std::shared_ptr<Singleton>(new Singleton);
            }
        }
        return m_instance_ptr;
    }


private:
    Singleton(){
        std::cout<<"constructor called!"<<std::endl;
    }
    static Ptr m_instance_ptr;
    static std::mutex m_mutex;
};

// initialization static variables out of class
Singleton::Ptr Singleton::m_instance_ptr = nullptr;
std::mutex Singleton::m_mutex;

int main(){
    Singleton::Ptr instance = Singleton::get_instance();
    Singleton::Ptr instance2 = Singleton::get_instance();
    return 0;
}


//ps.
//如果Singleton中存在数据成员，对于数据成员的使用可以采用读写锁实现接口互斥。

```




###### 单例模式的友元模板实现0.1 

```c++

//1. protected
//2. friend
template<class T>
class Singleton {
public:
	Singleton(const Singleton&) = delete;
	Singleton& operator(const Singleton&) = delete;
	virtual ~Singleton() = default;

	static T& get_instance() {
		static T m_instance;	//这里使用了class T的构造函数，说明Singleton<T>有权访问T的构造函数：1.T构造是public; 2.T为Singleton赋予权限，即是用friend.
		return m_instance;
	}

	//DerivedSingle继承Singleton，所以子类DerivedSingle需要访问Singleton的构造函数，所以不能是private，必须protected
protected:
	Singleton() = default;

}


class DerivedSingle : public Singleton<DerivedSingle> {
public:
	DerivedSingle(const DerivedSingle&)  =delete;
	DerivedSingle& operator(const DerivedSingle&) = delete;
	~DerivedSingle() = default;

	//给Singleton类赋予权限.
	friend class Singleton<DerivedSingle>;

private:
	DerivedSingle() = default;
}


int main(int argc, char* argv[]){
    DerivedSingle& instance1 = DerivedSingle::get_instance();
    DerivedSingle& instance2 = DerivedSingle::get_instance();
    return 0;
}

```

> 上面的例子使用了CRTP， 奇异递归模板模式CRTP(Curiously recurring template pattern)



###### 单例模式的非友元模板实现0.1 

```c++

// brief: a singleton base class offering an easy way to create singleton
#include <iostream>

template<typename T>
class Singleton{
public:
    static T& get_instance() noexcept(std::is_nothrow_constructible<T>::value){
        static T instance{token()};
        return instance;
    }
    virtual ~Singleton() =default;
    Singleton(const Singleton&)=delete;
    Singleton& operator =(const Singleton&)=delete;
protected:
    struct token{}; // helper class
    Singleton() noexcept=default;
};


/********************************************/
// Example:
// constructor should be public because protected `token` control the access


class DerivedSingle:public Singleton<DerivedSingle>{
public:
   //使用public权限来满足Singleton对DerivedSingle的构造的访问权限，但是需要依赖于Singleton的局部类，使得DerivedSingle的构造对外不能使用，以此满足DerivedSingle的单例模式的约束。
   DerivedSingle(token){
       std::cout<<"destructor called!"<<std::endl;
   }

   ~DerivedSingle(){
       std::cout<<"constructor called!"<<std::endl;
   }
   DerivedSingle(const DerivedSingle&)=delete;
   DerivedSingle& operator =(const DerivedSingle&)= delete;
};

int main(int argc, char* argv[]){
    DerivedSingle& instance1 = DerivedSingle::get_instance();
    DerivedSingle& instance2 = DerivedSingle::get_instance();
    return 0;
}

```


#### 何时应该使用或者不使用单例？

> You need to have one and only one object of a type in system

>==你需要系统中只有唯一一个实例存在的类的全局变量的时候才使用单例==。