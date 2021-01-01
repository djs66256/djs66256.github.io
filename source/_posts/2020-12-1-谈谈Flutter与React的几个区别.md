---
title: 谈谈 Flutter、客户端、React 组件的几个区别
date: 2020-12-1 23:37:30
categories:
- 文章
tags:
- Flutter
- React
---

Flutter 是 Google 新的一种跨端方案，大家都非常的看好他的上限。但是实际和大家了解下来，却处于一种比较尴尬的地位。客户端开发觉得这个和原生开发相差很大，学习成本陡峭，而前端又觉得这是一个客户端的技术，同时 dart 语言也远没有 js 灵活好用。但技术总是万变不离其宗，很多思想其实都是殊途同归。这里我们就简单讨论一下 Flutter 与 React 之间的一些区别与联系，有 React 开发经验的同学会更容易理解。

<!-- more -->

## Widget 与 Component 与 View

Flutter 的 Widget 是页面的最基础组成部分，这个很类似与 React 中的 Component 和客户端中 View 的概念，但却又有本质上的区别。

首先不同的点是 mutable，Widget 是不可修改的，一旦创建就无法进行修改，因为一旦修改了其内容，就无法正确的对其进行 diff。这一点其实和 Component 很相似，虽然 Component 可以直接修改，但本质上还是需要通过状态机进行更新。而 View 则是完全开放其修改的能力的。

其次，概念本身会有区别，大致可以这么认为：

```
RenderWidget + RenderElement + RenderObject == Component + <div> == View
```

Widget 不一定会承载视图，即可能承载的是纯粹的业务逻辑或者消息通信能力，不像 Component，即使是个桥接能力的组件，也会生成一个 `div` 标签。粒度比 Component 更细，这可能也是前端同学觉得不够灵活的一个原因吧。

当 Widget 承载视图的时候，也不是直接承载的，而是通过 RenderElement 进行管理状态，RenderObject 管理布局与绘制。从客户端的角度看，可能这样的对应关系更为贴切：

```
RenderElement -> View
RenderObject  >= Layer
```

从绘制角度看，一个 Widget 未必就代表一个图层，而对客户端来说，一个 View 则必然代表一个或多个图层。Flutter 会对其进行优化，将多个 Widget 合并到一个图层上进行绘制，也有可能一个 Widget 会拆分为多个图层。虽然业务开发过程中不会接触到这个概念，但是必须了解其不同点。其中 RepaintBoundary 就是强制进行拆分图层的一个组件。

## Stateful 与 Stateless

Flutter 和 React 进行界面更新，都是通过状态机进行的，个人认为这种思路非常的优秀，而客户端则很少基于这种思路进行开发。从性能来看状态机流程所需要处理的流程会多的多，而目前来说，基本不存在这种瓶颈，但在开发过程中却需要一定的技巧，减少状态变更导致的视图树重建开销。

在 React 中，并没有严格的 Stateful 和 Stateless 的区分，只有 class component 和 function component 的区别，Flutter 将这两个概念进行了严格的区分，不允许混用，同时 Flutter 将很多不同类型的能力都进行了特化，目的就是为了进一步的优化性能。

在 Flutter 中 Stateless 仅仅是对于 Widget 层的逻辑而言，并不是代表了这个组件是完全不会有状态更新的，这个在下面的依赖绑定中可以看到。

## Dependency

依赖绑定是 Flutter 中的一个优化特性，React 也可以做到同样的能力，但似乎并不是官方提供的能力。

依赖绑定让我们拥有了一种控制局部更新的能力，最典型的就是系统的 Theme 组件。如果没有这种能力，那么我们必须在每个使用该能力的地方，都注册监听来更新当前状态机，或者直接重建整棵树。前者会大大增加代码复杂度，而后者则会大大增加性能开销。

个人觉得依赖绑定特别适合应用于数据类型状态机与组件之间的关系绑定。比如当前用户信息状态，不同页面信息状态同步等，这种范围相对较大，同时又需要在多个地方进行数据同步。甚至我们可以实现自定义规则的依赖绑定，这些都可以根据我们的需要进行。

举个例子，当前用户头像中 VIP 状态同步，可以思考下直接使用 instance 和使用 of 之间的区别：

```dart
Widget build(Context context) {
    return AvatarImage({
        url: CurrentUser.instance.avatarUrl,
        childBuilder: (ctx) {
            final currentUser = CurrentUser.of(ctx)
            return currentUser.isVIP ? VIP() : null;
        }
    }
}
```

依赖绑定的发挥空间很大，很多功能都可以考虑下这种能力。


## Layout

Flutter 中的布局方案和前端基本保持一致，都是 Flex 布局。但是在 Flutter 中，布局模式被切分为各个子项进行特化，并且是与渲染组件是分离的，而不像网页那样，单个组件可以添加各种属性。这种改变让我感觉特别不适应，更不要说前端开发了，但这对于第一次接触的人来说，学习成本似乎会低一些。

前端写法类似于：

```js
Foo(
    style: {
        padding: xxx,
        width: xxx,
        height: xxx,
    }
)
```

而在 Flutter 则需要改为如下结构，似乎变得更加啰嗦了。

```dart
Padding (
    SizedBox (
        Foo()
    )
)
```

布局拆分特化同时也减少了代码复杂度，以及自己新增布局能力的灵活性。

## 总结

可以看到，这几种技术的基本元素依然可以关联起来，只是各自有各自的一些独特能力，相信了解 React 或者 SwiftUI 这种框架的人应该能够很快适应这种开发。