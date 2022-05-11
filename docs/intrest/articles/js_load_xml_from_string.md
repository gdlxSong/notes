---
title: "javascript 从string中解析dom对象"
date: 2020-03-14T10:13:31+08:00
lastmod: 2020-03-14T10:13:31+08:00
description: ""
tags: ["xml", "javascript"]
categories: ["javascript"]
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



## 加载xml字符串

```javascript
function LoadXmlText() {

            //拼接XML字符串
            var txt = '';
            txt = txt + "<note>";
            txt = txt + "<to>George</to>";
            txt = txt + "<from>John</from>";
            txt = txt + "<heading>Reminder</heading>";
            txt = txt + "<body>Don't forget the meeting!</body>";
            txt = txt + "</note>";

            
            if (window.DOMParser) {
                //非IE浏览器
                xmlDoc = (new DOMParser()).parseFromString(txt, "text/xml");
            } else {
                //IE浏览器
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");         
                // 或者：xmlDoc = new ActiveXObject("MSXML2.DOMDocument");      

                xmlDoc.async = "false";        //不启用异步，保证加载文件成功之前不会进行下面操作
                xmlDoc.loadXML(txt);
            }

            console.log(xmlDoc);
        }

```

然后就可以使用document.getElementsByTagName族函数来操做dom对象。


## 加载xml文件

### 使用ajax加载

```javascript
var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
xhr.open("GET", "data.xml", false);
xhr.send(null);
var xmlDoc = xhr.responseXML;
console.log(xmlDoc); 

```

### IE加载xml文件

```javascript
var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
xmlDoc.async = "false";
xmlDoc.load("note.xml");
console.log(xmlDoc); 

```

### Firefox加载xml文件

```javascript
var xmlDoc = document.implementation.createDocument("", "", null);
xmlDoc.async = "false";
xmlDoc.load("note.xml");
console.log(xmlDoc);

```

一般后面版本的浏览器基本都可以使用ajax来加载xml文件，但是老版本的IE或者FireFox就需要按照他们自己的标准来。