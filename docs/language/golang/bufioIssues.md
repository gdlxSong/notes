---
title: "BufioIssues"
---




## 简介


>https://golang.google.cn/pkg/bufio/




bufio通过包装io.Reader和io.Writer，提供缓冲区（默认64k），来提供文本操作。


### Scanner


scanner就是字面意思，扫描器，通过分割器来实现数据流扫描。


bufio提供四种分割器：

- **ScanLines**：以换行符分割（’n’）
- **ScanWords**：返回通过“空格”分词的单词
- **ScanRunes**：返回单个 UTF-8 编码的 rune 作为一个 token
- **ScanBytes**：返回单个字节作为一个 token


分割器定义如下：

	type SplitFunc func(data []byte, atEOF bool) (advance int, token []byte, err error)

	parameters:
		@data: 输入的数据流
		@atEOF: 标识数据流是否结束
	return:
		@advance: 推进(扫描)了多少字节


----

**Scanner**：

```c

>https://golang.google.cn/src/bufio/scan.go?s=1184:1841#L20


type Scanner struct {
    // contains filtered or unexported fields
}

func NewScanner(r io.Reader) *Scanner    
func (s *Scanner) Buffer(buf []byte, max int) //设置scanner的缓冲区
func (s *Scanner) Bytes() []byte    		  //返回一个扫描到的结果
func (s *Scanner) Err() error    			  //error
func (s *Scanner) Scan() bool    			  //扫描
func (s *Scanner) Split(split SplitFunc)	  //设置分割器
func (s *Scanner) Text() string					
```


**使用Scanner：**

```c
func main() {
    input := "abcend234234234"
    fmt.Println(strings.Index(input,"end"))
    scanner := bufio.NewScanner(strings.NewReader(input))
    scanner.Split(ScanEnd)
    //设置读取缓冲读取大小 每次读取2个字节 如果缓冲区不够则翻倍增加缓冲区大小
    buf := make([]byte, 2)
    scanner.Buffer(buf, bufio.MaxScanTokenSize)
    for scanner.Scan() {//while...
        fmt.Println("output:",scanner.Text())
    }
    if scanner.Err() != nil {
        fmt.Printf("error: %s\n", scanner.Err())
    }
}

func ScanEnd(data []byte, atEOF bool) (advance int, token []byte, err error) {
    //如果数据为空，数据已经读完直接返回
    if atEOF && len(data) == 0 {
        return 0, nil, nil
    }
    // 获取自定义的结束标志位的位置
    index:= strings.Index(string(data),"end")
    if index > 0{
        //如果找到 返回的第一个参数为后推的字符长度  
        //第二个参数则指标志位之前的字符 
        //第三个参数为是否有错误
        return index+3, data[0:index],nil
    }
    if atEOF {
        return len(data), data, nil
    }
    //如果没有找到则返回0，nil，nil
    return 0, nil, nil
}
```


**Scan的源码**：

```c
type Scanner struct {
    r            io.Reader // reader
    split        SplitFunc // 分割函数 又外部注入
    maxTokenSize int       // token最大长度
    token        []byte    // split返回的最后一个令牌
    buf          []byte    // 缓冲区字符
    start        int       // buf中的第一个未处理字节
    end          int       // buf中的数据结束 标志位
    err          error     // Sticky error.
    empties      int       // 连续空令牌的计数
    scanCalled   bool      //
    done         bool      // 扫描是否完成
}

func (s *Scanner) Scan() bool {
    if s.done {
        return false
    }
    s.scanCalled = true
    // for循环知道找到token为止
    for {
        if s.end > s.start || s.err != nil {
            // 调用split函数 得到返回值，函数中判断是否有token token往后推的标志位数 是否有错误
            advance, token, err := s.split(s.buf[s.start:s.end], s.err != nil)
            if err != nil {
                if err == ErrFinalToken {
                    s.token = token
                    s.done = true
                    return true
                }
                s.setErr(err)
                return false
            }
            if !s.advance(advance) {
                return false
            }
            s.token = token
            if token != nil {
                if s.err == nil || advance > 0 {
                    s.empties = 0
                } else {
                    // Returning tokens not advancing input at EOF.
                    s.empties++
                    if s.empties > 100 {
                        panic("bufio.Scan: 100 empty tokens without progressing")
                    }
                }
                return true
            }
        }
        //如果有错误 则返回false
        if s.err != nil {
            // Shut it down.
            s.start = 0
            s.end = 0
            return false
        }
        //重新设置开始位置 和结束位置 读取更多数据
        if s.start > 0 && (s.end == len(s.buf) || s.start > len(s.buf)/2) {
            copy(s.buf, s.buf[s.start:s.end])
            s.end -= s.start
            s.start = 0
        }
        // 如果buf满了 如果满了重新创建一个长度为原来两倍大小的buf
        if s.end == len(s.buf) {
            const maxInt = int(^uint(0) >> 1)
            if len(s.buf) >= s.maxTokenSize || len(s.buf) > maxInt/2 {
                s.setErr(ErrTooLong)
                return false
            }
            newSize := len(s.buf) * 2
            if newSize == 0 {
                newSize = startBufSize
            }
            if newSize > s.maxTokenSize {
                newSize = s.maxTokenSize
            }
            newBuf := make([]byte, newSize)
            copy(newBuf, s.buf[s.start:s.end])
            s.buf = newBuf
            s.end -= s.start
            s.start = 0
        }
        //如果没有找到则往后继续读取数据
        for loop := 0; ; {
            n, err := s.r.Read(s.buf[s.end:len(s.buf)])
            s.end += n
            if err != nil {
                s.setErr(err)
                break
            }
            if n > 0 {
                s.empties = 0
                break
            }
            loop++
            if loop > maxConsecutiveEmptyReads {
                s.setErr(io.ErrNoProgress)
                break
            }
        }
    }
}
```






## Issues

### func (\*Reader) Discard  

>If Discard skips fewer than n bytes, it also returns an error. If 0 <= n <= b.Buffered(), Discard is guaranteed to succeed without reading from the underlying io.Reader. 

### func (\*Reader) Peek  

Peek操作和Discard一样都只是针对缓冲区，不对io.Reader进行操作。


### func (\*Reader) ReadLine ¶ 



ReadLine是一个底层原语，接口不太友好，建议使用ReadString或者ReadBytes替代。

>ReadLine is a low-level line-reading primitive. Most callers should use ReadBytes('\n') or ReadString('\n') instead or use a Scanner. 

>The text returned from ReadLine does not include the line end ("\r\n" or "\n"). 



### func (\*Writer) Flush 

>Flush writes any buffered data to the underlying io.Writer. 













