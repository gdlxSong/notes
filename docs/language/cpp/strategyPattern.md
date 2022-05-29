---
title: "策略模式"
date: 2020-04-26T16:23:28+08:00
lastmod: 2020-04-26T16:23:28+08:00
description: ""
tags: ["设计模式", "策略模式"]
categories: ["设计模式"]
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

## 简介


![](/images/strategyPattern.jpg)


>定义一系列的算法,把每一个算法封装起来, 并且使它们可相互替换。并统一到同一个外部接口。


### 组成

1. 环境类(Context):用来操作策略的上下文环境，也就是我们游客。
2. 抽象策略类(Strategy):策略的抽象，出行方式的抽象
3. 具体策略类(ConcreteStrategy):具体的策略实现，每一种出行方式的具体实现。



## 栗子

```c++


class IOperator {
public:
	virtual int execute(int x, int y) = 0;
}

class OperatorAdd : public IOperator {
	int execute(int x, int y) override {
		return x+y;
	}
}

class OperatorSubstract : public IOperator {
	int execute(int x, int y) override {
		return x-y;
	}
}

class OperatorMultiply : public IOperator {
	int execute(int x, int y) override {
		return x+y;
	}
}


class Context {
public:
	Context(IOperator* opObj) {
		m_opObj = opObj;
	}
	int execute(int x, int y) {
		return m_opObj->execute(x,y);
	}

private:
	IOperator* m_opObj;
}
```

上面是一个栗子，没有实际意义，并且execute的异常都没有处理。


如果我现在需要设计一个类似eval的表达式计算类，适当修改Context。

```c++
class Context {
public:
	Context(IOperator* opObj) {
		m_opObj = opObj;
	}
	Context(std::string op);//根据op来构造Operator对象

	int execute(int x, int y) {
		return m_opObj->execute(x,y);
	}

private:
	IOperator* m_opObj;
}



class Parse {

public:
	Parse() = default; //当然也可以对Parse进行配置。

	void parse(std::string express); //将表达式解析成运算符和参数， "12+5" --parse--> x=12,y=15,op="+""

	int execute() {
		//construct a new Context.
		std::shared_ptr<Context> ctx(op);
		return ctx->execute(x,y);
	}

private:

	int x,y;
	std::string op;
}


```
&emsp;&emsp;Context(std::string op);可以通过结合IOC（控制反转来创建Operactor对象，较小耦合）。

&emsp;&emsp;当然对于异常的处理，分成两部分，一部分是Parse的，另一部分Operator产生的异常最后限制在Context内部，这是类似闭包处理异常的一贯做法。




## 优点

策略模式遵循开闭原则，实现代码的解耦合。扩展新的方法时也比较方便，只需要继承策略接口就好了

比如在ssl协议加密套件的协商，就可以使用策略模式来实现。