---
title: 开源项目列表
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

- **[Haneke](https://github.com/Haneke/Haneke.git) image cache**

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
- [HubFramework](https://github.com/spotify/HubFramework.git)
- [BeeHive](https://github.com/alibaba/BeeHive.git) alibaba
- **[IGListKit](https://github.com/Instagram/IGListKit)**

事件驱动的collectionView组件化封装。具体参考[IGListKit简析与DDComponent](/2017/05/23/2017-05-23-IGListKit分析/)

- [componentkit](https://github.com/facebook/componentkit)

# Crash Report
- [KSCrash](https://github.com/kstenerud/KSCrash.git)
- [FBMemoryProfiler](https://github.com/facebook/FBMemoryProfiler.git)

# Encrypt
- [MIHCrypto](https://github.com/hohl/MIHCrypto.git) OpenSSL

# Markdown
- [CocoaMarkdown](https://github.com/indragiek/CocoaMarkdown.git)
- [MMMarkdown](https://github.com/mdiep/MMMarkdown.git)
- [macdown](https://github.com/MacDownApp/macdown.git)

# Kit
- [AppDevKit](https://github.com/yahoo/AppDevKit.git)
- [YYKit](https://github.com/ibireme/YYKit.git)
- [EasyIOS](https://github.com/zhuchaowe/EasyIOS.git)
- [YOLOKit](https://github.com/mxcl/YOLOKit.git)
- [BlocksKit](https://github.com/zwaldowski/BlocksKit.git)
- [Bolts-ObjC](https://github.com/BoltsFramework/Bolts-ObjC.git) Bolts is a collection of low-level libraries designed to make developing mobile apps easier.
- [QMUI_iOS](https://github.com/QMUI/QMUI_iOS)

# Data
- [GPUImage](https://github.com/BradLarson/GPUImage.git)
- [json-framework](https://github.com/stig/json-framework.git)
- [jsonmodel](https://github.com/jsonmodel/jsonmodel.git)
- [ReactiveViewModel](https://github.com/ReactiveCocoa/ReactiveViewModel.git)
- [RestKit](https://github.com/RestKit/RestKit.git)
- [JSONKit](https://github.com/johnezang/JSONKit.git)
- [Mantle](https://github.com/Mantle/Mantle.git)
- [Doppelganger](https://github.com/Wondermall/Doppelganger) Array diffs as collection view wants it
- [OrderedDictionary](https://github.com/nicklockwood/OrderedDictionary)
- [FastCoding](https://github.com/nicklockwood/FastCoding)

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

- **[rocksdb]**

基于leveldb，对齐进行了多线程以及ssd的优化。

- **[leveldb]**

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
- [jrswizzle](https://github.com/rentzsch/jrswizzle.git)
- [MAZeroingWeakRef](https://github.com/mikeash/MAZeroingWeakRef.git)
- [Aspects](https://github.com/steipete/Aspects.git)
- [WebViewJavascriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge.git)
- [DLIntrospection](https://github.com/garnett/DLIntrospection)
- [fishhook](https://github.com/facebook/fishhook)
- [JSPatch](https://github.com/bang590/JSPatch)

# Socket
- [CocoaAsyncSocket](https://github.com/robbiehanson/CocoaAsyncSocket.git)
## Web Socket
- [SocketRocket](https://github.com/facebook/SocketRocket.git)
- [AZSocketIO](https://github.com/lukabernardi/AZSocketIO.git) socket.io

# Template
- [GRMustache](https://github.com/groue/GRMustache.git)
- [CoreParse](https://github.com/beelsebob/CoreParse.git)

# Theme
- [DKNightVersion](https://github.com/Draveness/DKNightVersion.git)
- [Tweaks](https://github.com/facebook/Tweaks.git)

# Util
- [NSDate-TimeAgo](https://github.com/kevinlawler/NSDate-TimeAgo.git)
- [DateTools](https://github.com/MatthewYork/DateTools.git)
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

# animation

- [Keyframes](https://github.com/facebookincubator/Keyframes.git) 使用AE做动画
- [lottie-ios](https://github.com/airbnb/lottie-ios)
- [AHEasing](https://github.com/warrenm/AHEasing.git) timeFunction
- **[popping](https://github.com/schneiderandre/popping.git)**

依靠CADisplayLink来达到高帧率的动画效果。但是太依赖CPU，所以性能不一定比CA优秀。一般情况下感觉不太需要他来做动画。

- [RBBAnimation](https://github.com/robb/RBBAnimation.git)
- [Canvas](https://github.com/CanvasPod/Canvas.git)Animate in Xcode without code
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

- [CRAnimation](https://github.com/CRAnimation/CRAnimation)

## ActionSheet & Menu
- [JGActionSheet](https://github.com/JonasGessner/JGActionSheet.git)
- [JTSActionSheet](https://github.com/jaredsinclair/JTSActionSheet.git)
- [AHKActionSheet](https://github.com/fastred/AHKActionSheet.git)
- [AMPopTip](https://github.com/andreamazz/AMPopTip.git) 类似menu control
- [MMPopLabel](https://github.com/mgcm/MMPopLabel.git) 类似menu control
- [FTPopOverMenu](https://github.com/liufengting/FTPopOverMenu.git)
- [CMPopTipView](https://github.com/chrismiles/CMPopTipView.git)
- [CRToast](https://github.com/cruffenach/CRToast.git)
- [GHContextMenu](https://github.com/GnosisHub/GHContextMenu.git) path style menu
- [AwesomeMenu](https://github.com/levey/AwesomeMenu.git) path style menu

## Animation 各种动画
- [CBStoreHouseRefreshControl](https://github.com/coolbeet/CBStoreHouseRefreshControl.git)
- [ZLSwipeableView](https://github.com/zhxnlai/ZLSwipeableView.git)
- [YLLongTapShare](https://github.com/liyong03/YLLongTapShare.git)
- [VBFJellyView](https://github.com/victorBaro/VBFJellyView.git)
- [TinderSimpleSwipeCards](https://github.com/cwRichardKim/TinderSimpleSwipeCards.git)
- [CrossNavigation](https://github.com/artemstepanenko/CrossNavigation.git) 不同方向的转场动画
- [FastAnimationWithPOP](https://github.com/WilliamZang/FastAnimationWithPOP.git)
- [CXCardView](https://github.com/ChrisXu1221/CXCardView.git)
- [ICGTransitionAnimation](https://github.com/itsmeichigo/ICGTransitionAnimation.git)
- [ZFDragableModalTransition](https://github.com/zoonooz/ZFDragableModalTransition.git)
- [ESConveyorBelt](https://github.com/escoz/ESConveyorBelt.git) 开机启动画面方案
- [EAIntroView](https://github.com/ealeksandrov/EAIntroView.git) 启动引导页方案
- [URBMediaFocusViewController](https://github.com/u10int/URBMediaFocusViewController.git)
- [RQShineLabel](https://github.com/zipme/RQShineLabel.git)
- [AMWaveTransition](https://github.com/andreamazz/AMWaveTransition.git)
- [SCSiriWaveformView](https://github.com/stefanceriu/SCSiriWaveformView.git)
- [AnimatedTransitionGallery](https://github.com/shu223/AnimatedTransitionGallery.git)
- [MDCSwipeToChoose](https://github.com/modocache/MDCSwipeToChoose.git)
- [RPSlidingMenu](https://github.com/RobotsAndPencils/RPSlidingMenu.git)
- [BRFlabbyTable](https://github.com/brocoo/BRFlabbyTable.git)
- [SVGKit](https://github.com/SVGKit/SVGKit)
- [KMCGeigerCounter](https://github.com/kconner/KMCGeigerCounter)
- [POP-MCAnimate](https://github.com/matthewcheok/POP-MCAnimate)

#### Button
- [DownloadButton](https://github.com/PavelKatunin/DownloadButton.git)
- [IGLDropDownMenu](https://github.com/bestwnh/IGLDropDownMenu.git) 可展开按钮集合
- [VBFPopFlatButton](https://github.com/victorBaro/VBFPopFlatButton.git)
- [AYVibrantButton](https://github.com/a1anyip/AYVibrantButton.git)
- [BFPaperButton](https://github.com/bfeher/BFPaperButton.git)
- [FRDLivelyButton](https://github.com/sebastienwindal/FRDLivelyButton.git)

#### Calendar & DatePicker
- [FSCalendar](https://github.com/WenchaoD/FSCalendar.git)
- [THCalendarDatePicker](https://github.com/hons82/THCalendarDatePicker.git)
- [SACalendar](https://github.com/nopshusang/SACalendar.git)
- [MGConferenceDatePicker](https://github.com/matteogobbi/MGConferenceDatePicker.git)
- [FFCalendar](https://github.com/fggeraissate/FFCalendar.git)

## CollectionView
- [LxGridView](https://github.com/DeveloperLx/LxGridView.git)
- [MGBoxKit](https://github.com/sobri909/MGBoxKit.git) Simple, quick iOS tables, grids, and more
- [CSStickyHeaderFlowLayout](https://github.com/CSStickyHeaderFlowLayout/CSStickyHeaderFlowLayout.git) 粘性header footer
- [CHTCollectionViewWaterfallLayout](https://github.com/chiahsien/CHTCollectionViewWaterfallLayout.git) 瀑布流
- [RACollectionViewReorderableTripletLayout](https://github.com/ra1028/RACollectionViewReorderableTripletLayout.git)
- [MJParallaxCollectionView](https://github.com/mayuur/MJParallaxCollectionView.git)
- [DZNEmptyDataSet](https://github.com/dzenbot/DZNEmptyDataSet)
- [CCFoldCell](https://github.com/bref-Chan/CCFoldCell)

## Color
- [Chameleon](https://github.com/ViccAlexander/Chameleon.git)
- [color](https://github.com/thisandagain/color.git)
- [Colours](https://github.com/bennyguitar/Colours.git)

## UIController
- [FDFullscreenPopGesture](https://github.com/forkingdog/FDFullscreenPopGesture.git) 全屏手势返回
- [PKRevealController](https://github.com/pkluz/PKRevealController.git)
- [ECSlidingViewController](https://github.com/ECSlidingViewController/ECSlidingViewController.git) Android风格侧滑抽屉
- [SWRevealViewController](https://github.com/John-Lluch/SWRevealViewController.git)
- [BTSimpleSideMenu](https://github.com/balram3429/BTSimpleSideMenu.git)
- [RESideMenu](https://github.com/romaonthego/RESideMenu.git)
- [CYLTabBarController](https://github.com/ChenYilong/CYLTabBarController)
- [JZNavigationExtension](https://github.com/JazysYu/JZNavigationExtension)
- [TLYShyNavBar](https://github.com/telly/TLYShyNavBar)
- [RTRootNavigationController](https://github.com/rickytan/RTRootNavigationController)
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

## Navigation
- [BMYScrollableNavigationBar](https://github.com/beamly/BMYScrollableNavigationBar.git)

## News
- [TTNews](https://github.com/577528249/TTNews.git)
- [bilibili-mac-client](https://github.com/typcn/bilibili-mac-client.git)

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
- [UITableView-FDTemplateLayoutCell](https://github.com/forkingdog/UITableView-FDTemplateLayoutCell.git)
- [MGSwipeTableCell](https://github.com/MortimerGoro/MGSwipeTableCell.git) 左右滑动删除实现
- [SWRevealTableViewCell](https://github.com/John-Lluch/SWRevealTableViewCell.git)
- [FXForms](https://github.com/nicklockwood/FXForms.git) 类似设置页面解决方案
- [SWTableViewCell](https://github.com/CEWendel/SWTableViewCell.git)

## Label
- [UICountingLabel](https://github.com/dataxpress/UICountingLabel)
- [KILabel](https://github.com/Krelborn/KILabel)

## Other
- [timeLineiOS](https://github.com/romaHerman/timeLineiOS.git) 时间线
- [DGCuteHelper](https://github.com/Desgard/DGCuteHelper.git) 粘性效果
- [MotionBlur](https://github.com/fastred/MotionBlur.git)
- [StackBluriOS](https://github.com/tomsoft1/StackBluriOS.git) 近似高斯模糊算法
- [FXBlurView](https://github.com/nicklockwood/FXBlurView.git)
- **[AsyncDisplayKit](https://github.com/facebook/AsyncDisplayKit.git)**
- [Texture](https://github.com/TextureGroup/Texture)
- [KZLineDrawer](https://github.com/krzysztofzablocki/KZLineDrawer.git) 手指画图
- [UberSignature](https://github.com/uber/UberSignature)
- [XXNibBridge](https://github.com/sunnyxx/XXNibBridge)

----

# Debug
- [FLEX](https://github.com/Flipboard/FLEX.git) Debug Tool
- [RHObjectiveBeagle](https://github.com/heardrwt/RHObjectiveBeagle.git) view debug tool
- [CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack.git)
- [BugshotKit](https://github.com/marcoarment/BugshotKit.git)
- [Clue](https://github.com/Geek-1001/Clue) Flexible bug report framework for iOS
- [MLeaksFinder](https://github.com/Zepo/MLeaksFinder)
- [GYBootingProtection](https://github.com/liuslevis/GYBootingProtection)
- [DBDebugToolkit](https://github.com/dbukowski/DBDebugToolkit)
- [IPAPatch](https://github.com/Naituw/IPAPatch)
- [NetworkEye](https://github.com/coderyi/NetworkEye)
- [FBRetainCycleDetector](https://github.com/facebook/FBRetainCycleDetector)
- [iOS-Hierarchy-Viewer](https://github.com/glock45/iOS-Hierarchy-Viewer)
- [libimobiledevice](https://github.com/libimobiledevice/libimobiledevice)

# Test
- **[ocmock](https://github.com/erikdoe/ocmock.git)**

使用NSProxy对象替代原本的对象，在response和forward中记录和处理、转发消息来实现，是非常好用的mock类库。由于完全依赖oc的动态特性，所以对swift类无效。

- **[OCMockito](https://github.com/jonreid/OCMockito)**

类似于ocmock，关注度不高。

- **[KIF](https://github.com/kif-framework/KIF.git)**

利用了私有方法，在非UI Unit test中进行UI测试。

- **[expecta](https://github.com/specta/expecta)**
- **[specta](https://github.com/specta/specta)**
- **[cedar](https://github.com/pivotal/cedar)**

以上3几种都是BDD方式的封装。

- **[OCHamcrest](https://github.com/hamcrest/OCHamcrest)**

可以认为是一些语法糖

# Other
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
- [libextobjc](https://github.com/jspahrsummers/libextobjc)
- [Onboard](https://github.com/mamaral/Onboard)
- [electrino](https://github.com/pojala/electrino)
