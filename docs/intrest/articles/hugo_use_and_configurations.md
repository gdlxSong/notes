---
title: "Hugo的使用和配置"
date: 2020-03-12T14:50:29+08:00
lastmod: 2020-03-12T14:50:29+08:00
description: ""
tags: ["xGdl", "hugo", "Configuration"]
categories: ["Configuration"]
author: "xGdl"
keywords: ["hugo"]
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




##### Description：
	A Fast and Flexible Static Site Generator built with love by bep, spf13 and friends in Go.


##### 安装：

1.	可以直接下载源码然后编译。

		源码地址：https://github.com/gohugoio/hugo
2. 也可以直接下载可执行文件

		可执行文件地址：https://github.com/gohugoio/hugo/releases

> 滴滴滴，就安装好了。(就需要一个可执行文件，最多配置一下环境变量，指定可执行文件位置)


##### hugo常用命令：


```bash
PS C:\Users\Administrator\Desktop\hugo\yqun.xyz> .\hugo.exe --help
hugo is the main command, used to build your Hugo site.

Hugo is a Fast and Flexible Static Site Generator
built with love by spf13 and friends in Go.

Complete documentation is available at http://gohugo.io/.

Usage:
  hugo [flags]
  hugo [command]

Available Commands:
  config      Print the site configuration
  convert     Convert your content to different formats
  deploy      Deploy your site to a Cloud provider.
  env         Print Hugo version and environment info
  gen         A collection of several useful generators.
  help        Help about any command
  import      Import your site from others.
  list        Listing out various types of content
  mod         Various Hugo Modules helpers.
  new         Create new content for your site
  server      A high performance webserver
  version     Print the version number of Hugo

Flags:
  -b, --baseURL string         hostname (and path) to the root, e.g. http://spf13.com/
  -D, --buildDrafts            include content marked as draft
  -E, --buildExpired           include expired content
  -F, --buildFuture            include content with publishdate in the future
      --cacheDir string        filesystem path to cache directory. Defaults: $TMPDIR/hugo_cache/
      --cleanDestinationDir    remove files from destination not found in static directories
      --config string          config file (default is path/config.yaml|json|toml)
      --configDir string       config dir (default "config")
  -c, --contentDir string      filesystem path to content directory
      --debug                  debug output
  -d, --destination string     filesystem path to write files to
      --disableKinds strings   disable different kind of pages (home, RSS etc.)
      --enableGitInfo          add Git revision, date and author info to the pages
  -e, --environment string     build environment
      --forceSyncStatic        copy all files when static is changed.
      --gc                     enable to run some cleanup tasks (remove unused cache files) after the build
  -h, --help                   help for hugo
      --i18n-warnings          print missing translations
      --ignoreCache            ignores the cache directory
      --ignoreVendor           ignores any _vendor directory
  -l, --layoutDir string       filesystem path to layout directory
      --log                    enable Logging
      --logFile string         log File path (if set, logging enabled automatically)
      --minify                 minify any supported output format (HTML, XML etc.)
      --noChmod                don't sync permission mode of files
      --noTimes                don't sync modification time of files
      --path-warnings          print warnings on duplicate target paths etc.
      --quiet                  build in quiet mode
      --renderToMemory         render to memory (only useful for benchmark testing)
  -s, --source string          filesystem path to read files relative from
      --templateMetrics        display metrics about template executions
      --templateMetricsHints   calculate some improvement hints when combined with --templateMetrics
  -t, --theme strings          themes to use (located in /themes/THEMENAME/)
      --themesDir string       filesystem path to themes directory
      --trace file             write trace to file (not useful in general)
  -v, --verbose                verbose output
      --verboseLog             verbose logging
  -w, --watch                  watch filesystem for changes and recreate as needed

Additional help topics:
  hugo check   Contains some verification checks

Use "hugo [command] --help" for more information about a command.
PS C:\Users\Administrator\Desktop\hugo\yqun.xyz>
```


##### 常用命令：
```bash
# 使用方法:
  hugo
  hugo [flags]
  hugo [command]
  hugo [command] [flags]
 
# 查看版本
hugo version
 
# 版本和环境详细信息
hugo env
 
# 创建新站点
hugo new site siteName
 
# 创建文章
hugo new index.md  
 
在content/文件夹可以看到，此时多了一个markdown格式的文件index.md，打开文件可以看到时间和文件名等信息已经自动加到文件开头，包括创建时间，页面名，是否为草稿等。
 
# 编译生成静态文件
hugo
 
Hugo将编译所有文件并输出到public目录     

# 编译生成静态文件并启动web服务
hugo server

```

##### 常用的参数：

```bash
 -t hyde        使用hyde主题，如果使用-t 选择了主题会将当前默认的主题覆盖；
 --buildDrafts参数将生成被标记为草稿的页面，是否发布：hugo 会忽略所有通过 draft: true 标记为草稿的文件。必须改为 draft: false 才会编译进 HTML 文件。
 --baseURL=http://www.datals.com   站点监听域名
 --bind=0.0.0.0   监听全部网段
 --port=80        服务监听端口
 -w               如果修改了网站内的信息，会直接显示在浏览器的页面上，不需要重新运行hugo server，方便我们进行修改。  

```


##### 网站推送：

```bash
执行hugo命令，站点目录下会新建文件夹public/，生成的所有静态网站页面都会存储到这个目录，
如果使用Github pages来作为博客的Host，你只需要将public/里的文件上传就可以。
如果使用nginx作为web服务配置root dir 指向public/ 即可；
```
