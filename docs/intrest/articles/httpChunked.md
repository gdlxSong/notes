---
title: "http之chunked"
date: 2020-05-30T12:36:21+08:00
lastmod: 2020-05-30T12:36:21+08:00
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


&emsp;&emsp;分块传输编码（Chunked transfer encoding）是超文本传输协议（HTTP）中的一种数据传输机制，它允许HTTP由网页服务器发送给客户端应用的数据可以分成多个部分。恰如POST的multipart一样。


### 使用限制

&emsp;&emsp;分块传输编码只在HTTP协议1.1版本（HTTP/1.1）中提供。


### 应用场景

&emsp;&emsp;为何会存在分块传输？ 如果客户端请求的数据都是静态的，我们可以很轻易的知道其数据长度，可以填充Content-Length字段，但是如果客户端请求的数据是动态的呢？是尚在生产中的数据，或者说一直在产生的数据呢？所以需要分块传输来解决这一问题，传输当前已经准备好了的数据，这样形成一个管道，可以及时传输已有的数据而不必等到数据准备完毕，这可以很好的提高用户体验。 其次，http的请求数量也决定用户的体验（http连接的建立是需要时间的，且服务端的连接是消耗资源的，资源是有限的），而chunked的合理应用也可以很大程度上减少连接数量，我想这也是http2.0管道机制的前身吧。

`有点像编译和解释`

### 数据格式

[chunk size][\r\n][chunk data][\r\n][chunk size][\r\n][chunk data][\r\n][chunk size = 0][\r\n][\r\n]

注意：这里的size是十六进制，size=0表示chunk的结束。在response头部字段包含`Transfer-Encoding: chunked`。

```bash
HTTP/1.1 200 OK 
Content-Type: text/plain 
Transfer-Encoding: chunked
Trailer: Expires

7\r\n 
Mozilla\r\n 
9\r\n 
Developer\r\n 
7\r\n 
Network\r\n 
0\r\n 
Expires: Wed, 21 Oct 2015 07:28:00 GMT\r\n
\r\n
```

//上面例子中换行显式写出来了的，为了更清晰的辨认。



### 测试了一下，golang的http框架不支持chunk

```c
package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)


func dec2hex(num int) string {
	var s = ""
	for {
		if num/16 > 0 {
			s = strconv.Itoa(num%16) + s
			num /= 16
		} else {
			s = strconv.Itoa(num) + s
			break
		}
	}
	return s
}

func sendChunked(w http.ResponseWriter, r *http.Request) {
	data := []string{"hello", "world"}

	//set Chunked.
	w.Header().Set("Transfer-Encoding", "chunked")
	for index, value := range data {

		//构造长度
		w.Write([]byte(dec2hex(len(value)) + "\r\n" + value + "\r\n"))
		time.Sleep(time.Duration(5) * time.Second)
		fmt.Println("send ", index)
	}
}

func dispatch() {

	http.HandleFunc("/chunked/", sendChunked)

}

func main() {

	dispatch()
	log.Fatal(http.ListenAndServe(":8888", nil))
}
```

对于chunked size的构造是我手动添加的，其实应该是接口内部去做，其次就是response对象应该是有缓冲区的（今天打开不了golang官网，下次看看做个更正），其实手动实现chunk还是简单，主要在于是否及时发送，因为如apache，nginx可能都存在发送缓冲区，不一定及时发送，也就失去了chunk的效果。







## Reference

[0] http://web-sniffer.net/rfc/rfc2616.html#section-3.6.1

[1] https://blog.csdn.net/u012175637/article/details/82467130

[2] https://www.zhihu.com/question/26495136?sort=created