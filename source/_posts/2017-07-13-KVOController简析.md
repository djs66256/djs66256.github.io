---
title: KVOController简析
date: 2017-07-13 21:03:47
categories:
- iOS
tags:
- KVO
- KVOController
---

关于KVO的使用，最常用的一个类库就是FB的KVOController了，还有一个HTBKVObservation，是解决了FB的循环引用的问题，但是后来FB的循环引用问题解决了。现在我们来简单看看这两者的实现方式。

<!--more-->

## 实现

其实两者的思想都是一样的，都是增加一个第三者，将消息处理和清理工作交给第三者进行。其中FB是利用了associate object是随着本身对象的释放而释放的特性来清理KVO的，而HTB则是利用hook dealloc方法进行清理的。

HTB的实现比较简单，所有东西都被放在了`HTBKVObservation`中，而FB则分为3个部分`FBKVOController`，`_FBKVOSharedController`，`_FBKVOInfo`。为什么FB会分为这么多部分，我认为是为了分离职责，但是个人觉得没有必要进行集中管理，除非想要撤销所有KVO的功能，但是我觉得不可能会有这个功能吧。

## 清理

FB存在一个问题，那就是被观察对象被释放了，观察者可能并没有被移除，因为外部可能会持有KVOController，但是这样好像并没有什么大问题，因为被观察者释放了也就不会有KVO的消息了。

HTB则是在被观察者dealloc的时候强制移除所有KVO。

## Reactive

Reactive中也有类似的实现，思想其实还是一致的，只是把释放交给了dispose这个单独概念。

## 总结

在这几个方案中，可以想到很多类型的问题都可以利用这种第三者的思路来解决，其实还有很多开源库也是利用该方案解决的。

另外在扩展的时候也不要一股脑的往NSObject上堆方法，利用第三者来处理这些方法可能会更加的优雅。
