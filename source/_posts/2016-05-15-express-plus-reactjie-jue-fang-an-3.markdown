---
layout: post
title: "express+react解决方案 （三）"
date: 2016-05-16 00:51:38 +0800
comments: true
categories:
- 技术
tags:
- node
- express
- ES6
- react
- 服务器
- 架构
---

React WEB 客户端实现。

<!--more-->

React 语法这个网上的资料很多，使用也很简单，JSX 的语法也非常方便，和 HTML 差别不大，这里就不多做介绍。主要看看 React 项目里面一些技术和方案。

## Flux

React 仅仅只是一套页面的解决方案，并不包含数据以及各个页面之间的交互，所以还需要一套业务框架。Facebook官方开源的是[Flux](https://github.com/facebook/flux)，其他还有一套Redux，原理和结构大致都一样，我这里使用Flux。

![flux](https://github.com/facebook/flux/raw/master/docs/img/flux-diagram-white-background.png)

上面是著名的flux架构关系图。里面主要由Action, dispatcher, store三个部分组成，数据流向单一，`view -> action -> dispatcher -> store -> view'，与一些双向绑定的框架来说，简单不少。

## Webpack

这里，还需要一个打包工具，我选择了webpack，由于配置比较麻烦，直接套用了别人的配置[React-Starter](https://github.com/webpack/react-starter.git)。

```json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev-server": "webpack-dev-server --config webpack-dev-server.config.js --progress --colors --port 2992 --inline",
    "hot-dev-server": "webpack-dev-server --config webpack-hot-dev-server.config.js --hot --progress --colors --port 2992 --inline",
    "build": "webpack --config webpack-production.config.js --progress --profile --colors",
    "start-dev": "node lib/server-development",
    "start": "node lib/server-production"
}
```

查看React-Starter的包文件，可以看到除了开发服务器以外，还有一个实时监控文件变化的编译系统。这个配置已经比较完整，大部分功能都有了，但是还不是特别适合，比如实时debug等。

## SEO

React比较困难的是做SEO，因为页面都是动态生成，所以被爬虫的时候并不能展现所有的页面，所以需要服务器渲染。

React只做服务端渲染，或者只做客户端渲染都比较简单，但是如果要两种都支持就比较麻烦。虽然React-Starter给与了我们预渲染的功能，但不太实用，所以我这里做了一套新的。

#### superagent

因为有很多页面的数据都是需要请求Rest接口的，所以我选用了`superagent`这个服务器和客户端都支持的开源组件，作为请求数据的组件。

#### 请求分类

这里采用和express一样的方法，在路由里面做判断。如果命中，则获取数据并使用预渲染的方法，如果没有命中，则返回最原始的HTML。

```js
routes.get('/*', function (params) {
	// get rest data
}
```


----

这部分的代码实现还比较混乱，还需要再优化和重构。[Github](https://github.com/djs66256/ios-eden-web.git)
