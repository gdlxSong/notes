---
title: "Connect Session"
---

## 简介

&emsp;&emsp;session在很大程度上这是指代某一次client和server的会话，而这个会话具有keepalive和有状态信息，而我们可以通过user_id来记录用户状态,如此独立于物理连接之外，(一个client可能对应多个socket)，session还可能指代session实现的具体数据结构.

&emsp;&emsp;其中cookie的作用就是为了解决HTTP协议无状态的缺陷所作出的努力。至于后来出现的session机制则是又一种在客户端与服务器之间保持状态的解决方案。 

## cookie和session的区别

&emsp;&emsp;让我们用几个例子来描述一下cookie和session机制之间的区别与联系。笔者曾经常去的一家咖啡店有喝5杯咖啡免费赠一杯咖啡的优惠，然而一次性消费5杯咖啡的机会微乎其微，这时就需要某种方式来纪录某位顾客的消费数量。想象一下其实也无外乎下面的几种方案： 

1. 该店的店员很厉害，能记住每位顾客的消费数量，只要顾客一走进咖啡店，店员就知道该怎么对待了。这种做法就是协议本身支持状态。 

2. 发给顾客一张卡片，上面记录着消费的数量，一般还有个有效期限。每次消费时，如果顾客出示这张卡片，则此次消费就会与以前或以后的消费相联系起来。这种做法就是在客户端保持状态。 

3. 发给顾客一张会员卡，除了卡号之外什么信息也不纪录，每次消费时，如果顾客出示该卡片，则店员在店里的纪录本上找到这个卡号对应的纪录添加一些消费信息。这种做法就是在服务器端保持状态。 

由于HTTP协议是无状态的，而出于种种考虑也不希望使之成为有状态的，因此，后面两种方案就成为现实的选择。**具体来说cookie机制采用的是在客户端保持状态的方案，而session机制采用的是在服务器端保持状态的方案。同时我们也看到，由于采用服务器端保持状态的方案在客户端也需要保存一个标识，所以session机制可能需要借助于cookie机制来达到保存标识的目的，但实际上它还有其他选择。**

## 理解session机制 

&emsp;&emsp;session机制是一种服务器端的机制，服务器使用一种类似于散列表的结构（也可能就是使用散列表）来保存信息。

&emsp;&emsp;当程序需要为某个客户端的请求创建一个session的时候，服务器首先检查这个客户端的请求里是否已包含了一个session标识 - 称为session id，如果已包含一个session id则说明以前已经为此客户端创建过session，服务器就按照session id把这个session检索出来使用（如果检索不到，可能会新建一个），如果客户端请求不包含session id，则为此客户端创建一个session并且生成一个与此session相关联的session id，session id的值应该是一个既不会重复，又不容易被找到规律以仿造的字符串，这个session id将被在本次响应中返回给客户端保存。 

&emsp;&emsp;保存这个session id的方式可以采用cookie，这样在交互过程中浏览器可以自动的按照规则把这个标识发挥给服务器。一般这个cookie的名字都是类似于SEEESIONID，而。比如weblogic对于web应用程序生成的cookie，JSESSIONID=ByOK3vjFD75aPnrF7C2HmdnV6QZcEbzWoWiBYEnLerjQ99zWpBng!-145788764，它的名字就是JSESSIONID。 

&emsp;&emsp;由于cookie可以被人为的禁止，必须有其他机制以便在cookie被禁止时仍然能够把session id传递回服务器。经常被使用的一种技术叫做URL重写，就是把session id直接附加在URL路径的后面，附加方式也有两种，一种是作为URL路径的附加信息，表现形式为http://...../xxx;jsessionid=ByOK3vjFD75aPnrF7C2HmdnV6QZcEbzWoWiBYEnLerjQ99zWpBng!-145788764 
另一种是作为查询字符串附加在URL后面，表现形式为http://...../xxx?jsessionid=ByOK3vjFD75aPnrF7C2HmdnV6QZcEbzWoWiBYEnLerjQ99zWpBng!-145788764 
这两种方式对于用户来说是没有区别的，只是服务器在解析的时候处理的方式不同，采用第一种方式也有利于把session id的信息和正常程序参数区分开来。 
为了在整个交互过程中始终保持状态，就必须在每个客户端可能请求的路径后面都包含这个session id。 

