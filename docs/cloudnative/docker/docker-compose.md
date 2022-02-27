---
title: Docker-Compose
sidebar_position: 30
---


## Install 

> docs: https://docs.docker.com/compose/install/


```bash
# install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```


## Introduction

Compose 文件是一个 YAML 文件，它定义了 `version (DEPRECATED)`, `services (REQUIRED)`, `networks`, `volumes`, `configs` and `secrets`.。 Compose 文件的默认路径是工作目录中的 compose.yaml（首选）或 compose.yml。 Compose 实现还应该支持 docker-compose.yaml 和 docker-compose.yml 以实现向后兼容性。如果两个文件都存在，则 Compose 实现必须更喜欢规范的 compose.yaml 之一。

多个 Compose 文件可以组合在一起来定义应用程序模型。 YAML 文件的组合必须通过基于用户设置的 Compose 文件顺序附加/覆盖 YAML 元素来实现。简单的属性和地图被最高阶的 Compose 文件覆盖，列表通过附加来合并。每当要合并的免费文件托管在其他文件夹中时，必须根据第一个 Compose 文件的父文件夹解析相对路径。

由于某些 Compose 文件元素既可以表示为单个字符串也可以表示为复杂对象，因此合并必须适用于扩展形式。


## Specification

Profiles allow to adjust the Compose application model for various usages and environments. A Compose implementation SHOULD allow the user to define a set of active profiles. The exact mechanism is implementation specific and MAY include command line flags, environment variables, etc.

> spec: https://github.com/compose-spec/compose-spec/blob/master/spec.md



## Architecture








## docker-compose CLI

> docs: https://docs.docker.com/compose/reference/

```bash
Define and run multi-container applications with Docker.

Usage:
  docker-compose [-f <arg>...] [--profile <name>...] [options] [COMMAND] [ARGS...]
  docker-compose -h|--help

Options:
  -f, --file FILE             Specify an alternate compose file
                              (default: docker-compose.yml)
  -p, --project-name NAME     Specify an alternate project name
                              (default: directory name)
  --profile NAME              Specify a profile to enable
  --verbose                   Show more output
  --log-level LEVEL           DEPRECATED and not working from 2.0 - Set log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  --no-ansi                   Do not print ANSI control characters
  -v, --version               Print version and exit
  -H, --host HOST             Daemon socket to connect to

  --tls                       Use TLS; implied by --tlsverify
  --tlscacert CA_PATH         Trust certs signed only by this CA
  --tlscert CLIENT_CERT_PATH  Path to TLS certificate file
  --tlskey TLS_KEY_PATH       Path to TLS key file
  --tlsverify                 Use TLS and verify the remote
  --skip-hostname-check       Don't check the daemon's hostname against the
                              name specified in the client certificate
  --project-directory PATH    Specify an alternate working directory
                              (default: the path of the Compose file)
  --compatibility             If set, Compose will attempt to convert deploy
                              keys in v3 files to their non-Swarm equivalent

Commands:
  build              Build or rebuild services
  bundle             Generate a Docker bundle from the Compose file
  config             Validate and view the Compose file
  create             Create services
  down               Stop and remove containers, networks, images, and volumes
  events             Receive real time events from containers
  exec               Execute a command in a running container
  help               Get help on a command
  images             List images
  kill               Kill containers
  logs               View output from containers
  pause              Pause services
  port               Print the public port for a port binding
  ps                 List containers
  pull               Pull service images
  push               Push service images
  restart            Restart services
  rm                 Remove stopped containers
  run                Run a one-off command
  scale              Set number of containers for a service
  start              Start services
  stop               Stop services
  top                Display the running processes
  unpause            Unpause services
  up                 Create and start containers
  version            Show the Docker-Compose version information
```



## Syntax


> docs: https://docs.docker.com/compose/compose-file/compose-file-v3/


Example：

```yaml
services:
  frontend:
    image: awesome/webapp
    ports:
      - "443:8043"
    networks:
      - front-tier
      - back-tier
    configs:
      - httpd-config
    secrets:
      - server-certificate

  backend:
    image: awesome/database
    volumes:
      - db-data:/etc/data
    networks:
      - back-tier

volumes:
  db-data:
    driver: flocker
    driver_opts:
      size: "10GiB"

configs:
  httpd-config:
    external: true

secrets:
  server-certificate:
    external: true

networks:
  # The presence of these objects is sufficient to define them
  front-tier: {}
  back-tier: {}
```



## Q&A

> docs: https://docs.docker.com/compose/faq/

















