---
title: Corountines 看似美好却危险重重
date: 2019-04-07 01:11:27
categories:
- iOS
tags:
- coobjc
- coroutines
---

协程Coroutines这个概念在5、6年前就已经比较热门了，而且也涌现了一波以该目标的第三方库，但是这个概念并没有被广泛的应用，这里来看看Coroutines给我们带来的便利和危险吧。

<!--more-->

## 简介

关于Coroutines、Generator的介绍有大量优秀文章和wiki的介绍，这里不做赘述。

协程出现的时间非常早，在一批语言（C#，Go，ES7）从语言本身开始支持这种特性而再一次受到关注。同时也有一大批C/C++类库的出现，来实现协程的特性，比如PCL, fiber, coroutine，以及支持Coroutine的网络库asio。甚至有人提议C++标准组织增加关键字来支持【[N3858](https://isocpp.org/files/papers/N3858.pdf)】【[N3985](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n3985.pdf)】。

## 化异步为同步

Coroutine主要想解决的问题是异步回调问题，这个问题自从多线程开始就是另大家头疼的问题，我们使用过很多方法，都无法很好的解决这个问题。比如Callback和Promise，都存在着一些瑕疵。

```js
// Callback
fs.readFile('a.txt', function (error, data) {
  fs.readFile('b.txt', function (error, data) {
    ...
  })
})
```

```js
// Promise
Promise.all([
  fs.readFile('a.txt'), 
  fs.readFile('b.txt')])
  .then(function () {
    ...
  })
```

对我们来说同步执行的逻辑是最简单的，也是最清晰的，我们将很多同步功能放到异步执行往往是为了解决阻塞问题，所以我们是完全可以将异步的功能写成同步的。

```js
await fs.readFile('a.txt')
await fs.readFile('b.txt')
```

这里我们可以用关键字`await`来表示这个方法是一个异步过程。有很多语言天生自带这一类特性，但是C系列语言并不具备这个关键字，下面来看看如何实现这个功能。

## 实现

这里盗C++论文一张图来说明一下我们需要实现协程的流程：

```js
async foo() {
  await bar()
}
```

![](/images/2019/coroutines/coroutine-c.png)

我们需要在`await`的时候，将代码执行能力转交给`bar`，然后在`bar`异步回调的时候，将执行权限交还给`foo`，这需要一种上下文切换的能力，从CPU层面来说上下文就是寄存器，那么我们要实现上下文切换的功能也就非常简单了。