&emsp;&emsp;另一种技术叫做表单隐藏字段。就是服务器会自动修改表单，添加一个隐藏字段，以便在表单提交时能够把session id传递回服务器。比如下面的表单： 

```html
<form name="testform" action="/xxx"> 
<input type="text"> 
</form> 
```

在被传递给客户端之前将被改写成：

```html
<form name="testform" action="/xxx"> 
<input type="hidden" name="jsessionid" value="ByOK3vjFD75aPnrF7C2HmdnV6QZcEbzWoWiBYEnLerjQ99zWpBng!-145788764"> 
<input type="text"> 
</form> 
```

&emsp;&emsp;这种技术现在已较少应用，笔者接触过的很古老的iPlanet6(SunONE应用服务器的前身)就使用了这种技术。 
实际上这种技术可以简单的用对action应用URL重写来代替。 

&emsp;&emsp;在谈论session机制的时候，常常听到这样一种误解“只要关闭浏览器，session就消失了”。其实可以想象一下会员卡的例子，除非顾客主动对店家提出销卡，否则店家绝对不会轻易删除顾客的资料。对session来说也是一样的，除非程序通知服务器删除一个session，否则服务器会一直保留，程序一般都是在用户做log off的时候发个指令去删除session。然而浏览器从来不会主动在关闭之前通知服务器它将要关闭，因此服务器根本不会有机会知道浏览器已经关闭，之所以会有这种错觉，是大部分session机制都使用会话cookie来保存session id，而关闭浏览器后这个session id就消失了，再次连接服务器时也就无法找到原来的session。如果服务器设置的cookie被保存到硬盘上，或者使用某种手段改写浏览器发出的HTTP请求头，把原来的session id发送给服务器，则再次打开浏览器仍然能够找到原来的session。 

&emsp;&emsp;恰恰是由于关闭浏览器不会导致session被删除，迫使服务器为seesion设置了一个失效时间，当距离客户端上一次使用session的时间超过这个失效时间时，服务器就可以认为客户端已经停止了活动，才会把session删除以节省存储空间。

## 理解javax.servlet.http.HttpSession 

&emsp;&emsp;HttpSession是Java平台对session机制的实现规范，因为它仅仅是个接口，具体到每个web应用服务器的提供商，除了对规范支持之外，仍然会有一些规范里没有规定的细微差异。这里我们以BEA的Weblogic Server8.1作为例子来演示。 

&emsp;&emsp;首先，Weblogic Server提供了一系列的参数来控制它的HttpSession的实现，包括使用cookie的开关选项，使用URL重写的开关选项，session持久化的设置，session失效时间的设置，以及针对cookie的各种设置，比如设置cookie的名字、路径、域，cookie的生存时间等。 

&emsp;&emsp;一般情况下，session都是存储在内存里，当服务器进程被停止或者重启的时候，内存里的session也会被清空，如果设置了session的持久化特性，服务器就会把session保存到硬盘上，当服务器进程重新启动或这些信息将能够被再次使用，Weblogic Server支持的持久性方式包括文件、数据库、客户端cookie保存和复制。 

&emsp;&emsp;复制严格说来不算持久化保存，因为session实际上还是保存在内存里，不过同样的信息被复制到各个cluster内的服务器进程中，这样即使某个服务器进程停止工作也仍然可以从其他进程中取得session。 

&emsp;&emsp;cookie生存时间的设置则会影响浏览器生成的cookie是否是一个会话cookie。默认是使用会话cookie。有兴趣的可以用它来试验我们在第四节里提到的那个误解。 

&emsp;&emsp;cookie的路径对于web应用程序来说是一个非常重要的选项，Weblogic Server对这个选项的默认处理方式使得它与其他服务器有明显的区别。后面我们会专题讨论。 

