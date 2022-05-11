---
title: "http之multipart/form-data"
date: 2020-05-29T19:20:21+08:00
lastmod: 2020-05-29T19:20:21+08:00
description: ""
tags: ["http"]
categories: ["http"]
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

&emsp;&emsp;multipart是http的POST方法的content-type的可选值之一，是一种数据内容组织方式。

### 应用场景

&emsp;&emsp;multipart用于http的post数据提交，常见于js的FormData对象配合ajax提交数据。


### google的FormData对象

![](/images/multipart.png)


### Content-Type的三种encrypt

1. application/x-www-urlencoded
2. multipart/form-data
3. text-plain


>首先，encrypt属性值是在http传输数据位于http头部Content-Type的，并且只是客户端提交数据有效，服务端不使用这几个值。客户端接收到这几个值会自动忽略(浏览器)。


&emsp;&emsp;在1995年，ietf 出台了 rfc1867，也就是《RFC 1867 -Form-based File Upload in HTML》，用以支持文件上传。所以 Content-Type 的类型扩充了multipart/form-data 用以支持向服务器发送二进制数据。因此，发送 POST 请求时候，表单 属性 enctype 共有二个值可选，这个属性管理的是表单的 MIME 编码：


① application/x-www-form-urlencoded (默认值)

② multipart/form-data

注：form 表单中 enctype 的默认值是 enctype=“application/x- www-form-urlencoded”.


### application/x-www-form-urlencoded如何组织数据

```bash
POST http://127.0.0.1/login.do HTTP/1.0
Accept: image/gif, image/jpeg, image/pjpeg, */*
Accept-Language: en-us,zh-cn;q=0.5
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)
Content-Length: 28
 
username=admin&password=1234
```

### multipart/form-data如何组织数据

```bash
PS C:\Users\Administrator\Desktop\Projects\poemServer\src\serve\golang> go run .\main.go
multipart/form-data; boundary=----WebKitFormBoundaryKIziqjuNgPfCj1Mw
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemname"

1234
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemclass"

叙事诗
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poetname"

4567
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemhist"

宋
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemtags"

豪迈;不羁
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="conditionlogical"

与或非
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemContent_kaipianci"

a
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemContent_content"

w
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemContent_comment"

s
------WebKitFormBoundaryKIziqjuNgPfCj1Mw
Content-Disposition: form-data; name="poemContent_history"

d
------WebKitFormBoundaryKIziqjuNgPfCj1Mw--
```

上面是一段使用golang做httpserver收到的一段multipart/form-data数据，你可以使用http.Request.ParseMultipartForm来进行对数据的解析。



### ajax使用multipart/form-data

```js
/*
   parameters:
      uri: 提交目录
      formData: FormData
      responseCallback: func
*/
function postRequest_Z(uri, formData, responseCallback) {

   var request = new XMLHttpRequest();
   request.open("POST", uri, true);

   request.onreadystatechange = function() {
      //判断返回状态.
      if (request.readyState == 4 && request.status == 200) {
         //callback.
         console.log("操作执行成功");
         responseCallback(request.responseXML);      
      } 
   }
   //send.
   request.send(formData);
}

function postRequest(formData, responseCallback) {

   postRequest_Z("/poem/post", formData, responseCallback);
}

function query(uri, formData, responseCallback) {
   postRequest_Z("/poem/query"+uri, formData, responseCallback);
}
```

在postRequest_Z中直接使用XMLHttpRequest的send方法发送formData即可，FormData在构造数据的时候会自动生成boundary和multipart格式数据，不需手动设置Content-Type，如果设置需要手动生成boundary。