---
title: "状态模式"
date: 2020-04-26T15:59:05+08:00
lastmod: 2020-04-26T15:59:05+08:00
description: ""
tags: ["设计模式", "状态模式"]
categories: ["设计模式"]
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


>大化流行，无物长往。

![](/images/statePattern.webp)


## 定义

>定义(源于Design Pattern)：当一个对象的内在状态改变时允许改变其行为，这个对象看起来像是改变了其类。


&emsp;&emsp;举个不太恰当的栗子叭，比如一个人现在有三种状态，站立，卧倒，奔跑。 这三种状态可以相互转换，在每一种状态其行为不同，站立的时候可以立定跳远， 卧倒的时候可以匍匐前进，奔跑的时候可以嘶声力竭的大喊。

&emsp;&emsp;而状态之间可以相互转换，但是是有约束关系的，比如你要从卧倒转变成奔跑，必须先站起来，所以：卧倒->站立->奔跑（有意义的约束决定与你的业务逻辑）。


## 实现(golang)

```golang
package main

import (
	"errors"
	"fmt"
	"reflect"
)

type State interface {
	//get name of state.
	Name() string

	//是否允许同态转移.
	EnableSameTansit() bool

	//begin
	OnBegin()

	//end
	OnEnd()

	//if transit.
	CanTransitTo(name string) bool
}

func StateName(s State) string {
	if nil == s {
		return "none"
	}
	return reflect.TypeOf(s).Elem().Name()
}

type StateInfo struct {
	name string
}

func (si *StateInfo) Name() string {
	return si.name
}

func (si *StateInfo) setName(name string) {
	si.name = name
}

func (si *StateInfo) EnableSameTansit() bool {
	return false
}

func (si *StateInfo) OnBegin() {

}
func (si *StateInfo) OnEnd() {

}

func (si *StateInfo) CanTransitTo(name string) bool {
	return true
}

//-----------------------manager.
//transit State.
var ErrStateNotFound = errors.New("state not found.")
var ErrForbidSameStateTransit = errors.New("forbid same state transit")
var ErrCannotTransitToState = errors.New("cannot transit to state")

type StateManager struct {
	stateByName map[string]State

	OnChange func(from, to State)

	currenteState State
}

func (sm *StateManager) Get(name string) State {
	if s, ok := sm.stateByName[name]; ok {
		return s
	}
	return nil
}

func (sm *StateManager) Add(state State) {

	name := StateName(state)
	if nil != sm.Get(name) {
		panic("duplicate state:" + name)
	}

	state.(interface {
		setName(name string)
	}).setName(name)

	sm.stateByName[name] = state
}

func NewStateManager() *StateManager {
	return &StateManager{
		stateByName: make(map[string]State),
	}
}

func (sm *StateManager) CurrentState() State {
	return sm.currenteState
}

func (sm *StateManager) CanCurrTranistTo(name string) bool {
	if nil == sm.currenteState {
		return true
	}
	if sm.currenteState.Name() == name && !sm.currenteState.EnableSameTansit() {
		return false
	}
	return sm.currenteState.CanTransitTo(name)
}

func (sm *StateManager) Transit(name string) error {
	//get the next state.
	nextstate := sm.stateByName[name]

	if nil == nextstate {
		return ErrStateNotFound
	}

	if nil != sm.currenteState {
		if name == sm.currenteState.Name() && !sm.currenteState.EnableSameTansit() {
			return ErrForbidSameStateTransit
		}
		if !sm.currenteState.CanTransitTo(name) {
			return ErrCannotTransitToState
		}
		//current state end.
		sm.currenteState.OnEnd()
	}

	prestate := sm.currenteState
	sm.currenteState = nextstate

	//new state begin.
	sm.currenteState.OnBegin()

	//callback Change.
	if nil != sm.OnChange {
		sm.OnChange(prestate, sm.currenteState)
	}
	return nil
}

//----------------------

//-----------------------------------------------State....
// 闲置状态
type IdleState struct {
	StateInfo // 使用StateInfo实现基础接口
}

// 重新实现状态开始
func (i *IdleState) OnBegin() {
	fmt.Println("IdleState begin")
}

// 重新实现状态结束
func (i *IdleState) OnEnd() {
	fmt.Println("IdleState end")
}

// 移动状态
type MoveState struct {
	StateInfo
}

func (m *MoveState) OnBegin() {
	fmt.Println("MoveState begin")
}

// 允许移动状态互相转换
func (m *MoveState) EnableSameTransit() bool {
	return true
}

// 跳跃状态
type JumpState struct {
	StateInfo
}

func (j *JumpState) OnBegin() {
	fmt.Println("JumpState begin")
}

// 跳跃状态不能转移到移动状态
func (j *JumpState) CanTransitTo(name string) bool {
	return name != "MoveState"
}

func main() {

	//create a Stata Manager.
	stateManager := NewStateManager()

	stateManager.OnChange = func(from, to State) {
		fmt.Printf("state changed, from %s to %s.\n", StateName(from), StateName(to))
	}

	stateManager.Add(new(IdleState))
	stateManager.Add(new(JumpState))
	stateManager.Add(new(MoveState))

	// 在不同状态间转移
	transitAndReport(stateManager, "IdleState")
	transitAndReport(stateManager, "MoveState")
	transitAndReport(stateManager, "MoveState")
	transitAndReport(stateManager, "JumpState")
	transitAndReport(stateManager, "JumpState")
	transitAndReport(stateManager, "IdleState")

}

// 封装转移状态和输出日志
func transitAndReport(sm *StateManager, target string) {
	if err := sm.Transit(target); err != nil {
		fmt.Printf("FAILED! %s --> %s, %s\n\n", sm.CurrentState().Name(), target, err.Error())
	}
}

```

### Output:

```bash
PS C:\Users\Administrator\Desktop\Test\go\goTest> go run .\finiteStateMachin.go
IdleState begin
state changed, from none to IdleState.
IdleState end
MoveState begin
state changed, from IdleState to MoveState.
FAILED! MoveState --> MoveState, forbid same state transit

JumpState begin
state changed, from MoveState to JumpState.
FAILED! JumpState --> JumpState, forbid same state transit

IdleState begin
state changed, from JumpState to IdleState.
PS C:\Users\Administrator\Desktop\Test\go\goTest>
```


&emsp;&emsp;首先分解问题：状态机包括状态和状态管理，故可以分为两部分来进行抽象：State和Manager；各个State之间是存在不同的转换关系的，而这些关系由谁来掌握规则？State？Manager？从阔扩展性的方向来看，转换规则是作为一个State的属性存在，所以自然由State自己实现，降低了State和Manager的耦合，也就增加了状态的可扩展性。


contex主要就是起一个控制作用和外部封装，就像goroutine的Contex。总体来说状态模式和策略模式还是挺像的。