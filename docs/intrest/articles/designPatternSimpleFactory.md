---
title: "设计模式之工厂模型"
date: 2020-03-16T13:17:11+08:00
lastmod: 2020-03-16T13:17:11+08:00
description: ""
tags: []
categories: []
author: "codecat"
comment: true
toc: true
autoCollapseToc: true
postMetaInFooter: false
hiddenFromHomePage: false
contentCopyright: true
---




> Saying and doing are two different things.



## 简单工厂模型


![简单工厂模型](/images/simpleFactory_pic0.png)

> 何谓工厂？可以生产产品，产品可以枚举。

```c++
#include<iostream>


class AbstructProduct {
    public:
    virtual~AbstructProduct() {};
    virtual void show() = 0;
};


class ConcreteProductA : public AbstructProduct {
    public:
    void show() override {
        std::cout<< "show product A." <<std::endl;
    }
};

class ConcreteProductB : public AbstructProduct {
    public:
    void show() override {
        std::cout<< "show product B." <<std::endl;
    }
};



class SimpleFactory {
    public:
    ConcreteProductA createProductA() {
        return ConcreteProductA{};
    }
    ConcreteProductB createProductB() {
        return ConcreteProductB{};
    }
};


int main() {

    //client.
    //create a factory.
    auto factory = SimpleFactory{};
    ConcreteProductA a = factory.createProductA();
    ConcreteProductB b = factory.createProductB();

    a.show();
    b.show();

    return 0;
}

```

既然有抽象，那不多态一下对不起抽这一象。
```c++


#include<iostream>


class AbstructProduct {
    public:
    virtual~AbstructProduct() {};
    virtual void show() const = 0;
};


class ConcreteProductA : public AbstructProduct {
    public:
    void show() const override {
        std::cout<< "show product A." <<std::endl;
    }
};

class ConcreteProductB : public AbstructProduct {
    public:
    void show() const override {
        std::cout<< "show product B." <<std::endl;
    }
};



class SimpleFactory {
    public:
    ConcreteProductA createProductA() {
        return ConcreteProductA{};
    }
    ConcreteProductB createProductB() {
        return ConcreteProductB{};
    }
};


int main() {

    //client.
    //create a factory.
    auto factory = SimpleFactory{};
    const AbstructProduct& a = factory.createProductA();
    AbstructProduct&& b = factory.createProductB();

    a.show();
    b.show();

    return 0;
}

```

既然多态可以同意工厂的返回类型，那么我们就可以对上面的工厂做进一步的抽象。

```c++
#include<iostream>
#include<memory>

class AbstructProduct {
    public:
    virtual~AbstructProduct() {};
    virtual void show() const = 0;
};


class ConcreteProductA : public AbstructProduct {
    public:
    void show() const override {
        std::cout<< "show product A." <<std::endl;
    }
};

class ConcreteProductB : public AbstructProduct {
    public:
    void show() const override {
        std::cout<< "show product B." <<std::endl;
    }
};



class SimpleFactory {
    public:
    //enum product type: "productA", "productB"
    std::shared_ptr<AbstructProduct> createProduct(std::string productType) {
        if("productA" == productType) {
            return std::shared_ptr<ConcreteProductA>(new ConcreteProductA());
        } else if("productB" == productType) {
            return std::shared_ptr<ConcreteProductB>(new ConcreteProductB());
        } else {
            //当然还可以有产品c
            return std::shared_ptr<AbstructProduct>(nullptr);
            //返回值其实可以使用std::optional
        }
    }
};


int main() {

    //client.
    //create a factory.
    auto factory = SimpleFactory{};
    auto a = factory.createProduct("productA");
    auto b = factory.createProduct("productB");

    a->show();
    b->show();

    return 0;
}
```

我们可以再深入一点，如果上面的工厂要新增产品C呢？那么我们就需要创建class ConcreteProductC继承AbstructProduct， 然后再在SimpleFactory的createProduct方法扩展"productC", 这样做是没有错的，但是确实挺麻烦的。 可以怎么解决呢，我抬头望天，掐指一算，可以使用ioc控制反转来实现产品的扩展。这玩意儿在java里很普遍，当然咱c++也是可以安排的：https://github.com/gdlxSong/GdlLib/tree/master/gdltool/IocContainer， 工厂模式有自己的想法(用途（ioc对它矫枉过正）)， 我就不去实现了。



