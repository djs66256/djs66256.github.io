---
layout: post
title: "C方法的Method Swizzling"
date: 2016-05-17 19:04:20 +0800
comments: true
categories: 
---

不久前，Facebook开源了一个c方法的替换库[fishhook](https://github.com/facebook/fishhook)，我好奇的去研究了下。

<!--more-->

只需要很简单的一个方法调用就可以实现替换。

```objc
rebind_symbols((struct rebinding[2]){{"close", my_close, (void *)&orig_close}, {"open", my_open, (void *)&orig_open}}, 2);
```

根据官方的解释是，

![](https://camo.githubusercontent.com/18243516844d12b1bd158ce3687635d6e48d2e2e/687474703a2f2f692e696d6775722e636f6d2f4856587148437a2e706e67)

当我们去链接动态链接库的时候，我们替换了重定向表里面的函数指针，使其指向我们想要替换的方法，所以调用的时候，自然调用到我们替换的方法中去了。

说起来简单，但还需要了解很多的东西。

## Mach-O文件

苹果系统的可执行文件格式，相对应与 linux 的 elf 格式，这是苹果官方的文档[Mach-O File Format Reference](http://developer.apple.com/documentation/DeveloperTools/Conceptual/MachORuntime/index.html)。

1. 胖2进制，处理多种处理器架构的一种解决方案。可以通过 `file` 和 `lipo` 命令来看支持哪些架构以及文件信息。
2. 