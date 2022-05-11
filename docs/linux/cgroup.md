---
title: Control Group
sidebar_position: 6
---


![docker-linux-cg-ns.jpg](/images/docker-linux-cg-ns.jpg)


### 概念

- 任务(task): 在cgroup中，任务就是一个进程。
- 控制组(control group): cgroup的资源控制是以控制组的方式实现，控制组指明了资源的配额限制。进程可以加入到某个控制组，也可以迁移到另一个控制组。
- 层级(hierarchy): 控制组有层级关系，类似树的结构，子节点的控制组继承父控制组的属性(资源配额、限制等)。
- 子系统(subsystem): 一个子系统其实就是一种资源的控制器，比如memory子系统以控制进程内存的使用。子系统需要加入到某个层级，然后该层级的所有控制组，均受到这个子系统的控制。



#### 子系统

- cpu: 限制进程的 cpu 使用率。
- cpuacct 子系统，可以统计 cgroups 中的进程的 cpu 使用报告。
- cpuset: 为cgroups中的进程分配单独的cpu节点或者内存节点。
- memory: 限制进程的memory使用量。
- blkio: 限制进程的块设备io。
- devices: 控制进程能够访问某些设备。
- net_cls: 标记cgroups中进程的网络数据包，然后可以使用tc模块（traffic control）对数据包进行控制。
- net_prio: 限制进程网络流量的优先级。
- huge_tlb: 限制HugeTLB的使用。
- freezer:挂起或者恢复cgroups中的进程。
- ns: 控制cgroups中的进程使用不同的namespace。


> Linux通过文件的方式，将cgroups的功能和配置暴露给用户，这得益于Linux的虚拟文件系统（VFS）。VFS将具体文件系统的细节隐藏起来，给用户态提供一个统一的文件系统API接口，cgroups和VFS之间的链接部分，称之为cgroups文件系统。














## References

- https://www.zhihu.com/topic/20053364/top-answers
- https://zhuanlan.zhihu.com/p/81668069
- https://zhuanlan.zhihu.com/p/434731896
