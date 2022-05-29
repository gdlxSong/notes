---
title: "多线程和锁"
date: 2020-05-22T11:39:13+08:00
lastmod: 2020-05-22T11:39:13+08:00
description: ""
tags: ["Thread", "ThreadLock"]
categories: ["Thread"]
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


## 我对多线程和锁的看法

&emsp;&emsp;多线程可以更加高效的利用机器的cpu，对于各个平台的多线程的实现是有很大的区别的，如like-unix是基于进程来实现线程的，其线程可以说是进程的阉割版（毕竟多进程的盛行早于多线程）。而windows平台的多线程是独立实现的，其历史包袱没有那么重。我们可以轻松的使用_beginthread和CreateThread来在不同的平台创建线程，创建的线程模型也是不同的，对于like-unix平台创建的直接是内核线程，而windows平台使用LWP模型创建的用户级线程也是可能的。值得注意的是我们在进行c++开发的时候其实可以使用c++11的多线程库`<thread>`来进行跨平台的多线程开发，因为like-unix平台由于沉重的历史原因，其平台库是不支持多线程的，如errno，会有很多坑。所以建议直接std::thread。

&emsp;&emsp;多线程在逻辑上是进程空间共享的，我们可以更加方便的进行数据的通信，但同时也引来更加剧烈的数据竞争，为了保证数据的有序和安全的操作，需要对数据上锁。多线程之间存在共享数据和私有数据，多余共享数据我们需要对齐进行加锁访问，来同步线程，进行通信。对于私有数据，各个线程独立执行处理，产生异步逻辑，良好的异步和同步操作可以产生优越的性能和高效率的cpu时间。


## 有哪些同步互斥方式

### Like-Unix同步互斥

**mutex**
```c++
pthread_mutex_t mutex=PTHREAD_MUTEX_INITIALIZER;
int pthread_mutex_init(pthread_mutex_t *mutex, const pthread_mutexattr_t *mutexattr);
int pthread_mutex_destroy(pthread_mutex_t *mutex)
int pthread_mutex_lock(pthread_mutex_t *mutex)
int pthread_mutex_unlock(pthread_mutex_t *mutex)
int pthread_mutex_trylock(pthread_mutex_t *mutex)
```


**rwlock**
```c++
int pthread_rwlock_init(pthread_rwlock_t *restrict rwlock, const pthread_rwlockattr_t *restrict attr);
int pthread_rwlock_destroy(pthread_rwlock_t *rwlock);
int pthread_rwlock_rdlock(pthread_rwlock_t *rwlock);
int pthread_rwlock_wrlock(pthread_rwlock_t *rwlock);
int pthread_rwlock_unlock(pthread_rwlock_t *rwlock);
int pthread_rwlock_tryrdlock(pthread_rwlock_t *rwlock);
int pthread_rwlock_trywrlock(pthread_rwlock_t *rwlock);
```


**conditional_variable**
```c++
pthread_cond_t my_condition=PTHREAD_COND_INITIALIZER;

int pthread_cond_init(pthread_cond_t *cond,pthread_condattr_t *cond_attr);
int pthread_cond_wait(pthread_cond_t *cond,pthread_mutex_t *mutex);
int pthread_cond_timewait(pthread_cond_t *cond,pthread_mutex *mutex,const timespec *abstime);
int pthread_cond_destroy(pthread_cond_t *cond);
int pthread_cond_signal(pthread_cond_t *cond);
int pthread_cond_broadcast(pthread_cond_t *cond);  //解除所有线程的阻塞
```


**semaphore**
```c++
int sem_init(sem_t *sem, int pshared, unsigned int value);
int sem_destroy(sem_t *sem);
int sem_wait(sem_t *sem);
int sem_trywait(sem_t *sem);
int sem_timedwait(sem_t *sem, const struct timespec *abs_timeout);
int sem_post(sem_t *sem);
int sem_getvalue(sem_t *sem, int *sval);
```


**filelock**
```c++
int flock(int fd, int operation);
```

需要注意的是文件锁只能检测文件是否被上锁，而不能去阻止其他进程对文件的锁操作。 

此外，在unix中很多互斥方式不能直接用于进程，但是可以使用期属性结构中的共享属性设置，并使用mmap等方式来进程同步。


### linux-mutex实现进程间的互斥.


