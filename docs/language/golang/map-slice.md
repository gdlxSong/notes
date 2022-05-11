---
title: Map & Slice
sidebar_position: 7
---



Slice 是Golang中常用的数据结构，即动态数组，其长度并不固定，我们可以向切片中追加元素，它会在容量不足时自动扩容。


```go
func NewSlice(elem *Type) *Type {
	if t := elem.Cache.slice; t != nil {
		if t.Elem() != elem {
			Fatalf("elem mismatch")
		}
		return t
	}

	t := New(TSLICE)
	t.Extra = Slice{Elem: elem}
	elem.Cache.slice = t
	return t
}
```

### 数据结构

编译期间的切片是 cmd/compile/internal/types.Slice 类型的，但是在运行时切片可以由如下的 reflect.SliceHeader 结构体表示，其中:

- Data 是指向数组的指针;
- Len 是当前切片的长度；
- Cap 是当前切片的容量，即 Data 数组的大小：

```go
type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
```








