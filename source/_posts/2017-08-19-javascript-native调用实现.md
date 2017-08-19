---
title: javascript-native调用实现
date: 2017-08-19 22:54:55
categories:
- iOS
tags:
- javascript
- react-native
- JSWebviewBridge
---

在现在流行的多元框架中，最常见的就是JavaScript的应用了。这里就来分析下react-native的实现。

<!--more-->

react-native并不是只有一种实现。因为他不仅仅支持JavaScriptCore来实现交互，也考虑到了某些场景下需要使用WebView来实现，同时也有很多debug工具，需要将JavaScript的执行环境转移到浏览器。大概的结构如下：

```
 ------------------------------
|            native            |
 ------------------------------
               |
             bridge
               ⅴ
|------------------------------|
|            Executor          |
|------------------------------|
| JSContext | WebView | Chrome |
|------------------------------|
```

其中执行器部分（Executor）可随意替换为不同实现。这里我们来分析下JSContext中的实现。

## Module

要实现react-native这样大型的框架，javascript就不能被散乱的放置，那么就必须进行分模块。调用模块时需要使用CommonJS或者ES6的方式。

```js
var module = require('module')
import * as module from 'module'
```

同时也需要考虑到如此多的模块，一次性载入所带来的性能损耗，就必须采用惰性加载的方式。

## 队列

和其他项目的实现方式类似，react-native依然使用了message queue来实现通信，而不是JavaScriptCore自带的绑定功能，这是为了兼容上面说的多Executor。

与其他方案不太相同的是，react-native在`module`，`module-method`和`callback`都使用了`id: number`来取代名字，个人猜测可能是为了性能考虑。

那么我们就JSContext这种情况来说下整个通信实现的过程。

## 实现

这里使用`console`来作为例子，这里使用JavaScriptCore的c接口是为了和react-native保持一致，同时忽略了内存问题。

##### 模块表

观察发送给JSContext的数据发现会有很多类似这样的JSON数据：

```JSON
[
  "WebSocketModule",
  null,
  ["connect","send","sendBinary","ping","close","addListener","removeListeners"]
]
```

可以看出来，[0]表示的是module名字，而[2]表示的是module的方法，正式这一份表，才对应了javascript和native双方的indexId，所有的通信都是对应于这一份表来进行的。

所以双方都会有一份自己维护的模块，而js的模块表我们这里定义为

```js
// id => module 这是native调用js module时，传递的是id
var nativeModuleByIds = {}
// name => module 这是js调用js module时，传递的是name
var nativeModules = {}
```

##### 载入模块

在javascript端，如果需要载入模块，那么我们会使用

```js
var console = require('console')
```

那么在JSContext还没有console模块的情况下如何进行初始化呢？这里就需要一个`NativeRequire`，来载入native模块，结合上面的模块配置表，`require`的实现如下：

```js
var NativeRequire
function require(moduleName) {
    if (nativeModules[moduleName]) {
        return nativeModules[moduleName]
    }
    return NativeRequire(moduleName)
}
```

##### NativeRequire

在初始化JSContext时，我们就需要为通信做好连接的准备，直接注入3个方法。(这里react-native其实还有另外一个方式触发require，通过`nativeModuleProxy`对象的`getProperty`来触发，这里讨论最原始的`require`方式)

```c
JSClassDefinition definition = kJSClassDefinitionEmpty;
JSClassRef global = JSClassCreate(&definition);
g_ctx = JSGlobalContextCreate(global);
JSObjectRef globalObj = JSContextGetGlobalObject(g_ctx);

{
    JSStringRef name = JSStringCreateWithCFString(CFSTR("NativeRequire"));
    JSObjectRef obj = JSObjectMakeFunctionWithCallback(g_ctx, name, NativeRequire);
    JSObjectSetProperty(g_ctx, globalObj, name, obj, kJSPropertyAttributeNone, nil);
}
{
    JSStringRef name = JSStringCreateWithCFString(CFSTR("NativeFlushQueueSync"));
    JSObjectRef obj = JSObjectMakeFunctionWithCallback(g_ctx, name, NativeFlushQueueSync);
    JSObjectSetProperty(g_ctx, globalObj, name, obj, kJSPropertyAttributeNone, nil);
}
{
    JSStringRef name = JSStringCreateWithCFString(CFSTR("NativeFlushQueueAsync"));
    JSObjectRef obj = JSObjectMakeFunctionWithCallback(g_ctx, name, NativeFlushQueueAsync);
    JSObjectSetProperty(g_ctx, globalObj, name, obj, kJSPropertyAttributeNone, nil);
}
```