[收缩篇幅，栗子请点击](https://blog.csdn.net/dong1528313271/article/details/101158503?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522159013856119726867807537%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fblog.%2522%257D&request_id=159013856119726867807537&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_v2~rank_v25-1-101158503.nonecase&utm_term=mutex)


### Windows同步互斥

**Event**
```c++
HANDLE CreateEvent(
  LPSECURITY_ATTRIBUTES
  lpEventAttributes,
  BOOL bManualReset,
  BOOL InitialState,
  LPTSTR lpName
);

HANDLE OpenEvent(
  DWORD dwDesiredAccess,
  BOOL bInheritHandle,
  LPCTSTR lpName
);

BOOL PulseEvent(
  HANDLE hEvent
);

BOOL SetEvent(
  HANDLE hEvent
);

BOOL ResetEvent(
  HANDLE hEvent
);


```


**Mutex**
```c++
HANDLE CreateMutex(
  LPSECURITY_ATTRIBUTES lpMutexAttributes,
  BOOL bInitialOwner,
  LPCTSTR lpName
);

BOOL ReleaseMutex(
  HANDLE hMutex
);


```

**Semaphore**
```c++
HANDLE CreateSemaphore(
  LPSECURITY_ATTRIBUTES lpSemaphoreAttributes,
  LONG lInitialCount,
  LONG lMaximumCount,
  LPCTSTR lpName
);

BOOL ReleaseSemaphore(
  HANDLE hSemaphore,
  LONG lReleaseCount,
  LPLONG lpPreviousCount
);
```


**CriticalSection**
```c++
void InitializeCriticalSection(
  LPCRITICAL_SECTION lpCriticalSection
);
void EnterCriticalSection(
  LPCRITICAL_SECTION lpCriticalSection
);

BOOL TryEnterCriticalSection(
  LPCRITICAL_SECTION lpCriticalSection
);

void  LeaveCriticalSection(
  LPCRITICAL_SECTION lpCriticalSection
);
void DeleteCriticalSection(
  LPCRITICAL_SECTION lpCriticalSection
);
```



**Handle操作**
```c++
DWORD WaitForMultipleObjects(
  DWORD nCount,
  CONST HANDLE* lpHandles,
  BOOL fWaitAll,
  DWORD dwMilliseconds
);

DWORD WaitForSingleObject(
  HANDLE hHandle,
  DWORD dwMilliseconds
);

BOOL DuplicateHandle(
  HANDLE hSourceProcessHandle,
  HANDLE hSourceHandle,
  HANDLE hTargetProcessHandle,
  LPHANDLE lpTargetHandle,
  DWORD dwDesiredAccess,
  BOOL bInheritHandle,
  DWORD dwOptions
);
```

**DuplicateHandle函数解析**

内核对象的句柄会在新进程中，产生一条记录，并且该内核对象计数增加。

1. DuplicateHandle获得一个进程句柄表中的一个记录项，然后在另一个进程的句柄表中创建这个记录项的一个副本。
2. DuplicateHandle 中dwOptions参数可以指定DUPLICATE_SAME_ACCESS和DUPLICATE_CLOSE_SOURCE标志。如果指定DUPLICATE_SAME_ACCESS标志将希望目标句柄拥有与源进程的句柄一样的访问掩码。如果指定DUPLICATE_CLOSE_SOURCE标志，会关闭源进程的句柄。使用这个标志，内核对象计数不会受到影响。
3. DuplicateHandle 函数与继承一样，目标进程并不知道它现在能访问一个新的内核对象，所以源进程以某种方式通知目标进程。与继承不一样的是，源进程不能使用命令行参数或更改目标进程的环境变量。
4. 可以利用DuplicateHandle修改内核对象的访问权限
5. 绝对不能使用CloseHandle函数关闭通过phTargetHandle参数返回的句柄。


**InterLock**
```c++
LONG InterlockedCompareExchange(
  LPLONG Destination,
  LONG Exchange,
  LONG Comperand
);

PVOID InterlockedCompareExchangePointer(
  PVOID* Destination,
  PVOID ExChange,
  PVOID Comperand
);

LONG InterlockedDecrement(
  LPLONG lpAddend
);

LONG InterlockedExchange(
  LPLONG Target,
  LONG Value
);

LONG InterlockedExchangeAdd(
  LPLONG Addend,
  LONG Increment
);

PVOID InterlockedExchangePointer(
  PVOID* Target,
  PVOID Value
);

LONG InterlockedIncrement(
  LPLONG lpAddend
);

LONG WINAPI InterlockedTestExchange(
  LPLONG Target,
  LONG OldValue,
  LONG NewValue
);
```


注意：原子操作（InterLocked...）和临界区是属于用户态的操作，Event，Mutex，Semaphore是属于内核态的操作。



### 标准库的同步方式

```c++

std::mutex

std::condition_variable

std::condition_variable_any

std::promise

std::future

std::counting_semaphore
  
std::barrier
....
```


注意在使用同步互斥的的锁的时候我们应该尽量地控制锁的使用粒度，并且在可以使用无锁编程是更好的。关于atomic请查看其它文章。