---
title: "c++lambda表达式"
---

## Syntax：

[capture] (paramters) opt -> ret { body; };

```bash
capture: 捕获列表
            []: 不捕获任何变量
            [=]: 按值捕获所有外部变量，并生成副本，形成闭包(Closure)
            [&]:按引用捕获所有外部变量
            [=,&foo]:按值捕获所有外部变量，按引用捕获foo
            [bar]:按值捕获bar，并不捕获其他变量
            [this]:捕获当前类中的this指针
opt: 函数选项
                        const    
                        mutable
ret: 函数返回值类型
body: 函数体
```

如果lambda没有参数可以省略()， 如果body简单可以省略返回值

```c++
//sample example.
    []{return false;};

complex example.
    [=](decltype(*v.begin()) e) ->bool {return 5 < e && 10 >= e; };
```

&emsp;&emsp;lambda表达式可以说是定义仿函数闭包(Closure)的语法糖, 他捕获列表捕获住的任何外部变量都会成为闭包类型的成员变量。
一个使用了成员变量的类的operator()， 如果能直接转变成一个普通的函数指针，那么lambda表达式本身的this指针就会丢失掉了， 而没有捕获任何外部变量的lambda就不存在这个问题。

```c++
    using Ptr = void(*)(int*);
    Ptr p = [](){delete p;};
    Ptr pp = [&](){delete pp;}    //error.
```

按照c++标准，lambda表达式的operator()默认是const实现，所以自然就解释了为什么按值捕获无法修改外部变量。而加上mutable就可以。

```c++
auto v = {20, 30, 40, 50, 8, 6};
auto f = std::bind(std::logical_and<bool>(), std::bind(std::greater<int>(), std::placeholders::_1, 5), std::bind(std::less_equal<int>(), std::placeholders::_1 ,10));
std::cout << "count of: " << std::count_if(v.begin(), v.end(), f);
std::cout << "count of: " << std::count_if(v.begin(), v.end(), [=](decltype(*v.begin()) e) ->bool {return 5 < e && 10 >= e; });
```



## 线程池部分实现

```c++
pool.emplace_back(
  [this]
  { // 工作线程函数
         std::cout << "thread run." << std::endl;
         while (!this->stoped)
         {
                std::function<void()> task;
                {   // 获取一个待执行的 task
                       std::unique_lock<std::mutex> lock{ this->m_lock };// unique_lock 相比 lock_guard 的好处是：可以随时 unlock() 和 lock()
                       this->cv_task.wait(lock,
                              [this] {
                                     return this->stoped.load() || !this->tasks.empty();
                              }
                       ); // wait 直到有 task
                       if (this->stoped && this->tasks.empty())
                              return;
                       task = std::move(this->tasks.front()); // 取一个 task
                       this->tasks.pop();
                }
                idlThrNum--;
                task();
                idlThrNum++;
         }
         std::cout << "thread exit" << std::endl;
  }
  );
```