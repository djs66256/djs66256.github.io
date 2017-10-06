---
title: navigation-bar的黑魔法
date: 2017-09-27 01:31:39
categories:
- iOS
tags:
- navigationBar
---

平时我们在处理页面跳转的时候有一个非常难受的情景，就是当两个页面的导航栏背景色不一致的时候，系统不能很好的处理这两者间的交互动画，这就导致整个导航栏的背景转换非常的生硬，那么这里就来看看现在的一些主流的处理方式。

<!--more-->

## 自定义navigationBar

在每个`Controller`的内部自己实现一个`navigation bar`，来替代系统`UINavigationController`的bar。

这种方式最简单直接，也不需要考虑太多的兼容措施和特殊情况。但是这种方式太繁琐，同时和系统的特性相差比较多，不太利于以后的移植和扩展。

要简化这种方式可以定义一个基类，包含实现navigationBar，其他都继承于该基类:

```objc
@interface BaseViewController: UIViewController
@property (readonly, strong, nonatomic) UINavigationBar *navigationBar;
@end
```

## 转换NavigationBar的background

像微信这种，导航栏的按钮等动效还是和系统一致，但是背景动效却是跟随页面的。其实是伪装了部分navigationBar。

```
\----------------\
 \ navigation bar \
  \----------------\
\------------------------\
 \ navigation bacckground \
  \------------------------\
   \          view          \
    \------------------------\
```

在每次设置`navigation background`相关属性的时候，自动为其转入到一个第三方的`background view`中实现。而系统的`navigation bar`永远是透明的，所以看到的永远是在下面的假的背景。这里要注意的是，需要将这个`background`永远放在最上层的视图。

这里`background`有两种方式实现，比如微信，是直接生成一个`UINavigationBar`，而有些库则是截屏然后渲染为`image`对象来展示。不管哪种方式，其思想都是一致的。

这种方式和第一种方式类似，只是将部分（背景）放到了view中实现，这种方式既符合了系统的编写方式，又简化了实现的方式，是一种比较好的方式。甚至可以两者结合起来，设置背景的时候不要调用`self.navigationController.navigationBar`，而调用上面的`self.navigationBar`。

## 多层嵌套NavigationController

上面的方式都是制造了一个假的navigationBar来解决这类问题，这个方式是完全的使用系统特性来解决这个问题，比如云音乐就是这样的。

既然`UINavigationController`自带`navigationBar`，那么我们为什么不利用这个特性呢。我们每次push进去的不是一个单纯的`UIViewController`，而是一个`UINavigationController`。

```objc
- (void)pushViewController:(UIViewController *)controller animated:(BOOL)animated {
  UINavigationController *navi = [[UINavigationController alloc] initWithRootController:controller];
  [super pushViewController:navi animated:animated];
}
```

这样我们虽然使用的是系统方式，然而我们push进去的是一个`UINavigationController`。

这种方式所得到的`navigation bar`是真正的系统特性，无需做任何的适配。但这种方式也给整个结构带来了破坏，这里来说说：

push进去的是一个controller，而从`self.navigationController.viewControllers`中取出来的却并不一致，也就产生了api含义的不对称性。如果你要判断上一个Controller是什么页面就会比较麻烦了。当然这种不对称性可以通过重写方法来解决，但还是在使用者无感知的情况下，破坏了其整体结构：

```objc
- (NSArray *)viewControllers {
  return [[super viewControllers] map:^(UINavigationController *navi){
    return navi.rootController;
  }];
}
```

## 总结

就以上几种方式来看，本人更倾向于第二种方式，既按照系统的特性来，有避免了改动系统结构，对系统api的含义转换我还是比较谨慎的，副作用会让人感到疑惑和难以察觉。

如果你还有其他的方式，可以告诉我。
