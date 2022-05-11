---
title: "javascript 的作用域"
date: 2020-06-21T20:18:37+08:00
lastmod: 2020-06-21T20:18:37+08:00
description: ""
tags: ["js"]
categories: ["js"]
author: "xGdl"
keywords: ["javascript"]
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

javascript是以引用传递为主的语言，和rust一样，所以有时对对象的引用上就会出问题。


## js作用域

在ES6之前，javascript只有两种作用域：全局作用域，函数作用域。 这样在其他语言的开发者眼中块作用域中应该“死掉”对象就会尸变，让我们有了“撞鬼”的感觉。

如在es6之前，块作用域中的变量会被提升，成为函数作用域或者全局作用域的变量。

```javascript
//设置每一个提交记录按钮的回调函数
var traceSubmits = document.getElementsByClassName("Message_Add_Content");
for(var i = 0; i<traceSubmits.length; i++) {
    //遍历每一个按钮.
    var button = traceSubmits[i].getElementsByTagName("button")[0];
    var textareaObj = traceSubmits[i].getElementsByTagName("textarea")[0];
    button.flag = "none";//value = {display | none}
    button.textAreaObject = textareaObj;
    traceSubmits[i].removeChild(textareaObj);
    console.log("执行了traceSubmits[i].removeChild(traceSubmits[i].firstChild);, i=", i);
    //设置按钮的回调函数.
    button.onclick = function() {
        if("none" == button.flag) {
            //insert textAreaObject before button.
            button.parentNode.insertBefore(button.textAreaObject, button);
            button.flag = "display";
            button.textContent = "提交记录";
        } else if("display" == button.flag) {
            //insert textAreaObject before button.
            button.parentNode.removeChild(button.textAreaObject);
            button.flag = "none";
            button.textContent = "增加记录";
        } else {}
    }
}
```

在上面的代码中，button和textareaObj两个变量都会被提升到上一层作用域，即相当于：

```javascript
//设置每一个提交记录按钮的回调函数
var traceSubmits = document.getElementsByClassName("Message_Add_Content");
var button = traceSubmits[0].getElementsByTagName("button")[0];			
var textareaObj = traceSubmits[0].getElementsByTagName("textarea")[0];
for(var i = 0; i<traceSubmits.length; i++) {
    //遍历每一个按钮.
    button = traceSubmits[i].getElementsByTagName("button")[0];			
	textareaObj = traceSubmits[i].getElementsByTagName("textarea")[0];
    button.flag = "none";//value = {display | none}
    button.textAreaObject = textareaObj;
    traceSubmits[i].removeChild(textareaObj);
    console.log("执行了traceSubmits[i].removeChild(traceSubmits[i].firstChild);, i=", i);
    //设置按钮的回调函数.
    button.onclick = function() {
        if("none" == button.flag) {
            //insert textAreaObject before button.
            button.parentNode.insertBefore(button.textAreaObject, button);
            button.flag = "display";
            button.textContent = "提交记录";
        } else if("display" == button.flag) {
            //insert textAreaObject before button.
            button.parentNode.removeChild(button.textAreaObject);
            button.flag = "none";
            button.textContent = "增加记录";
        } else {}
    }
}
```


这样乍一看是莫得问题的，但是仔细看，每一个button.onclick中捕获的button是一个，并且是最后一个button。完了~


### 使用this纠正

&emsp;&emsp;对象属性引用自身是一种不好的现象，循环引用可能导致对象无法释放（在c++11），当然引用this也是一样，不过我猜带有gc的语言，其this应该实现了类似c++11中weak_ptr的类似的东西吧。（不然玩个锤子）

```javascript
//设置每一个提交记录按钮的回调函数
var traceSubmits = document.getElementsByClassName("Message_Add_Content");
for(var i = 0; i<traceSubmits.length; i++) {
    //遍历每一个按钮.
    var test = function(){
        console.log("看这个test变量赋值这句会执行几次。");
        return 10;
    }();
    var button = traceSubmits[i].getElementsByTagName("button")[0];
    var textareaObj = traceSubmits[i].getElementsByTagName("textarea")[0];
    button.flag = "none";//value = {display | none}
    button.textAreaObject = textareaObj;
    traceSubmits[i].removeChild(textareaObj);
    console.log("执行了traceSubmits[i].removeChild(traceSubmits[i].firstChild);, i=", i);
    //设置按钮的回调函数.
    button.onclick = function() {
        if("none" == this.flag) {
            //insert textAreaObject before button.
            this.parentNode.insertBefore(this.textAreaObject, this);
            this.flag = "display";
            this.textContent = "提交记录";
        } else if("display" == this.flag) {
            //insert textAreaObject before button.
            this.parentNode.removeChild(this.textAreaObject);
            this.flag = "none";
            this.textContent = "增加记录";
        } else {}
    }
}
```

button.onclick = function() {里面this代替button。


### 使用let纠正


```javascript
//设置每一个提交记录按钮的回调函数
var traceSubmits = document.getElementsByClassName("Message_Add_Content");
for(var i = 0; i<traceSubmits.length; i++) {
    //遍历每一个按钮.
    let button = traceSubmits[i].getElementsByTagName("button")[0];
    var textareaObj = traceSubmits[i].getElementsByTagName("textarea")[0];
    button.flag = "none";//value = {display | none}
    button.textAreaObject = textareaObj;
    traceSubmits[i].removeChild(textareaObj);
    console.log("执行了traceSubmits[i].removeChild(traceSubmits[i].firstChild);, i=", i);
    //设置按钮的回调函数.
    button.onclick = function() {
        if("none" == button.flag) {
            //insert textAreaObject before button.
            button.parentNode.insertBefore(button.textAreaObject, button);
            button.flag = "display";
            button.textContent = "提交记录";
        } else if("display" == button.flag) {
            //insert textAreaObject before button.
            button.parentNode.removeChild(button.textAreaObject);
            button.flag = "none";
            button.textContent = "增加记录";
        } else {}
    }
}
```

let button = traceSubmits[i].getElementsByTagName("button")[0];一个let轻松搞定。

let的作用在于，它组织了块作用域中button的作用域的提升，使得每一次迭代都会产生一个新的button变量。



## 注意

1. let是ES6之后的关键字（const也有相同的功能）
2. 我们在写闭包的时候，很多时候都会携带私货（捕获外部变量），在这个时候我们一定要考虑其变量的生存期和引用关系。