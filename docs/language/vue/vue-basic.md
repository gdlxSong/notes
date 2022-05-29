---
title: "Vue语法基础"
date: 2020-06-24T10:21:02+08:00
lastmod: 2020-06-24T10:21:02+08:00
description: ""
tags: ["web", "vue"]
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



## 由头

&emsp;&emsp;在往常，我都是使用原生js来进行数据的绑定，而原生来支持data-dom的映射有两种：使用正则或string.operator来直接进行文本替换，然后将string转换成dom对象；另外还可以先将string转化为dom对象再用getElement\*\*\*等函数对数据进行操作。然而vue就提供了类似的功能，可以很好的支持数据和dom分离，且绑定。就不去自己造轮子了。


## vue是什么

[what's vue?](https://cn.vuejs.org/v2/guide/)


## vue做了什么？

----> request data ---> Vue Object ----> DOM Object -----> render html

vue对象是一个关联器，关联DOM对象和页面数据，实现界面布局和数据的分离。

## Vue的cdn

Staticfile CDN（国内） : https://cdn.staticfile.org/vue/2.2.2/vue.min.js

unpkg：https://unpkg.com/vue/dist/vue.js

cdnjs : https://cdnjs.cloudflare.com/ajax/libs/vue/2.1.8/vue.min.js





## vue的数据属性和实例属性

### 数据属性

数据属性书用户自定义的。

```html
<div id="vue_det">
    <h1>site : {{site}}</h1>
    <h1>url : {{url}}</h1>
    <h1>Alexa : {{alexa}}</h1>
</div>
<script type="text/javascript">
// 我们的数据对象
var data = { site: "菜鸟教程", url: "www.runoob.com", alexa: 10000}
var vm = new Vue({
    el: '#vue_det',
    data: data
})
// 它们引用相同的对象！
document.write(vm.site === data.site) // true
document.write("<br>")
// 设置属性也会影响到原始数据
vm.site = "Runoob"
document.write(data.site + "<br>") // Runoob
 
// ……反之亦然
data.alexa = 1234
document.write(vm.alexa) // 1234
</script>
```

### 实例属性

对实例属性的引用使用$来区分用户定义的属性。

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Vue 测试实例 - 菜鸟教程(runoob.com)</title>
	<script src="https://cdn.staticfile.org/vue/2.4.2/vue.min.js"></script>
</head>
<body>
	<div id="vue_det">
		<h1>site : {{site}}</h1>
		<h1>url : {{url}}</h1>
		<h1>Alexa : {{alexa}}</h1>		
		<h1>data : {{data}}</h1>

	</div>
	<script type="text/javascript">
	// 我们的数据对象
	var data = { site: "菜鸟教程", url: "www.runoob.com", alexa: 10000, data:123}
	var vm = new Vue({
		el: '#vue_det',
		data: data
	})
	document.write(vm.data);
	document.write('<br/>');
	document.write(vm.$data.data);

	</script>
</body>
</html>
```


## vue 基本模板语法

### 文本

使用{{}}来绑定文本。

```html
<div id="app">
  <p>{{ message }}</p>
</div>
```

### html输出绑定：v-html

```html
<div id="app">
    <div v-html="message"></div>
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    message: '<h1>菜鸟教程</h1>'
  }
})
</script>
```

### 标签属性绑定：v-bind

```html
<div id="app">
  <label for="r1">修改颜色</label><input type="checkbox" v-model="use" id="r1">
  <br><br>
  <div v-bind:class="{'class1': use}">
    v-bind:class 指令
  </div>
</div>
    
<script>
new Vue({
    el: '#app',
  data:{
      use: false
  }
});
</script>
```


```html
<div id="app">
    <pre><a v-bind:href="url">菜鸟教程</a></pre>
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    url: 'http://www.runoob.com'
  }
})
</script>
```

属性绑定可以说相当有用了。

### 用户输入绑定：v-model

v-model绑定数据是双向的，支持input、select、textarea、checkbox、radio 等表单控件元素。

```html
<div id="app">
    <p>{{ message }}</p>
    <input v-model="message">
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    message: 'Runoob!'
  }
})
</script>
```


### 监听事件绑定：v-on

```html
<div id="app">
    <p>{{ message }}</p>
    <button v-on:click="reverseMessage">反转字符串</button>
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    message: 'Runoob!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})
</script>
```

### 条件判断绑定：v-if，v-else, v-else-if, v-show

```html
<div id="app">
    <p v-if="seen">现在你看到我了</p>
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    seen: true
  }
})
```

##### 条件三联

```html
<div id="app">
    <div v-if="type === 'A'">
      A
    </div>
    <div v-else-if="type === 'B'">
      B
    </div>
    <div v-else-if="type === 'C'">
      C
    </div>
    <div v-else>
      Not A/B/C
    </div>
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    type: 'C'
  }
})
</script>
```
！需要注意的是同一层if-else必须在同一层，和其他语言条件判断语法一直。


##### v-show

```html
<h1 v-show="ok">Hello!</h1>
```


### 过滤器

#### 使用

```html
<!-- 在两个大括号中 -->
{{ message | capitalize }}

<!-- 在 v-bind 指令中 -->
<div v-bind:id="rawId | formatId"></div>
```

```html
<div id="app">
  {{ message | capitalize }}
</div>
    
<script>
new Vue({
  el: '#app',
  data: {
    message: 'runoob'
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  }
})
</script>
```



### 缩写

Vue.js 为两个最为常用的指令提供了特别的缩写：

#### v-bind 缩写

```html
<!-- 完整语法 -->
<a v-bind:href="url"></a>
<!-- 缩写 -->
<a :href="url"></a>
```

#### v-on 缩写

```html
<!-- 完整语法 -->
<a v-on:click="doSomething"></a>
<!-- 缩写 -->
```


`后续不断学习和完善....`