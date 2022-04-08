---
title: Kafka设计解析（一）- Kafka背景及架构介绍 
sidebar_position: 1
---





kafka 存在两种消费接口：Consumer，ConsumerGroup。对于Consumer 而言要求用户自己管理 offset，对于ConsumerGroup而言kafka会帮助你在元数据中记录你的提交历史。

>本文转发自技术世界，原文链接　http://www.jasongj.com/2015/03/10/KafkaColumn1
