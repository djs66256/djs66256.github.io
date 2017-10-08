---
title: 开源项目列表-iOS & mac
date: 2012-07-17 01:57:37
categories:
- 开源项目
tags:
---

收藏的开源项目以及部分分析。

<!--more-->

# AVPlayer
- [ZFPlayer](https://github.com/renzifeng/ZFPlayer.git)
- [StreamingKit](https://github.com/tumtumtum/StreamingKit)
- [LFLiveKit](https://github.com/LaiFengiOS/LFLiveKit.git) 视频流
- [TTAVPlayer](https://github.com/tangdiforx/TTAVPlayer)
- [CTVideoPlayerView](https://github.com/casatwy/CTVideoPlayerView)
- [EZAudio](https://github.com/syedhali/EZAudio)

# Cache
- **[YYCache](https://github.com/ibireme/YYCache.git)**

使用了LRU策略

内存缓存使用了线性链表+NSDictionary来实现，由于LRU的特性，插入永远在开始，而删除永远在结尾，所以拥有较高的性能。但是查找还是依赖于hash表来实现。

磁盘缓存使用了sqlite来保存文件缓存信息（filename, last_modify_time)，所以在读写小数据的时候（20KB）会直接在sqlite中读写，而不会生成一个独立的文件。所以在小文件和未命中的情况下效率会高很多。而读写大文件时，效率会降低一些，考虑到sqlite的缓存和执行，并不会降低太多。由于sqlite对时间创建了索引，所以在缓存过期查找上面会优秀一些。这种设计解决了小文件和未命中的效率问题，但是并不能实现高并发读写文件。

- **[PINCache](https://github.com/pinterest/PINCache.git)**

使用了大量的Lock来处理读写，拥有异步读写接口，没有太多的特别优化。

磁盘缓存单纯使用了文件缓存，在初始化的时候就把整个目录及其元素的属性读到内存，来提高效率，但是使用的是数组存储，效率一般。

- **[SPTPersistentCache](https://github.com/spotify/SPTPersistentCache.git)**

利用CRC32来校验文件，据说速度较快。

他将数据信息通过memory map的方式写到了文件头部，说是为了并发读写，但这也时每次更新updateTime需要写整个文件，这样必定会导致性能降低。个人建议还是把文件信息写到另一个文件中，方便内存缓存。

- **[OSCache](https://github.com/nicklockwood/OSCache.git)**

一个模仿NSCache的实现，内部使用NSDictionary。

- **[Haneke](https://github.com/Haneke/Haneke.git)**

他和SDWebImage非常相似，个人看来，这个的代码及其结构会比SD好一些，但是功能太有限，就像作者自己说的是一个轻量级的实现。

- **[SDWebImage](https://github.com/rs/SDWebImage.git)**

实现功能非常完善，是目前最好用的一个图片缓存库了。但是也有几个小问题。

图片读取全部在一个子线程中进行，在高并发读取的时候会阻塞线程，同样下载和解码也会有类似的问题。

图片的二次处理能力不够（比如手动加圆角，裁剪，滤镜），好在目前大部分工作CDN都会帮我们做掉。

预加载图片无法和正常加载使用同一套机制，预加载和正常加载如果同时触发会加载2次。

在扩展方法的时候，直接在UI组件上添加方法，这就导致了每次引入新特性的时候都需要增加一个系统类的扩展（比如UIImage），更好的方式应该是暴露一个代理对象：

```objc
[view sd_setImageUrl:url];
// 改为这样会更好一点
[view.sd setImageUrl:url];
```

- **[FastImageCache](https://github.com/path/FastImageCache.git)**

该作者认为效率问题主要出现在图片从磁盘读取到内存，再进行解压，以及渲染前的内存拷贝。解决这类问题的最好方法就是进行memory map，作者也指出了这种方式会导致一张高压缩率的图片，进行内存映射后会变得很大这一非常大的缺陷。

```c
void *mmap(void *start, size_t length, int prot, int flags, int fd, off_t offset);
int msync(void *addr, size_t len, int flags)
int munmap(void *start, size_t length);
```

作者将图片按照图片size，rgba等信息进行分类，分别存储于不同的image table里面，同一个table里面会依次写入多张图片信息。但是这样会导致一个table过于庞大，而作者也没有给出非常好的过期策略以及删除部分缓存的策略。

作者将图片元信息metadata存储于另一个文件中，可惜的是使用了json序列化，导致每次更新必须全量更新，在数据量庞大的时候可能会产生性能问题吧。

这并不适用于大量图片以及图片尺寸较多的场景，但是可以用于部分频繁设置image的场景。

# Component
- **[HubFramework](https://github.com/spotify/HubFramework.git)**

也是一款拆分CollectionView的设计，个人认为拆分的太细了，导致整个系统过于复杂，学习成本太高。

- **[BeeHive](https://github.com/alibaba/BeeHive.git)** alibaba

将客户端的架构和服务端service结合，从而实现整个app的组件化。本身服务端和客户端在很多方面就不一样，需要更多的情景考虑。他的实现在有些场景还是不够的灵活，但是其思想可以借鉴下。

- **[IGListKit](https://github.com/Instagram/IGListKit)**

事件驱动的collectionView组件化封装。具体参考[IGListKit简析与DDComponent](/2017/05/23/2017-05-23-IGListKit分析/)

- **[componentkit](https://github.com/facebook/componentkit)**

类似于React方式，使用component来布局UI。完全颠覆了传统的架构和编码方式，学习成本高。项目复杂，由objective-C++编写，利用了大量隐式转换的特性，所以不适用于swift。

# Crash Report
- [KSCrash](https://github.com/kstenerud/KSCrash.git)

# Encrypt
- **[MIHCrypto](https://github.com/hohl/MIHCrypto)**

非常全面的加密库。

# Markdown
- [CocoaMarkdown](https://github.com/indragiek/CocoaMarkdown.git)
- [MMMarkdown](https://github.com/mdiep/MMMarkdown.git)
- [macdown](https://github.com/MacDownApp/macdown.git)

# Kit
- **[AppDevKit](https://github.com/yahoo/AppDevKit.git)**

一些扩展，用处不大。

- **[YYKit](https://github.com/ibireme/YYKit.git)**

包含了很多util方法，以及cache，image，text，json2model方面的类库。

- **[EasyIOS](https://github.com/zhuchaowe/EasyIOS.git)**

没有参考价值

- **[BlocksKit](https://github.com/zwaldowski/BlocksKit.git)**

可以将他的功能归为两类：

1, sequence，swift中自带的概念，和reactive的概念一致，是一种流式的写法。
2, 动态delegate，实现动态delegate的转换，从而实现了大量UI层的回调简化。

功能比较多，除了sequence和UI层的事件外，还有associate object、perform以及KVO（和KVOController类似）。如果是objc开发，可以考虑使用。

- **[Bolts-ObjC](https://github.com/BoltsFramework/Bolts-ObjC.git)**

主要提供了两个工具：

1, Task，类似于promise，以及reactive，个人觉得不如另外两者。
2, AppLink，一种多平台兼容的跳转方案，同时兼容native和web等，应用面会比MGJRouter这种广一点，但实现上不是非常的完善和通用。

- **[QMUI_iOS](https://github.com/QMUI/QMUI_iOS)**

一套非常完善的UI组件库，设计也比较精美，出自腾讯团队。本人认为他也有几个的缺点，那就是利用了大量的Runtime特性，导致很多系统方法都被hook了，这可能会带来某些隐患。由于很多方法都是在系统类上加的，所以api并不是很美观，总是有`qmui_`这样的前缀。同时hook了UI层的东西，所以如果使用原生的组件也势必会带上一些QMUI的东西。

NavigationBar交互动画的修正采用的是在`controller.view`上加上一个只设置了背景的`navigationBar`，同时隐藏原生的`navigationBar`来实现。相比于另一种使用`navigationController`再套一层每个`controller`，从而让每个`controller`的`navigationBar`相互独立，本人认为QMUI的方式更加优秀，影响面更加小，毕竟不会影响到整个controller的栈结构。

# Util
- **[YOLOKit](https://github.com/mxcl/YOLOKit.git)**

一个类似于reactive中sequence的工具类，建议直接使用Reactive。

- **[libextobjc](https://github.com/jspahrsummers/libextobjc)**

非常有名的几个宏定义的出处，对宏的理解和运用都非常厉害，但是平常经常使用的也就那么几个。

```objc
@strongify()
@weakify()
@onExit{}
```

# Data
- **[json-framework](https://github.com/stig/json-framework.git)**

原来的SBJson，建议使用系统方法。

- **[jsonmodel](https://github.com/jsonmodel/jsonmodel.git)**

JSON转model，缺点是必须继承于JSONModel基类。

- **[ReactiveViewModel](https://github.com/ReactiveCocoa/ReactiveViewModel.git)**

增加了active事件，没什么用。

- **[RestKit](https://github.com/RestKit/RestKit.git)**

包括了网络请求，json转model，以及到core data，如果有这些方面的需求可以尝试下。

- **[JSONKit](https://github.com/johnezang/JSONKit.git)**

建议使用系统方法。

- **[Mantle](https://github.com/Mantle/Mantle.git)**

JSON转model，但是要继承于基类。

- **[Doppelganger](https://github.com/Wondermall/Doppelganger)** Array diffs as collection view wants it

一个diff工具，用于CollectionView的reload。

- **[Diff.swift](https://github.com/wokalski/Diff.swift)** **794 Stars** **Swift** The fastest Diff and patch library in Swift. Includes UICollectionView/UITableView utils.

也是一个CollectionView reload的diff工具。

- **[OrderedDictionary](https://github.com/nicklockwood/OrderedDictionary)**

有序字典，意义是？

- **[FastCoding](https://github.com/nicklockwood/FastCoding)**

自动NSCoding，还不是特别通用。

- **[AutoCoding](https://github.com/nicklockwood/AutoCoding)**

利用获取property来自动NSCoding。

### KVO
- **[RZDataBinding](https://github.com/Raizlabs/RZDataBinding)**

对象绑定思想也是使用associate object，同时也hook了dealloc。但是很多地方使用了assign而不是weak。不推荐使用

他提出一个事务的概念，将众多变更一次性提交，但好像没什么太大的意义。

- **[KVOController](https://github.com/facebook/KVOController.git)**

FB出品，使用associate object管理内存和负责移除KVO，非常良好的实现方式，推荐使用这个。

- **[HTBKVObservation](https://github.com/thehtb/HTBKVObservation)**

hook dealloc来负责移除，需要自己来保证observation的生命周期，使用上不如FB的方便。

- **[MAKVONotificationCenter](https://github.com/mikeash/MAKVONotificationCenter)**

hook dealloc来负责移除监听。

# DB
- **[YTKKeyValueStore](https://github.com/yuantiku/YTKKeyValueStore.git)**

利用sqlite做的一个简单的KV存储。

- **[YapDatabase](https://github.com/yapstudios/YapDatabase.git)**

利用sqlite做的一个KV存储，会保存数据元信息和对象间的关系，优化了多线程读写。

- **[realm-cocoa](https://github.com/realm/realm-cocoa.git)**

和sqlite一样，也是一种关系型数据库（这里讨论本地的realm）。

数据保存方式为内存映射，按照realm的说法是sqlite在读取保存数据时候会产生内存拷贝而影响性能。

数据按照列（column）来保存，每一列的数据格式是固定的，在查找效率上也会提升。同时列拥有不同的chunk来同步到磁盘，这样在读写的时候可以只锁定目标chunk而达到高并发读写。

数据结构实现为B+树，与sqlite使用的B树不同，B+树保证了叶子节点存储的连续性。

- [CoreObject](https://github.com/etoile/CoreObject.git) with version control
- [ensembles](https://github.com/drewmccormack/ensembles.git) A synchronization framework for Core Data.
- [MagicalRecord](https://github.com/magicalpanda/MagicalRecord.git) Super Awesome Easy Fetching for Core Data
- **[fmdb](https://github.com/ccgus/fmdb.git)**

sqlite的轻量级封装，缺少ORM，但是也非常简单，容易debug。在少量场景的情况下推荐使用。

- [sequelpro](https://github.com/sequelpro/sequelpro)
- [GYDataCenter](https://github.com/Zepo/GYDataCenter)

- **[sqlcipher](https://github.com/sqlcipher/sqlcipher)**

SQLCipher is an SQLite extension that provides 256 bit AES encryption of database files.

- **[wcdb](https://github.com/Tencent/wcdb)**

微信封装的sqlite ORM。支持多线程和数据修复，支持数据加密，用接口的方式强制格式化sql语句，功能比较强大，缺点是必须使用c++来实现其model，实现也较为复杂。如果在这方面需求量不大的情况下，没有必要迁移。

其sql拼装是字符串累加，而不是从语法树生成，所以必须依赖底层sqlite的存储方式。

- **[rocksdb](https://github.com/facebook/rocksdb)** **8645 Stars** **C++** A library that provides an embeddable, persistent key-value store for fast storage.

基于leveldb，对齐进行了多线程以及ssd的优化。

- **[leveldb](https://github.com/google/leveldb)** **10957 Stars** **C++** LevelDB is a fast key-value storage library written at Google that provides an ordered mapping from string keys to string values.

是基于Google的big data实现的一套KV存储，原理简单的说就是每次操作（增删改），都是生成一条数据，存入文件，在一定的条件下，会对这些文件进行merge操作，来保证文件的大小。这种方案解决了高并发写的问题，但是增加了读的开销，是一种折中方案。在移动端的场景下好像没有这么高的并发写场景，应该没有必要使用。

数据结构使用跳跃链表（skip list）来实现，他比B/B+数的实现简单，同时也有不错的性能。

# Notes
- [iOS-Source-Code-Analyze](https://github.com/Draveness/iOS-Source-Code-Analyze.git) 笔记
- [trip-to-iOS](https://github.com/Aufree/trip-to-iOS.git)
- [ParseSourceCodeStudy](https://github.com/ChenYilong/ParseSourceCodeStudy.git)
- [iOSInterviewQuestions](https://github.com/ChenYilong/iOSInterviewQuestions.git) iOS面试题集锦
- [iOSBlogCN](https://github.com/tangqiaoboy/iOSBlogCN.git)
- [TomatoRead](https://github.com/everettjf/TomatoRead.git)
- [idev-recipes](https://github.com/boctor/idev-recipes)
- [IosHackStudy](https://github.com/pandazheng/IosHackStudy) IOS安全学习资料汇总
- [The-Art-Of-Programming-By-July](https://github.com/julycoding/The-Art-Of-Programming-By-July)
- [Apple-OfficialTranslation-SourceAnnotation](https://github.com/CustomPBWaters/Apple-OfficialTranslation-SourceAnnotation)
- [Halfrost-Field](https://github.com/halfrost/Halfrost-Field)
- [idev-recipes](https://github.com/boctor/idev-recipes)

# Network
- [AFNetworking](https://github.com/AFNetworking/AFNetworking.git)
- [NSURLProtocol-WebKitSupport](https://github.com/yeatse/NSURLProtocol-WebKitSupport.git)
- [WebViewProxy](https://github.com/marcuswestin/WebViewProxy.git)
- [MMLanScan](https://github.com/mavris/MMLanScan.git) 网络质量检测
- [DFImageManager](https://github.com/kean/DFImageManager.git) Image loading, processing, caching and preheating
- [Nuke](https://github.com/kean/Nuke.git) swift of [DFImageManager](#DFImageManager)
- [OHHTTPStubs](https://github.com/AliSoftware/OHHTTPStubs.git)
- [RTNetworking](https://github.com/casatwy/RTNetworking)
- [CocoaSPDY](https://github.com/twitter/CocoaSPDY)
- [RealReachability](https://github.com/dustturtle/RealReachability)
- [XMNetworking](https://github.com/kangzubin/XMNetworking)
- [fastsocket](https://github.com/fastos/fastsocket)

# In-App Purchase
- [CargoBay](https://github.com/mattt/CargoBay.git)

# Objc Runtime
- **[jrswizzle](https://github.com/rentzsch/jrswizzle.git)**

Method swizzling

- **[MAZeroingWeakRef](https://github.com/mikeash/MAZeroingWeakRef.git)**

MRC时代的weak实现，可以作为参考。

- **[Aspects](https://github.com/steipete/Aspects.git)**

一个比较全面的hook库，一般用于测试。

- **[DLIntrospection](https://github.com/garnett/DLIntrospection)**

runtime方法的objc封装。

- **[fishhook](https://github.com/facebook/fishhook)**

用来hook C方法。

- **[JSPatch](https://github.com/bang590/JSPatch)**

非常有名的利用js来动态hook的库。主要通过将`:`转换为`_`来实现函数签名的通用，同时格式化js代码，使`.`调用变为`.__c()`的方法调用。

和其他（react-native等）的思想不同，不会收集oc的方法签名，然后转到js中生成函数，使用的是修改js代码的方式，但会让debug变得困难，个人更倾向于react-native这种方式。


# Socket
- [CocoaAsyncSocket](https://github.com/robbiehanson/CocoaAsyncSocket.git)

## Web Socket
- [SocketRocket](https://github.com/facebook/SocketRocket.git)
- [AZSocketIO](https://github.com/lukabernardi/AZSocketIO.git) socket.io

# Template
- [GRMustache](https://github.com/groue/GRMustache.git)
- [CoreParse](https://github.com/beelsebob/CoreParse.git)

# Theme
- **[DKNightVersion](https://github.com/Draveness/DKNightVersion.git)**

一种换肤框架实现，缺点也非常多，支持的属性也比较少，本人实现了一个更加简单完善的版本[DDSkin](https://github.com/djs66256/DDSkin)

- [Tweaks](https://github.com/facebook/Tweaks.git)

# Util
- [NSDate-TimeAgo](https://github.com/kevinlawler/NSDate-TimeAgo.git)

NSDate的Helper类，比较简单。

- [DateTools](https://github.com/MatthewYork/DateTools.git)

NSDate的Helper类，比较全面。

----

# Router

- **[routable-ios](https://github.com/clayallsopp/routable-ios)**
- **[HHRouter](https://github.com/lightory/HHRouter)**
这两个都是类似的实现，比较简单。

- **[JLRoutes](https://github.com/joeldev/JLRoutes)**
脱离UIKit，非常好用的一个实现，据说性较低，没有实际验证过。

- **[MGJRouter](https://github.com/meili/MGJRouter)**
蘑菇街的实现，算法经过优化的JLRoutes，实际没有验证过。

- **[CTMediator](https://github.com/casatwy/CTMediator)**
使用中间人来解决路由系统，使用target-action方式注册行为，

# Hybrid

- **[Framework7](https://github.com/nolimits4web/Framework7)**

一款模仿ios和android原生特性的h5组件库，效果来看很不错，可以使用vue和react，如果是写纯网页应用可以考虑使用这个。

- **[ReactNative](https://github.com/facebook/react-native)**

1.4k贡献者，社区非常活跃，目前最热门的方案。拥有非常完善的debug方式以及各种工具，同时React的发展也特别的好。可以完成整个app的功能，也可以作为app的一部分嵌入使用。首推。

大部分组件可以支持iOS和Android，也有很多定制化的组件，所以有些时候需要区分平台来写，也不能无缝降级h5。

- **[weex](https://github.com/apache/incubator-weex)**

和react-native竞争的产品，由阿里出品。框架会比react-native小一点，但功能也会少很多，排版是受阉割的flex，和官方所说的无缝降级h5有出入。一份代码能够同时在iOS和Android上运行，但为了统一也失去了很多的系统特性，感觉没有官方吹的那样厉害。

- **[PhoneGap]**
cordova的商业版

- **[WebViewJavascriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge.git)**

webView中js与native交互的库。一种简单的实现，如果需要更复杂的实现可以使用cordova。

- **[cordova](https://github.com/ionic-team/ng-cordova)**

利用webview js和native的通信实现web端调用native方法。

原理和JSWebviewBridge类似，利用的都是iframe和messageQueue，require组件是直接在head中插入script实现，不知道在组件变多的情况下是否会影响性能，考虑到lazy load的情况，可能会好一点。

组件需要自己根据需要添加，组件比较全面，该有的都有。

但是iOS端是基于UIWebView实现的，不知什么时候能够替换成WKWebView，来提升性能。

- **[code-push](https://github.com/Microsoft/code-push)**

基于cordova和react的云端服务

- **[BeeFramework](https://github.com/gavinkwoe/BeeFramework)**

利用xml来实现布局，目前已经废弃。

- **[samurai-native](https://github.com/hackers-painters/samurai-native)**

利用css和html来实现布局和事件绑定，但是实现还是需要原生代码，所以不能独立的去实现一个页面的功能。

- **[VasSonic](https://github.com/Tencent/VasSonic)**

腾讯的加速web载入速度的库，原理其实就是客户端增加native缓存管理，减少获取某些静态文件的请求时间。

iOS版依赖于NSURLProtocol，是基于UIWebView实现的，不能支持WKWebView。

其中获取js运行上下文用了黑科技。

```
[self.webView valueForKeyPath:@"documentView.webView.mainFrame.javaScriptContext"];
```

- **[ionicframework](https://ionicframework.com)**

基于cordova的一款h5组件库，效果很不错，增加完善了很多native组件，使用的是Angular

- **[mobileangularui](http://mobileangularui.com/)**

也是一个UI组件库

- **[Tangram-iOS](https://github.com/alibaba/Tangram-iOS)**

阿里首页的实现方式，可以认为是一种模板技术，需要客户端开发业务模板，用在业务比较稳定的场景，局限性较大，但是版本更新成本较低，维护成本低。平时设计接口的时候可以参照这种模板方式来配置。

- **[JASONETTE-iOS](https://github.com/Jasonette/JASONETTE-iOS)**

可以认为是一种完整的DSL，功能还是挺强大的，列表使用UITableView，布局系统使用UIStackView，因此也有很大的局限性。

同时编辑JSON文件也是非常麻烦的事情，没有很好的工具可以支持。不太推荐使用，除非支持更灵活的布局和编辑。

# UI

# Image

- **[GPUImage](https://github.com/BradLarson/GPUImage.git)**

利用OpenGL来处理图片，需要对OpenGL比较熟悉，会写GLSL，熟悉图片处理才能创建自己的filter。


# animation

- **[Keyframes](https://github.com/facebookincubator/Keyframes.git)**

功能类似于Lottie。

- **[lottie-ios](https://github.com/airbnb/lottie-ios)**

利用AE生成JSON文件来简化交互动画的编写。

- **[AHEasing](https://github.com/warrenm/AHEasing.git)**

多种时间函数实现。

- **[popping](https://github.com/schneiderandre/popping.git)**

依靠CADisplayLink来达到高帧率的动画效果。但是太依赖CPU，所以性能不一定比CA优秀。一般情况下感觉不太需要他来做动画。

- **[RBBAnimation](https://github.com/robb/RBBAnimation.git)**

一种动画的封装，意义不大。

- **[Canvas](https://github.com/CanvasPod/Canvas.git)** Animate in Xcode without code

将动画集成到了View中，感觉没什么必要。

- **[YapAnimator](https://github.com/yapstudios/YapAnimator)**

和popping原理类似，使用CADisplayLink，实时去修改视图属性。
```swift
YapAnimator(initialValue: square.frame, willBegin: { [unowned self] in
	return self.square.frame
}, eachFrame: { [unowned self] (animator) in
	self.square.frame = animator.current.value
})
```
看似比popping简单点，但是popping是模仿CoreAnimation做的，所以没有可比性。建议使用popping。

- **[CRAnimation](https://github.com/CRAnimation/CRAnimation)**

一系列的动画效果。

## ActionSheet & Menu
- **[JGActionSheet](https://github.com/JonasGessner/JGActionSheet.git)**

![](https://github.com/JonasGessner/JGActionSheet/raw/master/JGActionSheet%20Tests/Screenshots/1.png)
![](https://github.com/JonasGessner/JGActionSheet/raw/master/JGActionSheet%20Tests/Screenshots/2.png)

- **[JTSActionSheet](https://github.com/jaredsinclair/JTSActionSheet.git)**

![](https://raw.githubusercontent.com/jaredsinclair/JTSActionSheet/master/jtsactionsheet.png)

- **[AHKActionSheet](https://github.com/fastred/AHKActionSheet.git)**

![](https://raw.githubusercontent.com/fastred/AHKActionSheet/master/example.gif)

- **[AMPopTip](https://github.com/andreamazz/AMPopTip.git)**

![](https://raw.githubusercontent.com/andreamazz/AMPopTip/master/assets/screenshot.gif)

- **[MMPopLabel](https://github.com/mgcm/MMPopLabel.git)**

![](https://raw.githubusercontent.com/mgcm/MMPopLabel/master/Assets/MMPopLabel-1.png)

- **[FTPopOverMenu](https://github.com/liufengting/FTPopOverMenu.git)**

![](https://raw.githubusercontent.com/liufengting/FTResourceRepo/master/Resource/FTPopOverMenu/screenshots.gif)

- **[CMPopTipView](https://github.com/chrismiles/CMPopTipView.git)**

![](https://camo.githubusercontent.com/d953577314aafa7c65d1eb3b15f7fd73c9946d1e/687474703a2f2f6661726d352e7374617469632e666c69636b722e636f6d2f343030352f353139313634313033305f326239336134613535392e6a7067)

- **[CRToast](https://github.com/cruffenach/CRToast.git)**

![](https://github.com/cruffenach/CRToast/raw/master/screenshots/demo.gif)

- **[GHContextMenu](https://github.com/GnosisHub/GHContextMenu.git)**

path style menu
![](https://github.com/GnosisHub/GHContextMenu/raw/master/cmocv.gif)

- **[AwesomeMenu](https://github.com/levey/AwesomeMenu.git)**

path style menu

## Animation 各种动画
- **[CBStoreHouseRefreshControl](https://github.com/coolbeet/CBStoreHouseRefreshControl.git)**

![](https://s3.amazonaws.com/suyu.test/CBStoreHouseRefreshControl1.gif)

- **[ZLSwipeableView](https://github.com/zhxnlai/ZLSwipeableView.git)**

![swipe](https://github.com/zhxnlai/ZLSwipeableView/raw/master/Previews/swipe.gif)

- **[YLLongTapShare](https://github.com/liyong03/YLLongTapShare.git)**

![](https://github.com/liyong03/YLLongTapShare/raw/master/joy.gif)

- **[VBFJellyView](https://github.com/victorBaro/VBFJellyView.git)**

![](https://camo.githubusercontent.com/b0f5afe69dc6620e2f81f447345a67418d107933/68747470733a2f2f6431337961637572716a676172612e636c6f756466726f6e742e6e65742f75736572732f3338313133332f73637265656e73686f74732f313639343335382f7662666a656c6c79766965772e676966)

- **[TinderSimpleSwipeCards](https://github.com/cwRichardKim/TinderSimpleSwipeCards.git)**

![](https://camo.githubusercontent.com/cd6977c1efbd029aa0271a5b9266397c2b910da2/687474703a2f2f696d6775722e636f6d2f7758506e664e322e676966)

- **[CrossNavigation](https://github.com/artemstepanenko/CrossNavigation.git)**

不同方向的转场动画
![](https://github.com/artemstepanenko/CrossNavigation/raw/master/README%20Graphics/demo_storyboard.gif)

- **[FastAnimationWithPOP](https://github.com/WilliamZang/FastAnimationWithPOP.git)**

![](https://raw.githubusercontent.com/WilliamZang/FastAnimationWithPOP/master/Docs/demo.gif)

- **[CXCardView](https://github.com/ChrisXu1221/CXCardView.git)**

![](https://github.com/ChrisXu/CXCardView/raw/master/demo2.gif)

- **[ICGTransitionAnimation](https://github.com/itsmeichigo/ICGTransitionAnimation.git)**

![](https://raw.githubusercontent.com/itsmeichigo/ICGTransitionAnimation/master/Demo.gif)

- **[ZFDragableModalTransition](https://github.com/zoonooz/ZFDragableModalTransition.git)**

![](https://raw.githubusercontent.com/zoonooz/ZFDragableModalTransition/master/Screenshot/ss.gif)

- **[ESConveyorBelt](https://github.com/escoz/ESConveyorBelt.git)**

开机启动画面方案，有点像ppt的动画方案
![](https://raw.githubusercontent.com/escoz/ESConveyorBelt/master/ESConveyorBelt.gif)

- **[EAIntroView](https://github.com/ealeksandrov/EAIntroView.git)**

启动引导页方案，样式比较固定
![](https://raw.githubusercontent.com/ealeksandrov/EAIntroView/master/Screenshot01.png)

- **[URBMediaFocusViewController](https://github.com/u10int/URBMediaFocusViewController.git)**

一个图片全屏展示的方案，问题多多。

- **[RQShineLabel](https://github.com/zipme/RQShineLabel.git)**

![](https://raw.githubusercontent.com/zipme/RQShineLabel/master/Screenshots/rqshinelabel.gif)

- **[AMWaveTransition](https://github.com/andreamazz/AMWaveTransition.git)**

![](https://raw.githubusercontent.com/andreamazz/AMWaveTransition/master/assets/screenshot.gif)

- **[SCSiriWaveformView](https://github.com/stefanceriu/SCSiriWaveformView.git)**

![](https://camo.githubusercontent.com/3c2fdd91d129aa57622d9acb8a6fec4a20a1d050/68747470733a2f2f64726976652e676f6f676c652e636f6d2f75633f6578706f72743d646f776e6c6f61642669643d3042794c436b554f39306c746f53566c6f4c58524b5343314462456b)

- **[AnimatedTransitionGallery](https://github.com/shu223/AnimatedTransitionGallery.git)**

大量页面切换的动效。
![](https://github.com/shu223/AnimatedTransitionGallery/raw/master/gif/gallery.gif)

- **[MDCSwipeToChoose](https://github.com/modocache/MDCSwipeToChoose.git)**

![](https://camo.githubusercontent.com/07a54fcf8ab7a955c22e58168178a91f800eecb8/687474703a2f2f636c2e6c792f696d6167652f304d316a314a3045307333472f4d44435377697065546f43686f6f73652d76302e322e302e676966)

- **[RPSlidingMenu](https://github.com/RobotsAndPencils/RPSlidingMenu.git)**

![](https://camo.githubusercontent.com/79db989540f237a3e0b43a7df8f0645910c33804/687474703a2f2f662e636c2e6c792f6974656d732f3150306c315830443062326b314333543243326f2f323031342d30332d313425323031315f33395f33362e676966)

- **[BRFlabbyTable](https://github.com/brocoo/BRFlabbyTable.git)**

![](https://camo.githubusercontent.com/be91b8bb8106725590a370646997ba1a83d7d387/687474703a2f2f692e696d6775722e636f6d2f466c3930724c6d2e706e67)
![](https://camo.githubusercontent.com/aaacbd03c84ecf1148933955a0c94dbaae78a411/687474703a2f2f692e696d6775722e636f6d2f304b6855684d4e2e706e67)

- **[SVGKit](https://github.com/SVGKit/SVGKit)**

web svg在iOS端的实现，挺有意思。

- **[KMCGeigerCounter](https://github.com/kconner/KMCGeigerCounter)**

一个点击音效。

- **[POP-MCAnimate](https://github.com/matthewcheok/POP-MCAnimate)**

基于POP的动画扩展。

#### Button

- **[DownloadButton](https://github.com/PavelKatunin/DownloadButton.git)**

![](https://cloud.githubusercontent.com/assets/1636737/7921348/7fadc250-08ad-11e5-9f01-9f7e1f173a97.gif)
![](https://cloud.githubusercontent.com/assets/1636737/7920830/2c4470da-08aa-11e5-99be-e7e9a04479f8.png)

- **[IGLDropDownMenu](https://github.com/bestwnh/IGLDropDownMenu.git)**

可展开按钮集合
![](https://raw.githubusercontent.com/bestwnh/IGLDropDownMenu/master/Screens/IGLDropDownMenuDemo.gif)

- **[VBFPopFlatButton](https://github.com/victorBaro/VBFPopFlatButton.git)**

有动效。
![](https://raw.githubusercontent.com/iBaro/VBFPopFlatButton/master/examples.jpg)

- [AYVibrantButton](https://github.com/a1anyip/AYVibrantButton.git)

![](https://github.com/a1anyip/AYVibrantButton/raw/master/Readme/screenshot.png?raw=true)

- **[BFPaperButton](https://github.com/bfeher/BFPaperButton.git)**

![](https://raw.githubusercontent.com/bfeher/BFPaperButton/master/BFPaperButtonDemoGif2.gif)

- **[FRDLivelyButton](https://github.com/sebastienwindal/FRDLivelyButton.git)**

![](https://github.com/sebastienwindal/FRDLivelyButton/raw/master/images/screenshot.gif)

#### Calendar & DatePicker

- **[FSCalendar](https://github.com/WenchaoD/FSCalendar.git)**

![](https://cloud.githubusercontent.com/assets/5186464/10262249/4fabae40-69f2-11e5-97ab-afbacd0a3da2.jpg)
![](https://cloud.githubusercontent.com/assets/5186464/10927681/d2448cb6-82dc-11e5-9d11-f664a06698a7.jpg)

- **[THCalendarDatePicker](https://github.com/hons82/THCalendarDatePicker.git)**

![](https://github.com/hons82/THCalendarDatePicker/raw/master/Screenshots/Screenshot1.png?raw=true)

- **[SACalendar](https://github.com/nopshusang/SACalendar.git)**

![](https://raw.githubusercontent.com/nopshusang/SACalendar/master/Screenshots/demo.png)

- **[MGConferenceDatePicker](https://github.com/matteogobbi/MGConferenceDatePicker.git)**

![](https://camo.githubusercontent.com/2d05d142773041b048ad777201f90d6ac32832bc/687474703a2f2f6935372e74696e797069632e636f6d2f32696c6e3565762e706e67)

- **[FFCalendar](https://github.com/fggeraissate/FFCalendar.git)**

![](https://raw.githubusercontent.com/fggeraissate/FFCalendar/master/FFCalendar/FFCalendars/Util/Images/YearlyCalendar.png)
![](https://raw.githubusercontent.com/fggeraissate/FFCalendar/master/FFCalendar/FFCalendars/Util/Images/MonthlyCalendar.png)

## CollectionView
- **[LxGridView](https://github.com/DeveloperLx/LxGridView.git)**

一个模仿iOS删除app界面，一个demo。

- **[MGBoxKit](https://github.com/sobri909/MGBoxKit.git)**

相当于flexbox的一个子实现，建议直接使用flex库，比如yoga。

- **[CSStickyHeaderFlowLayout](https://github.com/CSStickyHeaderFlowLayout/CSStickyHeaderFlowLayout.git)**

粘性header footer，实现不好，比较卡。

- **[CHTCollectionViewWaterfallLayout](https://github.com/chiahsien/CHTCollectionViewWaterfallLayout.git)**

一种瀑布流实现。

- **[RACollectionViewReorderableTripletLayout](https://github.com/ra1028/RACollectionViewReorderableTripletLayout.git)**

一个排序CollectionViewLayout实现，实现比较好可以作为参考。

- **[MJParallaxCollectionView](https://github.com/mayuur/MJParallaxCollectionView.git)**

图片列表，没什么参考意义。

- **[DZNEmptyDataSet](https://github.com/dzenbot/DZNEmptyDataSet)**

swizzle了reload方法来检测是否为空列表，从而来显示空状态。由于使用了黑科技，可能会对其他内容会有未知影响。

- **[CCFoldCell](https://github.com/bref-Chan/CCFoldCell)** 

折叠动画

## Color
- **[Chameleon](https://github.com/ViccAlexander/Chameleon.git)**

扁平化颜色集合。

- **[color](https://github.com/thisandagain/color.git)**

UIColor扩展。

- **[Colours](https://github.com/bennyguitar/Colours.git)**

一种比较漂亮的颜色集合，以及一些颜色转换方法。

## UIController
- **[FDFullscreenPopGesture](https://github.com/forkingdog/FDFullscreenPopGesture.git)**

全屏手势返回。通过KVC获取target，然后设置为第三方gesture的target，从而实现gesture替换的效果。

- [PKRevealController](https://github.com/pkluz/PKRevealController.git)
- [ECSlidingViewController](https://github.com/ECSlidingViewController/ECSlidingViewController.git) Android风格侧滑抽屉
- [SWRevealViewController](https://github.com/John-Lluch/SWRevealViewController.git)
- [BTSimpleSideMenu](https://github.com/balram3429/BTSimpleSideMenu.git)
- [RESideMenu](https://github.com/romaonthego/RESideMenu.git)
- [CYLTabBarController](https://github.com/ChenYilong/CYLTabBarController)
- [TLYShyNavBar](https://github.com/telly/TLYShyNavBar)
- [AXWebViewController](https://github.com/devedbox/AXWebViewController)
- [VCTransitionsLibrary](https://github.com/ColinEberhardt/VCTransitionsLibrary)
- [PYSearch](https://github.com/iphone5solo/PYSearch)

## Chart
- [iOS-Echarts](https://github.com/Pluto-Y/iOS-Echarts.git)
- [YKLineChartView](https://github.com/chenyk0317/YKLineChartView.git) 分时k线图
- [ANDLineChartView](https://github.com/anaglik/ANDLineChartView.git)
- [BEMSimpleLineGraph](https://github.com/Boris-Em/BEMSimpleLineGraph.git)
- [PNChart](https://github.com/kevinzhow/PNChart.git)
- [JSQMessagesViewController](https://github.com/jessesquires/JSQMessagesViewController.git)

## Chat
- [ChatKit-OC](https://github.com/leancloud/ChatKit-OC.git)
- [iosMath](https://github.com/kostub/iosMath.git) 数学公式
- [Atlas-iOS](https://github.com/layerhq/Atlas-iOS.git)
- [ChatSecure-iOS](https://github.com/ChatSecure/ChatSecure-iOS.git)
- [Messenger](https://github.com/relatedcode/Messenger.git)
- [JBChartView](https://github.com/Jawbone/JBChartView.git)
- [FishChat](https://github.com/yulingtianxia/FishChat)
- [LLWeChat](https://github.com/gyjzh/LLWeChat)

## ImagePicker
- [TZImagePickerController](https://github.com/banchichen/TZImagePickerController.git)
- [PYPhotoBrowser](https://github.com/iphone5solo/PYPhotoBrowser.git)
- [ZLPhotoBrowser](https://github.com/longitachi/ZLPhotoBrowser)
- [MWPhotoBrowser](https://github.com/mwaterfall/MWPhotoBrowser.git)
- [RSKImageCropper](https://github.com/ruslanskorb/RSKImageCropper.git)
- [UzysAssetsPickerController](https://github.com/uzysjung/UzysAssetsPickerController.git)
- [BCamera](https://github.com/danielebogo/DBCamera.git) camera with AVFoundation
- [PhotoZoom](https://github.com/brennanMKE/PhotoZoom.git)
- [TKImageView](https://github.com/3tinkers/TKImageView.git) 图片裁剪

## ImageView
- [FLAnimatedImage](https://github.com/Flipboard/FLAnimatedImage.git) gif
- [YLGIFImage](https://github.com/liyong03/YLGIFImage.git) gif

## Layout
- [iCarousel](https://github.com/nicklockwood/iCarousel.git)
- [MyLinearLayout](https://github.com/youngsoft/MyLinearLayout.git)
- [OAStackView](https://github.com/oarrabi/OAStackView.git)
- [SDAutoLayout](https://github.com/gsdios/SDAutoLayout.git)
- [PureLayout](https://github.com/PureLayout/PureLayout.git)
- **[Masonry](https://github.com/SnapKit/Masonry.git)**
- [FDStackView](https://github.com/forkingdog/FDStackView)
- [FlexBoxLayout](https://github.com/LPD-iOS/FlexBoxLayout)
- [yoga](https://github.com/facebook/yoga)
- [layout](https://github.com/schibsted/layout)

### Layout-DSL
- [VKCssProtocol](https://github.com/Awhisper/VKCssProtocol)


## Keyboard
- [IHKeyboardAvoiding](https://github.com/IdleHandsApps/IHKeyboardAvoiding.git) 输入始终可见
- [IQKeyboardManager](https://github.com/hackiftekhar/IQKeyboardManager.git)
- [CYRKeyboardButton](https://github.com/illyabusigin/CYRKeyboardButton.git) 原生键盘扩展按键

## Map
- [FBAnnotationClustering](https://github.com/infinum/FBAnnotationClustering.git)

## NavigationBar
- [BMYScrollableNavigationBar](https://github.com/beamly/BMYScrollableNavigationBar.git)

修改NavigationBar的frame来达到和滚动行为同步，没有参考价值。

- [KMNavigationBarTransition](https://github.com/MoZhouqi/KMNavigationBarTransition)

将真正的NavigationBar的背景等转移到fake bar上，fake bar加在controller.view上，来达到这种效果。微信的实现

- [RTRootNavigationController](https://github.com/rickytan/RTRootNavigationController)

使用UINavigationController包裹一层，从而达到每个controller的NavigationBar是独立的。云音乐的实现。

- [JZNavigationExtension](https://github.com/JazysYu/JZNavigationExtension)

和KMNavigationBarTransition类似，只是并不是直接使用UINavigationBar来做fake bar，而是采用截屏+addLayer来做。

## News
- **[TTNews](https://github.com/577528249/TTNews.git)**

一个demo性质的东西。

- **[bilibili-mac-client](https://github.com/typcn/bilibili-mac-client.git)**

## Password
- [SmileTouchID](https://github.com/liu044100/SmileTouchID.git) Touch ID
- [VENTouchLock](https://github.com/venmo/VENTouchLock.git) Touch ID
- [LTHPasscodeViewController](https://github.com/rolandleth/LTHPasscodeViewController.git) 密码及界面
- [onepassword-app-extension](https://github.com/AgileBits/onepassword-app-extension.git)

## PDF
- [GreatReader](https://github.com/semweb/GreatReader.git)
- [Reader](https://github.com/vfr/Reader.git)

## Progress
- [MRProgress](https://github.com/mrackwitz/MRProgress.git)
- [JGProgressHUD](https://github.com/JonasGessner/JGProgressHUD.git)
- [SVProgressHUD](https://github.com/SVProgressHUD/SVProgressHUD.git)
- [NJKWebViewProgress](https://github.com/ninjinkun/NJKWebViewProgress.git)
- [M13ProgressSuite](https://github.com/Marxon13/M13ProgressSuite.git)
- [UAProgressView](https://github.com/UrbanApps/UAProgressView.git)
- [MRCircularProgressView](https://github.com/martinezdelariva/MRCircularProgressView.git)
- [ASProgressPopUpView](https://github.com/alskipp/ASProgressPopUpView.git)
- [ASValueTrackingSlider](https://github.com/alskipp/ASValueTrackingSlider.git)
- [MBProgressHUD](https://github.com/jdg/MBProgressHUD.git)
- [YLProgressBar](https://github.com/yannickl/YLProgressBar)

#### Push
- [Knuff](https://github.com/KnuffApp/Knuff.git) 工具：The debug application for Apple Push Notification Service (APNs).

## Refresh
- [MJRefresh](https://github.com/CoderMJLee/MJRefresh.git)
- [INSPullToRefresh](https://github.com/inspace-io/INSPullToRefresh.git)
- [UzysAnimatedGifPullToRefresh](https://github.com/uzysjung/UzysAnimatedGifPullToRefresh.git)
- [XHRefreshControl](https://github.com/xhzengAIB/XHRefreshControl.git)
- [EGOTableViewPullRefresh](https://github.com/enormego/EGOTableViewPullRefresh.git)

## ScrollView
- [SDCycleScrollView](https://github.com/gsdios/SDCycleScrollView.git)
- [LazyScrollView](https://github.com/alibaba/LazyScrollView) An iOS ScrollView to resolve the problem of reusability in views.
- [CustomScrollView](https://github.com/ole/CustomScrollView)

## TextView
- [SlackTextViewController](https://github.com/slackhq/SlackTextViewController.git) 自增长的textView和联想功能
- [KIInPlaceEdit](https://github.com/kaiinui/KIInPlaceEdit.git)
- [ARAutocompleteTextView](https://github.com/alexruperez/ARAutocompleteTextView.git) 自动补全
- [HTAutocompleteTextField](https://github.com/hoteltonight/HTAutocompleteTextField.git)
- [JVFloatLabeledTextField](https://github.com/jverdi/JVFloatLabeledTextField.git) 浮动效果
- [YetiCharacterLabelExample](https://github.com/hulsizer/YetiCharacterLabelExample.git) 动效
- [AnimatedTextInput](https://github.com/jobandtalent/AnimatedTextInput.git)
- [ZSSRichTextEditor](https://github.com/nnhubbard/ZSSRichTextEditor.git)
- [TTTAttributedLabel](https://github.com/TTTAttributedLabel/TTTAttributedLabel.git)
- [dynamiccharts](https://github.com/FlowForwarding/dynamiccharts.git)
- [DTCoreText](https://github.com/Cocoanetics/DTCoreText.git)

## TableView
- **[UITableView-FDTemplateLayoutCell](https://github.com/forkingdog/UITableView-FDTemplateLayoutCell.git)**

利用[view sizeFittingSize:UILayoutFittingCompressedSize]来计算最小高度。

- **[MGSwipeTableCell](https://github.com/MortimerGoro/MGSwipeTableCell.git)**

左右滑动删除实现，需要继承于其cell。
![](https://raw.githubusercontent.com/MortimerGoro/MGSwipeTableCell/master/readme-assets/border.gif)

- [SWRevealTableViewCell](https://github.com/John-Lluch/SWRevealTableViewCell.git)
- [FXForms](https://github.com/nicklockwood/FXForms.git) 类似设置页面解决方案
- [SWTableViewCell](https://github.com/CEWendel/SWTableViewCell.git)

## Label
- **[UICountingLabel](https://github.com/dataxpress/UICountingLabel)**

![](https://github.com/dataxpress/UICountingLabel/raw/master/demo.gif)

- **[KILabel](https://github.com/Krelborn/KILabel)**

一个比较好用的扩展UILabel富文本支持，但是也有一些bug没有修复。

## Other
- **[timeLineiOS](https://github.com/romaHerman/timeLineiOS.git)**

时间线
![](https://github.com/romaHerman/timeLineiOS/raw/master/output_ppeLRI.gif)

- **[DGCuteHelper](https://github.com/Desgard/DGCuteHelper.git)**

粘性效果
![](https://github.com/Desgard/DGCuteHelper/raw/master/Image/screenshot.gif)

- **[MotionBlur](https://github.com/fastred/MotionBlur.git)**

快速移动时候的模糊效果。利用了CoreImage的自定义Filter，利用了`Core Image Kernel Language`，有点像OpenGL的`GLSL`。

- **[StackBluriOS](https://github.com/tomsoft1/StackBluriOS.git)**

近似高斯模糊算法

- **[FXBlurView](https://github.com/nicklockwood/FXBlurView.git)**

利用vImage进行模糊。

- **[AsyncDisplayKit](https://github.com/facebook/AsyncDisplayKit.git)**
- **[Texture](https://github.com/TextureGroup/Texture)**

就是AsyncDisplayKit

- **[KZLineDrawer](https://github.com/krzysztofzablocki/KZLineDrawer.git)**

利用cocos2d来手指画图，达到流畅的效果。

- **[UberSignature](https://github.com/uber/UberSignature)**

一种签名实现。
![](https://github.com/uber/UberSignature/raw/master/sign.gif)

- **[XXNibBridge](https://github.com/sunnyxx/XXNibBridge)**

一种在nib中动态load另一个nib中的内容的实现。

----

# Debug
- **[FLEX](https://github.com/Flipboard/FLEX.git)**

一款非常完善的内置debug工具。包含视图查看、log、查看沙盒数据等等功能。

- **[RHObjectiveBeagle](https://github.com/heardrwt/RHObjectiveBeagle.git)**

已被删除

- **[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack.git)**

非常有名的log工具

- **[BugshotKit](https://github.com/marcoarment/BugshotKit.git)**

bug反馈，截屏功能。

- **[Clue](https://github.com/Geek-1001/Clue)** Flexible bug report framework for iOS

在一个bug反馈前，收集用户信息，包括录制视频。

- **[MLeaksFinder](https://github.com/Zepo/MLeaksFinder)**

依赖`FBRetainCycleDetector`来做的内存泄露分析。

- **[GYBootingProtection](https://github.com/liuslevis/GYBootingProtection)**

开机启动自修复，判定开机崩溃，进入修复流程。微信就有这样的功能。

- **[DBDebugToolkit](https://github.com/dbukowski/DBDebugToolkit)**

一个比较完善的debug工具集。

- **[IPAPatch](https://github.com/Naituw/IPAPatch)**

不需要越狱注入其他app的工具。

- **[NetworkEye](https://github.com/coderyi/NetworkEye)**

利用NSURLProtocol来观察网络请求状况，是一个内置的查看工具。

- **[FBSimulatorControl](https://github.com/facebook/FBSimulatorControl)**

多模拟器选择。

- **[LifetimeTracker](https://github.com/krzysztofzablocki/LifetimeTracker)** **621 Stars** **Swift** Find retain cycles / memory leaks sooner.

利用了associate object来监测对象生命周期，局限性太大。不过可能会持续更新

- **[FBMemoryProfiler](https://github.com/facebook/FBMemoryProfiler.git)**

利用`FBRetainCycleDetector`和`FBAllocationTracker`做的一款工具，增加UI界面。

- **[FBRetainCycleDetector](https://github.com/facebook/FBRetainCycleDetector)**

利用objc的特性，利用Object、block等的属性布局收集强引用信息。

- **[FBAllocationTracker](https://github.com/facebook/FBAllocationTracker)**

hook了`+alloc`和`-dealloc`来统计objc对象使用情况。

- [iOS-Hierarchy-Viewer](https://github.com/glock45/iOS-Hierarchy-Viewer)

iOS视图结构查看器，需要通过http查看，还包括core data查看。
![](https://camo.githubusercontent.com/8e3e960a51e023472a06691ef0157a75c38d809d/687474703a2f2f692e737461636b2e696d6775722e636f6d2f796e7176472e706e67)

- **[libimobiledevice](https://github.com/libimobiledevice/libimobiledevice)**

和设备通信的类库。

# Test
- **[ocmock](https://github.com/erikdoe/ocmock)**

使用NSProxy对象替代原本的对象，在response和forward中记录和处理、转发消息来实现，是非常好用的mock类库。由于完全依赖oc的动态特性，所以对swift类无效。

- **[OCMockito](https://github.com/jonreid/OCMockito)**

类似于ocmock，关注度不高。

- **[KIF](https://github.com/kif-framework/KIF.git)**

利用了私有方法，在非UI Unit test中进行UI测试。

- **[expecta](https://github.com/specta/expecta)**
- **[specta](https://github.com/specta/specta)**
- **[cedar](https://github.com/pivotal/cedar)**
- **[Kiwi](https://github.com/kiwi-bdd/Kiwi)**

以上几种都是BDD方式的封装。

- **[OCHamcrest](https://github.com/hamcrest/OCHamcrest)**

可以认为是一些语法糖

- **[Nocilla](https://github.com/luisobo/Nocilla)**

hook http请求

- **[Nimble](https://github.com/Quick/Nimble)** **2403 Stars** **Swift** A Matcher Framework for Swift and Objective-C

知名度比较高的测试断言库。

- **[Quick](https://github.com/Quick/Quick)** **6876 Stars** **Swift** The Swift (and Objective-C) testing framework.

知名度比较高的BDD。

# React

- [react-native-maps](https://github.com/airbnb/react-native-maps)

# Other
- [MonkeyDev](https://github.com/AloneMonkey/MonkeyDev)
- [CYLTabBarController](https://github.com/ChenYilong/CYLTabBarController)
- [detect.location](https://github.com/KrauseFx/detect.location)
- [WeChatTweak-macOS](https://github.com/Sunnyyoung/WeChatTweak-macOS)
- [FlatUIKit](https://github.com/Grouper/FlatUIKit.git)
- [JLPermissions](https://github.com/jlaws/JLPermissions.git) 应用权限
- [ZXingObjC](https://github.com/TheLevelUp/ZXingObjC.git) 二维码
- [SAMKeychain](https://github.com/soffes/SAMKeychain.git)
- [SimulateIDFA](https://github.com/youmi/SimulateIDFA.git)
- [ohana-ios](https://github.com/uber/ohana-ios.git) 通讯录
- [class-dump](https://github.com/nygard/class-dump.git)
- [DarkLightning](https://github.com/jensmeder/DarkLightning.git) 雷电口传输数据
- [peertalk](https://github.com/rsms/peertalk.git) USB数据传输
- [MMWormhole](https://github.com/mutualmobile/MMWormhole.git) app和extension的数据传输
- [MALoggingViewController](https://github.com/mamaral/MALoggingViewController.git)
- [ios-simulator-app-installer](https://github.com/stepanhruda/ios-simulator-app-installer.git)
- [KZPlayground](https://github.com/krzysztofzablocki/KZPlayground.git) Playground for Objective-C
- [PunchClock](https://github.com/panicinc/PunchClock.git) An in/out tracking app for iOS 7+ that uses iBeacon and Geofencing.
- [PonyDebugger](https://github.com/square/PonyDebugger.git) 使用Chrome来debug view
- [MLPNeuralNet](https://github.com/nikolaypavlov/MLPNeuralNet.git) 神经网络
- [GCDWebServer](https://github.com/swisspol/GCDWebServer.git)
- [CocoaHTTPServer](https://github.com/robbiehanson/CocoaHTTPServer.git)
- [radiant-player-mac](https://github.com/radiant-player/radiant-player-mac.git) 音乐播放器for mac
- [ARAnalytics](https://github.com/orta/ARAnalytics.git)  It currently supports on iOS: Mixpanel, Localytics, Flurry, GoogleAnalytics, KISSmetrics, Crittercism, Crashlytics, Fabric, Bugsnag, Countly, Helpshift, Tapstream, NewRelic, Amplitude, HockeyApp, HockeyAppLib, ParseAnalytics, HeapAnalytics, Chartbeat, UMengAnalytics, Librato, Segmentio, Swrve, YandexMobileMetrica, Adjust, AppsFlyer, Branch, Snowplow, Sentry, Intercom, Keen, Adobe and MobileAppTracker/Tune.
- [Onboard](https://github.com/mamaral/Onboard)
- [electrino](https://github.com/pojala/electrino)
