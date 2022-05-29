---
title: "设计良好的日志模块"
date: 2020-04-28T18:55:09+08:00
lastmod: 2020-04-28T18:55:09+08:00
description: ""
tags: []
categories: []
author: "handy"
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

>原来来源于handy...

## *logger.hpp*

```cpp
#pragma once
#include <stdio.h>
#include <atomic>
#include <string>
#include "util.h"// function.format

#ifdef NDEBUG
#define hlog(level, ...)                                                                \
    do {                                                                                \
        if (level <= Logger::getLogger().getLogLevel()) {                               \
            Logger::getLogger().logv(level, __FILE__, __LINE__, __func__, __VA_ARGS__); \
        }                                                                               \
    } while (0)
#else
#define hlog(level, ...)                                                                \
    do {                                                                                \
        if (level <= Logger::getLogger().getLogLevel()) {                               \
            snprintf(0, 0, __VA_ARGS__);                                                \
            Logger::getLogger().logv(level, __FILE__, __LINE__, __func__, __VA_ARGS__); \
        }                                                                               \
    } while (0)

#endif

#define trace(...) hlog(Logger::LTRACE, __VA_ARGS__)
#define debug(...) hlog(Logger::LDEBUG, __VA_ARGS__)
#define info(...) hlog(Logger::LINFO, __VA_ARGS__)
#define warn(...) hlog(Logger::LWARN, __VA_ARGS__)
#define error(...) hlog(Logger::LERROR, __VA_ARGS__)
#define fatal(...) hlog(Logger::LFATAL, __VA_ARGS__)
#define fatalif(b, ...)                        \
    do {                                       \
        if ((b)) {                             \
            hlog(Logger::LFATAL, __VA_ARGS__); \
        }                                      \
    } while (0)
#define check(b, ...)                          \
    do {                                       \
        if ((b)) {                             \
            hlog(Logger::LFATAL, __VA_ARGS__); \
        }                                      \
    } while (0)
#define exitif(b, ...)                         \
    do {                                       \
        if ((b)) {                             \
            hlog(Logger::LERROR, __VA_ARGS__); \
            _exit(1);                          \
        }                                      \
    } while (0)

#define setloglevel(l) Logger::getLogger().setLogLevel(l)
#define setlogfile(n) Logger::getLogger().setFileName(n)

namespace handy {

struct Logger : private noncopyable {
    enum LogLevel { LFATAL = 0, LERROR, LUERR, LWARN, LINFO, LDEBUG, LTRACE, LALL };
    Logger();
    ~Logger();
    void logv(int level, const char *file, int line, const char *func, const char *fmt...);

    void setFileName(const std::string &filename);
    void setLogLevel(const std::string &level);
    void setLogLevel(LogLevel level) { level_ = std::min(LALL, std::max(LFATAL, level)); }

    LogLevel getLogLevel() { return level_; }
    const char *getLogLevelStr() { return levelStrs_[level_]; }
    int getFd() { return fd_; }

    void adjustLogLevel(int adjust) { setLogLevel(LogLevel(level_ + adjust)); }	//当前日志文件存档
    void setRotateInterval(long rotateInterval) { rotateInterval_ = rotateInterval; }//日志文件的截断时间间隔
    static Logger &getLogger();//获取日志对象

   private:
    void maybeRotate();
    static const char *levelStrs_[LALL + 1];
    int fd_;
    LogLevel level_;
    long lastRotate_;
    std::atomic<int64_t> realRotate_;
    long rotateInterval_;
    std::string filename_;
};

}  // namespace handy

```



## *logger.cpp*

