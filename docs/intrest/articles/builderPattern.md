---
title: "建造者模式"
---


## 简介

&emsp;&emsp;建造者（Builder）模式的定义：指将一个复杂对象的构造与它的表示分离，使同样的构建过程可以创建不同的表示，这样的设计模式被称为建造者模式。它是将一个复杂的对象分解为多个简单的对象，然后一步一步构建而成。它将变与不变相分离，即产品的组成部分是不变的，但每一部分是可以灵活选择的。


![](/images/builderPattern.gif)


### 优点

1. 各个具体的建造者相互独立，有利于系统的扩展。
2. 客户端不必知道产品内部组成的细节，便于控制细节风险。

### 缺点

1. 产品的组成部分必须相同，这限制了其使用范围。
2. 如果产品的内部变化复杂，该模式会增加很多的建造者类。



### 角色

- 产品角色（Product）：它是包含多个组成部件的复杂对象，由具体建造者来创建其各个滅部件。
- 抽象建造者（Builder）：它是一个包含创建产品各个子部件的抽象方法的接口，通常还包含一个返回复杂产品的方法 getResult()。
- 具体建造者(Concrete Builder）：实现 Builder 接口，完成复杂产品的各个部件的具体创建方法。
- 指挥者（Director）：它调用建造者对象中的部件构造与装配方法完成复杂对象的创建，在指挥者中不涉及具体产品的信息。


>设计模式我们都会有一个抽象类统一接口，然后一些具体实现类Concrete。 然后就是对行为，状态，过程的抽象，减小耦合，减少逻辑复杂性，增加可维护和可扩展性。

## 栗子


以下给出一个装修房间的栗子。



```c++

//房间，生产毛坯房.

class Room {
public:
	Room() =default;

	void setTV(std::string tv) {
		m_tv = tv;
	}
	void setSofa(std::string sofa) {
		m_sofa = sofa;
	}
	void setWall(std::string wall) {
		m_wall = wall;
	}

private:
	std::string m_tv;
	std::string m_wall;
	std::string m_sofa;
}


class Decorator {
public:
	Decorator(Room*) = default;
	virtual ~Decorator() = default;
	virtual  void buildWall() = 0;
    virtual  void buildTV() = 0;
    virtual  void buildSofa() = 0;
}

//装修团队A
class ConcreteDecoratorA : public Decorator {
public:
	ConcreteDecoratorA(Room* room) {
		m_room = room;
	}
	~Decorator() = default;
	void buildWall() {
		m_room->setWall("wallA");
	}
    void buildTV() {
    	m_room->setTV("tvA");
    }
    void buildSofa() {
    	m_room->setSofa("sofaA");
    }

private:
	Room* m_room;
}

//装修团队B
class ConcreteDecoratorB : public Decorator {
public:
	ConcreteDecoratorB(Room* room) {
		m_room = room;
	}
	~Decorator() = default;
	void buildWall() {
		m_room->setWall("wallB");
	}
    void buildTV() {
    	m_room->setTV("tvB");
    }
    void buildSofa() {
    	m_room->setSofa("sofaB");
    }

private:
	Room* m_room;
}



//指挥者：项目经理, 承包商
class ProjectManager
{

public：
     ProjectManager() : builder(nullptr), room(nullptr) {}

     //招标
     void obtainProject(Room* rm) {
     	room = rm;
     }
     //投标团队
     void dispatch(std::string teamName) {
     	if( teamName == "A" ) {
     		builder = new ConcreteDecoratorA(room);
     	} else if(teamName == "B") {
     		builder = new ConcreteDecoratorB(room);
     	}else {
     		//....other...
     	}

     }
    //产品构建与组装方法
    void decorate()
    {
        builder->buildWall();
        builder->buildTV();
        builder->buildSofa();
    }
private：
	Decorator* builder;
	Room* room;
}

//本例只是一个建造者模式的示例，程序还有许多处理不适当之处。 只是对思路的一种展示。
```

建造者模式其实就是对流程的一种抽象。