个人比较熟悉arm架构，所以这里简单说明下coobjc的`setcontext`和`getcontext`。对汇编不熟悉的人可以跳到[C语言实现上下文切换](#C语言实现上下文切换)。

```armasm
_coroutine_getcontext:
    stp    x18,x19, [x0, #0x090]
    stp    x20,x21, [x0, #0x0A0]
    stp    x22,x23, [x0, #0x0B0]
    stp    x24,x25, [x0, #0x0C0]
    stp    x26,x27, [x0, #0x0D0]
    str    x28, [x0, #0x0E0];
    stp    x29, x30, [x0, #0x0E8];  // fp, lr
    mov    x9,      sp
    str    x9,      [x0, #0x0F8]
    str    x30,     [x0, #0x100]    // store return address as pc
    stp    d8, d9,  [x0, #0x150]
    stp    d10,d11, [x0, #0x160]
    stp    d12,d13, [x0, #0x170]
    stp    d14,d15, [x0, #0x180]
    mov    x0, #0                   
    ret
```

```armasm
_coroutine_setcontext:
    ldp    x18,x19, [x0, #0x090]
    ldp    x20,x21, [x0, #0x0A0]
    ldp    x22,x23, [x0, #0x0B0]
    ldp    x24,x25, [x0, #0x0C0]
    ldp    x26,x27, [x0, #0x0D0]
    ldp    x28,x29, [x0, #0x0E0]
    ldr    x30,     [x0, #0x100]  // restore pc into lr
    ldr    x1,      [x0, #0x0F8]
    mov    sp,x1                  // restore sp
    ldp    d8, d9,  [x0, #0x150]
    ldp    d10,d11, [x0, #0x160]
    ldp    d12,d13, [x0, #0x170]
    ldp    d14,d15, [x0, #0x180]
    ldp    x0, x1,  [x0, #0x000]  // restore x0,x1
    ret    x30
```

arm64中寄存器分为两类：普通寄存器和向量寄存器（也可以称为浮点寄存器）。根据C++ abi文档，各种寄存器的功能如下：

| registers | role |
| ------- | ---------------- |
| SP      | stack pointer |
| r30     | LR |
| r29     | FP |
| r0-r7   | 参数寄存器 |
| r8      | IR |
| r9-r15  | 临时寄存器 |
| r16/r17 | PLT(目前我也不了解) |
| r18     | 平台寄存器/临时寄存器 |
| r19-r28 | Callee寄存器，必要时由被调用者保存 |
| v0-v7   | 参数寄存器 |
| v8-v15  | Callee寄存器，必要时由被调用者保存 |
| v16-v31 | 其他

由此，我们可以知道必须缓存的寄存器是哪些了。

#### C语言实现上下文切换

当然系统其实也给我们提供了相似的功能，原理其实都是一样的，下面介绍一下几种系统提供的方式，详细信息可以参考相关文档：

###### setjmp/longjmp

这种方式非常的容易理解，唯一的缺点就是返回值类型是int，所以在32位系统上我们可以返回上下文指针，而64位系统就不能这么做了。

###### ucontext

目前苹果已经不支持了。

###### signal

信号也是通过类似方式实现的。

## 危险

具体实现细节还是需要自己去研究，这里说明一下其中带来的几个问题。

#### 栈

在我们的功能特性中，在执行async函数时，是需要直接返回的。由于C语言调用栈的结构，在函数返回时，是需要销毁栈的，所以我们必然不能在当前栈上运行我们的async函数，不然等异步返回的时候，函数栈帧已经被回滚（unwind）。所以在我们第一次（当前上下文的首次）启动一个async函数的时候，必须要为该函数申请一个不会被立刻销毁的栈，也就是malloc一块内存作为栈使用。目前像coobjc默认是64k的大小，对于性能要求比较关键的地方就需要好好考虑了。当然，按目前来说，一定的性能损耗给我们开发带来便捷还是可以接受的。

但是，上下文的切换可能让我们debug陷入一个无尽的深渊。大家在开发多线程的时候，都感觉比较难以调试，因为线程之间是独立的。而我们一旦切换了上下文，同时重新创建调用栈，也就意味着我们丢失了起点，有点像一个独立的线程，是无法找到调用地点的，除非我们在创建新栈的时候，将旧的栈全部拷贝，但这明显是不现实的，比较现实的可能是拷贝若干附近的栈帧数据。总之，c系语言的协程，debug将是一个比较困难的场景。

而coobjc在会库内部产生很多的栈帧，也增加了调试的复杂度。如果能够在切换上下文的时候将栈回滚，则会减少很多干扰调试的调用信息。

#### stackful

目前来看C系的协程基本上都是stackful的，也就是可以在其他函数内部触发：

```js
function some_function() {
  yield "OK";
}

function async_call() {
  // stackless 则必须在该函数栈帧内触发yield，比如javascript
  some_function();
}

function do() {
  await async_call();
}
```

在语言本身并没有相关的特性的时候，我们很难检查目前方法是否支持协程，特别是整个链路比较长的时候，更加难以知道。一些规范也只是较弱的约定，依然无法保证在一个复杂的应用中是否会出现一些遗漏的问题。

如果我们只允许其中的`async/await`与`promise`特性，则会将影响面控制在一定范围内，应该会好一些。实际上我们依然无法规避这种问题。

#### 多线程

个人认为这是我们应用协程最大的挑战，这里的问题往往已经颠覆了我们的平常认知，这里可以看一个例子：

```js
// on Thread 1
await do_something1()
// on Thread 2
await do_something2()
// on Thread 3
```

我们无法预知在await函数之后会在哪个线程！这给多线程开发带来了非常大的挑战，因为这里几乎必然会发生竞争问题！

虽然在一个过程中，我们的调用是有顺序的，是不会产生什么问题，但是我们的场景往往不会只触发一次那么简单。我们需要在每个await调用上思考多线程问题，这个反而给我们的开发带来了更大的麻烦。

当然我们可以约定，回调必须发生在主线程等，但是约定始终是约定，无法作为强制性的禁止，完全依赖个人的开发能力。

## 总结

可以看到，协程作为C系语言的扩展，依然存在巨大的缺陷，C++标准组委会到目前为止，也依然没有将其作为一个特性。协程的目的是为了化异步为同步，简化我们的开发和理解，但在真实的多线程环境中，反而对开发者的要求更高了，已经脱离了初衷。


## 参考

Glibc

armasm_user_guide

IHI0055C_beta_aapcs64

https://www.boost.org/doc/libs/1_57_0/libs/coroutine/doc/html/index.html

https://en.wikipedia.org/wiki/Setjmp.h

https://en.wikipedia.org/wiki/Setcontext

https://en.wikipedia.org/wiki/Iterator

https://en.wikipedia.org/wiki/Continuation

https://en.wikipedia.org/wiki/Coroutine

[C Generator](http://libdill.org/tutorial-basics.html)

[C++ Generator](https://www.codeproject.com/KB/cpp/cpp_generators.aspx)

[Boost fiber](https://www.boost.org/doc/libs/1_67_0/libs/fiber/doc/html/index.html)

[C++ stackful coroutines](https://www.boost.org/doc/libs/1_54_0/doc/html/boost_asio/overview/core/spawn.html)

[C++ Coroutine](https://www.boost.org/doc/libs/1_69_0/libs/coroutine/doc/html/index.html)

[A C++ await/yield emulation library for stackless coroutine](https://github.com/jamboree/co2)

[Stackless vs. Stackful Coroutines](https://blog.varunramesh.net/posts/stackless-vs-stackful-coroutines/)

[n3985](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n3985.pdf)