关于session的设置参考[5] http://e-docs.bea.com/wls/docs70/webapp/weblogic_xml.html#1036869 

## HttpSession常见问题（在本小节中session的含义为⑤和⑥的混合） 

1. session在何时被创建 

    一个常见的误解是以为session在有客户端访问时就被创建，然而事实是直到某server端程序调用HttpServletRequest.getSession(true)这样的语句时才被创建，注意如果JSP没有显示的使用 <%@page session="false"%> 关闭session，则JSP文件在编译成Servlet时将会自动加上这样一条语句HttpSession session = HttpServletRequest.getSession(true);这也是JSP中隐含的session对象的来历。 

    由于session会消耗内存资源，因此，如果不打算使用session，应该在所有的JSP中关闭它。 

2. session何时被删除 

    综合前面的讨论，session在下列情况下被删除a.程序调用HttpSession.invalidate();或b.距离上一次收到客户端发送的session id时间间隔超过了session的超时设置;或c.服务器进程被停止（非持久session） 

3. 如何做到在浏览器关闭时删除session 

    严格的讲，做不到这一点。可以做一点努力的办法是在所有的客户端页面里使用javascript代码window.oncolose来监视浏览器的关闭动作，然后向服务器发送一个请求来删除session。但是对于浏览器崩溃或者强行杀死进程这些非常规手段仍然无能为力。 
    可否通过socket连接的状态跟踪来判定？
    虽然对于socket的跟踪和session的删除都是用到一个超时机制。

4. 有个HttpSessionListener是怎么回事 

    你可以创建这样的listener去监控session的创建和销毁事件，使得在发生这样的事件时你可以做一些相应的工作。注意是session的创建和销毁动作触发listener，而不是相反。类似的与HttpSession有关的listener还有HttpSessionBindingListener，HttpSessionActivationListener和HttpSessionAttributeListener。 

5. 存放在session中的对象必须是可序列化的吗 

    不是必需的。要求对象可序列化只是为了session能够在集群中被复制或者能够持久保存或者在必要时server能够暂时把session交换出内存。在Weblogic Server的session中放置一个不可序列化的对象在控制台上会收到一个警告。我所用过的某个iPlanet版本如果session中有不可序列化的对象，在session销毁时会有一个Exception，很奇怪。 

6. 如何才能正确的应付客户端禁止cookie的可能性 

    对所有的URL使用URL重写，包括超链接，form的action，和重定向的URL，具体做法参见[6] 
http://e-docs.bea.com/wls/docs70/webapp/sessions.html#100770 

7. 开两个浏览器窗口访问应用程序会使用同一个session还是不同的session 

    参见第三小节对cookie的讨论，对session来说是只认id不认人，因此不同的浏览器，不同的窗口打开方式以及不同的cookie存储方式都会对这个问题的答案有影响。 

8. 如何防止用户打开两个浏览器窗口操作导致的session混乱 

    这个问题与防止表单多次提交是类似的，可以通过设置客户端的令牌来解决。就是在服务器每次生成一个不同的id返回给客户端，同时保存在session里，客户端提交表单时必须把这个id也返回服务器，程序首先比较返回的id与保存在session里的值是否一致，如果不一致则说明本次操作已经被提交过了。可以参看《J2EE核心模式》关于表示层模式的部分。需要注意的是对于使用javascript window.open打开的窗口，一般不设置这个id，或者使用单独的id，以防主窗口无法操作，建议不要再window.open打开的窗口里做修改操作，这样就可以不用设置。 

9. 为什么在Weblogic Server中改变session的值后要重新调用一次session.setValue 
    
    做这个动作主要是为了在集群环境中提示Weblogic Server session中的值发生了改变，需要向其他服务器进程复制新的session值。 

10. 为什么session不见了 

    排除session正常失效的因素之外，服务器本身的可能性应该是微乎其微的，虽然笔者在iPlanet6SP1加若干补丁的Solaris版本上倒也遇到过；浏览器插件的可能性次之，笔者也遇到过3721插件造成的问题；理论上防火墙或者代理服务器在cookie处理上也有可能会出现问题。 