关于`NativeFlushQueueSync`和`NativeFlushQueueAsync`到下面再解释。

这里native的模块表就不实现了，直接使用`["console", null, ["log", "getName"], [1]]`。

```c
JSValueRef NativeRequire (
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception) {

    if (argumentCount == 1) {
        JSValueRef jsModuleName = arguments[0];
        if (JSValueIsString(g_ctx, jsModuleName)) {
            char buffer[128] = {0};
            JSStringGetUTF8CString(JSValueToStringCopy(g_ctx, jsModuleName, nil), buffer, 128);
            // 0. 当js调用"NativeRequire('console')"的时候
            // 1. 我们会在本地的模块表里根据名字去查找
            // 这里就简单的strcmp来表示
            if (strcmp(buffer, "console") == 0) {
                CFStringRef config = CFSTR("[\"console\", null, [\"log\", \"getName\"], [1]]");
                // 2. 构造js对应的模块表，这里的顺序必须和native是一一对应的
                // [ moduleName, constants, methods, async indexes ]
                JSValueRef jsonConfig = JSValueMakeFromJSONString(g_ctx, JSStringCreateWithCFString(config));
                JSObjectRef global = JSContextGetGlobalObject(g_ctx);
                JSValueRef genNativeModules = JSObjectGetProperty(g_ctx, global, JSStringCreateWithCFString(CFSTR("genNativeModules")), nil);
                JSValueRef args[] = {JSValueMakeNumber(g_ctx, ConsoleModuleId), jsonConfig};
                // call JS => genNativeModules(moduleId, config)
                // 3. 调用js，初始化native模块，将函数表中的string转换为function实现
                // 这里接下节
                JSValueRef module = JSObjectCallAsFunction(g_ctx, JSValueToObject(g_ctx, genNativeModules, nil), global, 2, args, nil);
                return module;
            }
        }
    }

    return JSValueMakeNull(g_ctx);
}
```

这里会同步调用初始化模块方法，并且将模块返回给JSContext。

但是可以发现模块表中的方法都是string，也就是方法名，我们如何去使用`console.log()`这样的方法呢？这里就需要中间的初始化模块这个作用了。

##### 初始化模块

回到上节的第三步，此时native传给js一个模块表，让js去构造这个模块。让我们回到js：

```js
function genNativeModules(moduleId, config) {
    let [name, constants, methods, asyncs] = config

    let module = {}
    // 这里将所有的方法名都转换为function
    methods.forEach(function(method, methodId) {
      module[method] = function (args) {
          // call native flush
      }
    }, this);

    nativeModules[name] = module
    nativeModuleByIds[moduleId] = module
    return module
}
```

这样便把string转换为function了，可以像正常的js方法那样使用了。

到这里注册js模块已经完成，下面来说说调用的过程。

##### 同步方法的调用

同步方法的调用对于JSContext来说会简单很多，而对于很多基于webview的实现来说就会麻烦一些，因为参数不能直接编码在url中，最后我们来讨论下这个问题。

上节说到将方法名转换为function，那么function具体实现是怎么样的呢？

首先来看看同步方法的实现：

```js
module[method] = function (args) {
    return NativeFlushQueueSync(moduleId, methodId, ...args)
}
```

这里的`NativeFlushQueueSync`方法就是一开始我们注入的方法，作用是执行对应模块的对应方法。

```c
JSValueRef NativeFlushQueueSync (
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception) {

    if (argumentCount == 3) {
        // 这里通过查找native的模块表，查找到对应的方法，并执行
        if (JSValueIsNumber(g_ctx, arguments[0]) && JSValueIsNumber(g_ctx, arguments[1])) {
            if (JSValueToNumber(g_ctx, arguments[0], nil) == ConsoleModuleId) {
                if (JSValueToNumber(g_ctx, arguments[1], nil) == 0) {
                    // call Native <= console.log
                    if (JSValueIsString(g_ctx, arguments[2])) {
                        // console.log转换为NSLog
                        NSString *str = (__bridge NSString *)JSStringCopyCFString(NULL, JSValueToStringCopy(g_ctx, arguments[2], nil));
                        NSLog(@"%@", str);
                    }
                }
            }
        }
    }

    return JSValueMakeNull(g_ctx);
}
```

