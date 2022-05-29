---
title: "Vue 的 for 循环"
date: 2020-06-29T18:58:05+08:00
lastmod: 2020-06-29T18:58:05+08:00
description: ""
tags: ["vue"]
categories: ["vue"]
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


## vue的v-for来实现循环

&emsp;&emsp;vue的v-for指令可以迭代整数，对象和数组。

### v-for迭代整数

```html
<div id="app">
  <ul>
    <li v-for="n in 10">
     {{ n }}
    </li>
  </ul>
</div>
```

不过这里只可以迭代产生步长为1的range。


### v-for迭代对象

**Syntax:**

	(value, key, index) in object

这里key和index是可选的。

#### 迭代value值

```html
<div id="app">
  <ul>
    <li v-for="value in object">
    {{ value }}
    </li>
  </ul>
</div>
 
<script>
new Vue({
  el: '#app',
  data: {
    object: {
      name: '菜鸟教程',
      url: 'http://www.runoob.com',
      slogan: '学的不仅是技术，更是梦想！'
    }
  }
})
</script>
```


#### 迭代(value, key) 键值对

```html
<div id="app">
  <ul>
    <li v-for="(value, key) in object">
    {{ key }} : {{ value }}
    </li>
  </ul>
</div>
```

#### 迭代(value, key, index)三元组

```html
<div id="app">
  <ul>
    <li v-for="(value, key, index) in object">
     {{ index }}. {{ key }} : {{ value }}
    </li>
  </ul>
</div>
```

### v-for迭代数组


**Syntax:**

	(element, index) in array

	index是可选的


```html
<div id="app">
  <ol>
    <li v-for="(element, index) in array">
      {{ element.name }}
    </li>
  </ol>
</div>
 
<script>
new Vue({
  el: '#app',
  data: {
    array: [
      { name: 'Runoob' },
      { name: 'Google' },
      { name: 'Taobao' }
    ]
  }
})
</script>
```

