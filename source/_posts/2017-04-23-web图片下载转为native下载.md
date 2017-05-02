---
title: web图片下载转为native下载
date: 2017-04-23 23:30:03
categories:
- iOS
tags:
- webView
- image
- download
---

早期版本的网易新闻每次点开新闻图片，都会重新去下载新的图片，而在某个版本开始，可以发现点开的时候并不会重新加载了，只有在保存的时候会下载高清图片，那么他是怎么做到的呢。

平时，我们网页基本都是自己负责自己的内容加载。但是有时候却希望能够拿到网页内的图片资源，此时我们不得不自己再去加载一遍，不仅仅浪费流量，而且影响用户体验。

<!--more-->

由客户端帮助web下载图片，这样我们就可以让web和本地共用缓存，并且可以自定义缓存了。那么如何做到这样的效果呢？这里提供两种不同的思路来解决这种问题，分别对`UIWebView`和`WKWebView`下的运行情况进行分析。[Github](https://github.com/djs66256/web-image-test)

## URLProtocol

我们知道URLProtocol可以截获请求，那么我们是否可以直接截获所有URL，然后根据path来判断是否是图片，是否需要自定义下载。

根据demo试验来看，UIWebView可以完美的实现该方案，但是WKWebView却不能被截获，原因是WKWebView拥有自己的URLSession，虽然可以用黑科技获取URLSession并加入代理，但是不能通过苹果审核。

## FileURL

另一种方式是使用本地文件，这种方式更加符合规范而且更加安全。不过WKWebView支持本地资源的接口是在iOS 9.0才引入的，而且需要指定目录，所以需要先把所有资源拷贝到该目录下。

根据demo的试验来看，UIWebView和WKWebView都完美的支持了。

## 比较

现在来比较下这几种方案。

1. URLProtocol能够在不改变网页内容的情况下直接对内容进行替换，但是不能支持WKWebView，而且全局的Protocol可能会带来某些隐患。
2. FileURL能够灵活的定制化下载方式，而且能够支持WKWebView，但是需要将img标签的http链接替换为file链接。

## 适用场景

URLProtocol比较通用，普遍适用于各种网页。

FileURL更加偏向于定制化，这里来详细看看定制化的场景。

比如网易新闻的新闻内容格式大概是这样的：

```html
<p>正文正文正文</p>
<img src="http://www.163.com/logo.png" />
```

很多情况下，为了优化网络以及渲染，都需要类似的简化html，并且把css，js代码打包到App或者单独下载。那么其实我们有很多情况下是拥有一定固定格式的html代码段。而部分活动等特殊的网页我们一般也不会需要客户端下载资源来优化性能。那么有了这个前提，FileURL的适用面其实还是很广的。

## 动态创建DOM

那么怎么样处理比较合适呢？我们以WKWebView来看，难道我们要首先用拼装好一个网页，然后保存为一个文件进行载入吗？

当然不需要这么笨重的解决方案，这样做不仅影响了性能，而且特别不灵活，一旦内容需要变更就会特别麻烦。

目前前端技术有两个热门的概念，虚拟DOM和响应式，那么我们也可以利用类似的原理。下面是一个简单的实现。

```javascript
// 在Web端：
var imageList = []

// 创建一个空的节点，用来占位和展示进度条
function appendImage(url) {
    let dom = document.createElement('div')
    dom.style.padding = '20px 10px'

    let img = document.createElement('img')

    let p = document.createElement('p')
    p.innerText = '0%'

    dom.appendChild(p)
    dom.appendChild(img)

    document.body.appendChild(dom)
    imageList.push({url, dom})
}

function findDomByUrl(url) {
    let obj = imageList.find(i => i.url == url)
    return obj && obj.dom
}

function updateText(url, text) {
    // console.log(`update text at <${url}> with "${text}"`)
    let dom = findDomByUrl(url)
    if (dom) {
        dom.firstChild.innerText = text
    }
}

// 更新进度条
function updateProgress(url, progress) {
    updateText(url, progress)
}

// 更新错误状态
function updateError(url, error) {
    updateText(url, error);
}

// 图片下载完成后，更新图片资源
function updateImage(url, fileUrl) {
    // console.log(`update image url at <${url}> with "${fileUrl}"`)
    let dom = findDomByUrl(url)
    if (dom) {
        dom.lastChild.src = fileUrl
    }
}
```

```objc
// 客户端
// 初始化
[self.WKWebView evaluateJavaScript:[NSString stringWithFormat:@"appendImage('%@')", url] completionHandler:^(id _Nullable ret, NSError * _Nullable error) {
}];

// 这里为了测试伪造一个进度功能
__block NSInteger progress = 0;
if ([url hasPrefix:@"http"]) [NSTimer scheduledTimerWithTimeInterval:0.1 repeats:YES block:^(NSTimer * timer) {
    progress += 5;
    [self.WKWebView evaluateJavaScript:[NSString stringWithFormat:@"updateProgress('%@', '%zd')", url, progress] completionHandler:^(id _Nullable ret, NSError * _Nullable error) {

    }];
    if (progress >= 100) {
        [timer invalidate];
    }
}];
// 下载图片
[[[NSURLSession sharedSession] dataTaskWithURL:[NSURL URLWithString:url] completionHandler:^(NSData * data, NSURLResponse * response, NSError * error) {
    if (error) {
        // 错误态
        [self.WKWebView evaluateJavaScript:[NSString stringWithFormat:@"updateError('%@', '%@')", url, error.localizedDescription] completionHandler:^(id _Nullable ret, NSError * _Nullable error) {

        }];
    }
    else {
        // 保存图片并且更新界面
        NSURL * fileUrl = [self.cacheUrl URLByAppendingPathComponent:url.lastPathComponent];
        [data writeToURL:fileUrl atomically:YES];
        [self.WKWebView evaluateJavaScript:[NSString stringWithFormat:@"updateImage('%@', '%@')", url, fileUrl.absoluteString] completionHandler:^(id ret, NSError * error) {

        }];
    }
}] resume];
```

这样我们就可以动态的更新界面了，而且我们拥有自己创建的dom信息，那么我们可以做更多的事情:)

## 最后

这里讨论了两种把图片转为客户端下载的方式，如果要说如果这么做相当于客户端来编写网页了，还不如直接写原生的呢。但是这样做比原生更加灵活，可以应用不同模板，不同样式，就可以改变外观了。而且具体使用时也不一定需要这么死板的去创建dom，之后我会尝试下不同的方案来简化双方的FileURL实现。