```cpp
#include "logging.h"
#include <assert.h>
#include <errno.h>
#include <fcntl.h>
#include <stdarg.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/time.h>
#include <sys/types.h>
#include <syslog.h>
#include <time.h>
#include <unistd.h>
#include <utility>
#include "port_posix.h"

using namespace std;

namespace handy {

Logger::Logger() : level_(LINFO), lastRotate_(time(NULL)), rotateInterval_(86400) {
    tzset();
    fd_ = -1;
    realRotate_ = lastRotate_;
}

Logger::~Logger() {
    if (fd_ != -1) {
        close(fd_);
    }
}

const char *Logger::levelStrs_[LALL + 1] = {
    "FATAL", "ERROR", "UERR", "WARN", "INFO", "DEBUG", "TRACE", "ALL",
};

Logger &Logger::getLogger() {
    static Logger logger;
    return logger;
}

void Logger::setLogLevel(const string &level) {
    LogLevel ilevel = LINFO;
    for (size_t i = 0; i < sizeof(levelStrs_) / sizeof(const char *); i++) {
        if (strcasecmp(levelStrs_[i], level.c_str()) == 0) {
            ilevel = (LogLevel) i;
            break;
        }
    }
    setLogLevel(ilevel);
}

void Logger::setFileName(const string &filename) {
    int fd = open(filename.c_str(), O_APPEND | O_CREAT | O_WRONLY | O_CLOEXEC, DEFFILEMODE);
    if (fd < 0) {
        fprintf(stderr, "open log file %s failed. msg: %s ignored\n", filename.c_str(), strerror(errno));
        return;
    }
    filename_ = filename;
    if (fd_ == -1) {
        fd_ = fd;
    } else {
        int r = dup2(fd, fd_);
        fatalif(r < 0, "dup2 failed");
        close(fd);
    }
}

void Logger::maybeRotate() {
    time_t now = time(NULL);
    if (filename_.empty() || (now - timezone) / rotateInterval_ == (lastRotate_ - timezone) / rotateInterval_) {
        return;
    }
    lastRotate_ = now;
    long old = realRotate_.exchange(now);
    //如果realRotate的值是新的，那么返回，否则，获得了旧值，进行rotate
    if ((old - timezone) / rotateInterval_ == (lastRotate_ - timezone) / rotateInterval_) {
        return;
    }
    struct tm ntm;
    localtime_r(&now, &ntm);
    char newname[4096];
    snprintf(newname, sizeof(newname), "%s.%d%02d%02d%02d%02d", filename_.c_str(), ntm.tm_year + 1900, ntm.tm_mon + 1, ntm.tm_mday, ntm.tm_hour, ntm.tm_min);
    const char *oldname = filename_.c_str();
    int err = rename(oldname, newname);
    if (err != 0) {
        fprintf(stderr, "rename logfile %s -> %s failed msg: %s\n", oldname, newname, strerror(errno));
        return;
    }
    int fd = open(filename_.c_str(), O_APPEND | O_CREAT | O_WRONLY | O_CLOEXEC, DEFFILEMODE);
    if (fd < 0) {
        fprintf(stderr, "open log file %s failed. msg: %s ignored\n", newname, strerror(errno));
        return;
    }
    dup2(fd, fd_);//使用原来的文件句柄
    close(fd);
}

static thread_local uint64_t tid;
void Logger::logv(int level, const char *file, int line, const char *func, const char *fmt...) {
    if (tid == 0) {
        tid = port::gettid();
    }
    if (level > level_) {
        return;
    }
    maybeRotate();
    char buffer[4 * 1024];
    char *p = buffer;
    char *limit = buffer + sizeof(buffer);

    struct timeval now_tv;
    gettimeofday(&now_tv, NULL);
    const time_t seconds = now_tv.tv_sec;
    struct tm t;
    localtime_r(&seconds, &t);
    p += snprintf(p, limit - p, "%04d/%02d/%02d-%02d:%02d:%02d.%06d %lx %s %s:%d ", t.tm_year + 1900, t.tm_mon + 1, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec,
                  static_cast<int>(now_tv.tv_usec), (long) tid, levelStrs_[level], file, line);
    va_list args;
    va_start(args, fmt);
    p += vsnprintf(p, limit - p, fmt, args);
    va_end(args);
    p = std::min(p, limit - 2);
    // trim the ending \n
    while (*--p == '\n') {
    }
    *++p = '\n';
    *++p = '\0';
    int fd = fd_ == -1 ? 1 : fd_;
    int err = ::write(fd, buffer, p - buffer);
    if (err != p - buffer) {
        fprintf(stderr, "write log file %s failed. written %d errmsg: %s\n", filename_.c_str(), err, strerror(errno));
    }
    if (level <= LERROR) {
        syslog(LOG_ERR, "%s", buffer + 27);
    }
    if (level == LFATAL) {
        fprintf(stderr, "%s", buffer);
        assert(0);
    }
}

}  // namespace handy
```


使用单例模式，static定义局部静态是线程安全的（c++11），然后定义一系列的宏来使用log，完美。同时定时截断文件，避免单个日志文件太大影响读写速度。