## 抽象工厂模式

![抽象工厂模式](/images/abstructFactory.png)


> 何谓抽象，抽取共性，减少冗余。

```c++

#include <iostream>
#include <memory>

//phone
class IPhone {
    public:
    virtual ~IPhone() {};
    virtual void call() = 0;
    virtual void show() = 0;
};


class ApplePhone : public IPhone {
    public:
    void call() override {
        std::cout<<"apple call."<<std::endl;
    }
    void show() override {
        std::cout<<"apple show."<<std::endl;
    }
};


class HuaWeiPhone : public IPhone {
    public:
    void call() override {
        std::cout<<"huawei call."<<std::endl;
    }
    void show() override {
        std::cout<<"huawei show."<<std::endl;
    }
};

//pc
class IComputer {
    public:
    virtual void show() = 0;
    virtual void play() = 0;
    virtual ~IComputer() {};
};

class XiaoMiCompurter : public IComputer {
    public:
    void show() override {
        std::cout<<"xiaomi show."<<std::endl;
    }
    void play() override {
        std::cout<<"xiaomi play."<<std::endl;
    }
};


class MacCompurter : public IComputer {
    public:
    void show() override {
        std::cout<<"Mac show."<<std::endl;
    }
    void play() override {
        std::cout<<"Mac play."<<std::endl;
    }
};


class AbstructFactory {
    public:
    virtual std::shared_ptr<IPhone> createPhone() = 0;
    virtual std::shared_ptr<IComputer> createComputer() = 0;
    virtual ~AbstructFactory() {};
};


class ConcreteFactory1 : public AbstructFactory {
    public:
    std::shared_ptr<IPhone> createPhone() override {
        return std::shared_ptr<IPhone>(new ApplePhone());
    }
    std::shared_ptr<IComputer> createComputer() override {
        return std::shared_ptr<IComputer>(new MacCompurter());
    }
};


class ConcreteFactory2 : public AbstructFactory {
    public:
    std::shared_ptr<IPhone> createPhone() override {
        return std::shared_ptr<IPhone>(new HuaWeiPhone());
    }
    std::shared_ptr<IComputer> createComputer() override {
        return std::shared_ptr<IComputer>(new XiaoMiCompurter());
    }
};









int main() {
    
    //create factory.
    auto factory1 = ConcreteFactory1();
    auto phone1 = factory1.createPhone();
    auto computer1 = factory1.createComputer();
    
    //execute.
    phone1->call();
    phone1->show();
    
    computer1->show();
    computer1->play();
    
    
    auto factory2 = ConcreteFactory2();
    auto phone2 = factory2.createPhone();
    auto computer2 = factory2.createComputer();
    
    //execute.
    phone2->call();
    phone2->show();
    
    computer2->show();
    computer2->play();
    
    
    
    return 0;
}



```


## 应用场景

不管是简单工厂模式，工厂方法模式还是抽象工厂模式，他们具有类似的特性，所以他们的适用场景也是类似的。

首先，作为一种创建类模式，在任何需要生成复杂对象的地方，都可以使用工厂方法模式。有一点需要注意的地方就是复杂对象适合使用工厂模式，而简单对象，特别是只需要通过new就可以完成创建的对象，无需使用工厂模式。如果使用工厂模式，就需要引入一个工厂类，会增加系统的复杂度。

其次，工厂模式是一种典型的解耦模式，迪米特法则在工厂模式中表现的尤为明显。假如调用者自己组装产品需要增加依赖关系时，可以考虑使用工厂模式。将会大大降低对象之间的耦合度。

再次，由于工厂模式是依靠抽象架构的，它把实例化产品的任务交由实现类完成，扩展性比较好。也就是说，当需要系统有比较好的扩展性时，可以考虑工厂模式，不同的产品用不同的实现工厂来组装。