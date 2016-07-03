---
layout: post
title: "从UITextView看文字绘制优化"
date: 2016-06-23 09:39:50 +0800
comments: true
categories: iOS, 技术, UITextKit, NSAttributedString
---

最近有一个地方需要自定义文字编辑器，所以使用了iOS7开始支持的UITextKit来绘制，同时也遇到不少的坑，这里来说说我遇到的几个坑。

<!--more-->

## UITextView 绘制原理分析

## ios8 deleteBackward

这是应该是苹果的一个bug，从iOS8.0-8.3系统，重写UITextView，UIInput协议的deleteBackward的时候，发现删除的时候不能被触发，而且仅仅只在这几个系统下才有这样的问题。stackoverflow上提出的解决方案是重写一个私有api，这个不会被苹果AppStore拒绝。

```objective-c
- (BOOL)keyboardInputShouldDelete:(TextField *)textField {
    BOOL shouldDelete = YES;

    if ([TextField instancesRespondToSelector:_cmd]) {
        BOOL (*keyboardInputShouldDelete)(id, SEL, UITextField *) = (BOOL (*)(id, SEL, UITextField *))[UITextField instanceMethodForSelector:_cmd];

        if (keyboardInputShouldDelete) {
            shouldDelete = keyboardInputShouldDelete(self, _cmd, textField);
        }
    }

    BOOL isIos8 = ([[[UIDevice currentDevice] systemVersion] intValue] == 8);
    BOOL isLessThanIos8_3 = ([[[UIDevice currentDevice] systemVersion] floatValue] < 8.3f);

    if (![textField.text length] && isIos8 && isLessThanIos8_3) {
        [self deleteBackward];
    }

    return shouldDelete;
}
```

## ios7 boudingRect

在iOS7上，要计算文字的高度，被换成了新的方法`boudingRect`，但是在iOS7的系统上，还是会有错误的。

如果你是UILabel，那么没有问题，但是，如果你使用的是UITextView，那么，两者的实际高度为不一致的，可以看的出来，在iOS7上，Label的绘制方式和UITextView还是不一样的。

要解决这个问题，只能实例化一个UITextView对象了：

```objective-c

```

在某些场合，为了避免频繁的动态生成，可以使用NSCache做一层缓存。


```objective-c


```

## NSTextAlignmentJustified 两端对齐

在UITextView和UILabel的对齐样式属性里面，虽然没有说明禁止使用两端对齐的方式，但是其实是不支持的，如果需要支持，需要使用NSAttributedString来设置，而且只设置了对齐方式还是不能对齐的，还需要一个下划线的属性（这可能也是一个系统缺陷）。

```objective-c

```