然而react-native并没有完全严格上的同步执行方法。因为很多调用UI层的功能必须在主线程上，而JSContext是在自己的线程中执行，所以如果需要严格的同步执行，需要阻塞JS线程。而几乎所有功能都是不需要执行结果的（return void），所以只要触发native去执行该方法就行了，无需等待执行完再返回。而需要有返回值的接口都被设计成异步的了。

##### 异步回调

说到异步回调，大家用的方案好像都是一样的，那就是`callbackId`。

```js
var messageQueue = {}
var messageQueueId = 0
function JsMessageQueueAdd(args) {
    messageQueueId ++
    messageQueue[messageQueueId] = args
    return messageQueueId
}

function JsMessageQueueFlush(queueId, args) {
    let callback = messageQueue[queueId]
    if (callback && typeof(callback) === 'function') {
        callback(args)
    }
}
```

创建异步module方法的方式会有点不一样：

```js
module[method] = function (args) {
    let queueId = JsMessageQueueAdd(args)
    NativeFlushQueueAsync(moduleId, methodId, queueId)
}
```

然后来看看native的实现：

```c
JSValueRef NativeFlushQueueAsync (
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception) {

    if (argumentCount == 3) {
        if (JSValueIsNumber(g_ctx, arguments[0]) && JSValueIsNumber(g_ctx, arguments[1])) {
            if (JSValueToNumber(g_ctx, arguments[0], nil) == ConsoleModuleId) {
                if (JSValueToNumber(g_ctx, arguments[1], nil) == 1) {
                    // call Native <= console.getName
                    JSValueRef queueId = arguments[2];
                    NSInteger queueIdCopy = JSValueToNumber(g_ctx, queueId, nil);
                    dispatch_async(dispatch_get_main_queue(), ^{
                        JSObjectRef global = JSContextGetGlobalObject(g_ctx);
                        JSValueRef flush = JSObjectGetProperty(g_ctx, global, JSStringCreateWithCFString(CFSTR("JsMessageQueueFlush")), nil);
                        JSValueRef args[] = {
                            JSValueMakeNumber(g_ctx, queueIdCopy), // callback queueId
                            JSValueMakeString(g_ctx, JSStringCreateWithCFString(CFSTR("My iPhone")))
                        };
                        // call JS => JsMessageQueueFlush(queueId, args)
                        JSObjectCallAsFunction(g_ctx, JSValueToObject(g_ctx, flush, nil), nil, 2, args, nil);
                    });
                }
            }
        }
    }
    return JSValueMakeNull(g_ctx);
}
```

可以看到和同步方式的区别是就是回调会缓存在队列里。

##### 应用

```js
var console = require('console')
console.log('Hello Javascript!')

console.getName(function (name) {
    console.log(`Hello ${name}`)
})
```

```
// output:
Hello Javascript!
Hello My iPhone
```

##### 装饰

实际情况不会这么简单，js也不会直接使用native提供的模块的，一般会包装一层。比如像这样

```js
var nativeLog = NativeRequire('NSLog')
var console = {
  log: (args) => NSLog(args),
  info: (args) => NSLog('[INFO]', ...args),
  error: (args) => NSLog('[ERROR]', ...args)
}
export default console
```

## 实际

真实情况不会像上面那么简单，需要考虑到多线程，每个module的运行线程，js消息队列等保证js的安全顺序执行。

## WebView

其他项目的方案也是类似的，但也有少许的不同。

比如NativeRequire，在Web里面除了通过iframe来实现，还可以通过`script`标签来导入模块文件。

```js
var script = document.createElement('script')
script.setAttribute('src', 'file://module.js')
document.head.appendChild(script)
```

同时由于web通过url传递参数的限制，所以web的参数传递是通过native去主动拉取的。大概的流程如下：

```
[web] call native --> push <call info> --(iframe url)-->
[native] get <call info> --(executeJs)-->
[web] pop <call info> -->
[native] call ***
```

同时很多方案，会使用名字来传递模块和方法，这样做最简单也最直接。但是如果存在频繁交互的过程可能会降低性能。

## 最后

总的来说，javascript-native交互还是挺简单的，只要在初始的设计上比较符合现在与未来的发展，还是可以做到很灵活的。至于使用哪种方案，做到什么样的程度，可以依据自身的需求来判断。
