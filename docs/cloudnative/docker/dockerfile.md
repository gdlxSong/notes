---
title: Dockerfile
sidebar_position: 3
---



## Dockerfile 

用于自动构建 docker Image.



### FROM

```bash
FROM <image>
# 指定 image 的 tag.
FROM <image>:<tag>
```

- FROM指定构建镜像的基础源镜像，如果本地没有指定的镜像，则会自动从 Docker 的公共库 pull 镜像下来。
- FROM必须是 Dockerfile 中非注释行的第一个指令，即一个 Dockerfile 从FROM语句开始。
- FROM可以在一个 Dockerfile 中出现多次，如果有需求在一个 Dockerfile 中创建多个镜像。
- 如果FROM语句没有指定镜像标签，则默认使用latest标签。


### MAINTAINER
 

```bash
MAINTAINER <name>
```

指定创建镜像的用户 。



### RUN

```bash
RUN  "executable", "param1", "param2"
```

每条RUN指令将在当前镜像基础上执行指定命令，并提交为新的镜像，后续的RUN都在之前RUN提交后的镜像为基础，镜像是分层的，可以通过一个镜像的任何一个历史提交点来创建，类似源码的 版本控制 。

```bash
# exec 方式会被解析为一个 JSON 数组，所以必须使用双引号而不是单引号。exec 方式不会调用一个命令 shell，所以也就不会继承相应的变量，如：
RUN [ "echo", "$HOME" ]

# 这种方式是不会达到输出 HOME 变量的，正确的方式应该是这样的
RUN [ "sh", "-c", "echo", "$HOME" ]
```

RUN产生的缓存在下一次构建的时候是不会失效的，会被重用，可以使用--no-cache选项，即 `docker build --no-cache`，如此便不会缓存。 


### CMD

```bash
CMD有三种使用方式:

CMD  "executable","param1","param2"
CMD  "param1","param2"
CMD command param1 param2 (shell form)
```

CMD指定在 Dockerfile 中只能使用一次，如果有多个，则只有最后一个会生效。

CMD的目的是为了在启动容器时提供一个默认的命令执行选项。如果用户启动容器时指定了运行的命令，则会覆盖掉CMD指定的命令。

> CMD会在启动容器的时候执行，build 时不执行，而RUN只是在构建镜像的时候执行，后续镜像构建完成之后，启动容器就与RUN无关了，这个初学者容易弄混这个概念，这里简单注解一下。


### EXPOSE

```bash
EXPOSE <port> [<port>...]
```

告诉 Docker 服务端容器对外映射的本地端口，需要在 docker run 的时候使用-p或者-P选项生效。 

### ENV

```bash
# 只能设置一个变量
ENV <key> <value>     
# 允许一次设置多个变量  
ENV <key>=<value> ...   
```

指定一个环节变量，会被后续RUN指令使用，并在容器运行时保留。

例子:

```bash
ENV myName="John Doe" myDog=Rex\ The\ Dog \
    myCat=fluffy

# 等同于

ENV myName John Doe
ENV myDog Rex The Dog
ENV myCat fluffy

```


### ADD

```bash
ADD <src>... <dest>
```

ADD复制本地主机文件、目录或者远程文件 URLS 从 并且添加到容器指定路径中 。

> 支持通过 Go 的正则模糊匹配，具体规则可参见  Go filepath.Match

```bash
# adds all files starting with "hom"
ADD hom* /mydir/        
# ? is replaced with any single character
ADD hom?.txt /mydir/    
```

- 路径必须是绝对路径，如果 不存在，会自动创建对应目录
- 路径必须是 Dockerfile 所在路径的相对路径
- 如果是一个目录，只会复制目录下的内容，而目录本身则不会被复制



### COPY

```bash
COPY <src>... <dest>
```

COPY复制新文件或者目录从 并且添加到容器指定路径中 。用法同ADD，唯一的不同是不能指定远程文件 URLS。 


### ENTRYPOINT

```bash
ENTRYPOINT  "executable", "param1", "param2"
ENTRYPOINT command param1 param2 (shell form)
```

配置容器启动后执行的命令，并且不可被 docker run 提供的参数覆盖，而CMD是可以被覆盖的。如果需要覆盖，则可以使用 `docker run --entrypoint` 选项。

> 每个 Dockerfile 中只能有一个ENTRYPOINT，当指定多个时，只有最后一个生效。

 
通过ENTRYPOINT使用 exec form 方式设置稳定的默认命令和选项，而使用CMD添加默认之外经常被改动的选项。

```bash
FROM ubuntu
ENTRYPOINT ["top", "-b"]
CMD ["-c"]
```

通过 Dockerfile 使用ENTRYPOINT展示前台运行 Apache 服务

```bash
FROM debian:stable
RUN apt-get update && apt-get install -y --force-yes apache2
EXPOSE 80 443
VOLUME ["/var/www", "/var/log/apache2", "/etc/apache2"]
ENTRYPOINT ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
```
 
这种方式会在/bin/sh -c中执行，会忽略任何CMD或者docker run命令行选项，为了确保docker stop能够停止长时间运行ENTRYPOINT的容器，确保执行的时候使用exec选项。

```bash
FROM ubuntu
ENTRYPOINT exec top -b
```

如果在ENTRYPOINT忘记使用exec选项，则可以使用CMD补上:

```bash
FROM ubuntu
ENTRYPOINT top -b
CMD --ignored-param1 # --ignored-param2 ... --ignored-param3 ... 
```


### VOLUME

```bash
VOLUME ["/data"]
```

创建一个可以从本地主机或其他容器挂载的挂载点。 


### USER

```bash
USER daemon
```

指定运行容器时的用户名或 UID，后续的RUN、CMD、ENTRYPOINT也会使用指定用户。 

### WORKDIR

```bash
WORKDIR /path/to/workdir
```

为后续的RUN、CMD、ENTRYPOINT指令配置工作目录。可以使用多个WORKDIR指令，后续命令如果参数是相对路径，则会基于之前命令指定的路径。

```bash
WORKDIR /a
WORKDIR b
WORKDIR c
# 最终路径是/a/b/c。
RUN pwd
```



WORKDIR指令可以在ENV设置变量之后调用环境变量:

```bash
ENV DIRPATH /path
WORKDIR $DIRPATH/src
# 最终路径则为: 
/path/src
```



### ONBUILD

```bash
ONBUILD [INSTRUCTION]
```

配置当所创建的镜像作为其它新创建镜像的基础镜像时，所执行的操作指令。

例如，Dockerfile 使用如下的内容创建了镜像 image-A：

```bash
ONBUILD ADD . /app/src
ONBUILD RUN /usr/local/bin/python-build --dir /app/src
```

如果基于 image-A 创建新的镜像时，新的 Dockerfile 中使用 FROM image-A 指定基础镜像时，会自动执行 ONBUILD 指令内容，等价于在后面添加了两条指令。

```bash
# Automatically run the following
ADD . /app/src
RUN /usr/local/bin/python-build --dir /app/src
```

使用ONBUILD指令的镜像，推荐在标签中注明，例如 ruby:1.9-onbuild。 
