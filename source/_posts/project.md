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
- [ZFPlayer](https://github.com/renzifeng/ZFPlayer.git) **3566 Stars** **Objective-C**

功能比较完善的一个视频播放及界面，但是实现较为一般。

- [StreamingKit](https://github.com/tumtumtum/StreamingKit.git) **1641 Stars** **Objective-C**

基于流来构建音频播放，是一个思路，但可能不能满足特殊情景。

- [LFLiveKit](https://github.com/LaiFengiOS/LFLiveKit.git) **2677 Stars** **Objective-C**

利用GPUImage做滤镜的一个直播录制系统，功能比较完善，可以作为参考。

- [TTAVPlayer](https://github.com/tangdiforx/TTAVPlayer.git) **84 Stars** **Objective-C**

比较简单的基于AVPlayerLayer的一个实现。

- [CTVideoPlayerView](https://github.com/casatwy/CTVideoPlayerView.git) **499 Stars** **Objective-C**

没太大参考意义。

- [EZAudio](https://github.com/syedhali/EZAudio.git) **4070 Stars** **Objective-C**

音频的波形分析和展示，利用了accelerate，比较全面。

# Cache
- **[YYCache](https://github.com/ibireme/YYCache.git)** **1490 Stars** **Objective-C**

使用了LRU策略

内存缓存使用了线性链表+NSDictionary来实现，由于LRU的特性，插入永远在开始，而删除永远在结尾，所以拥有较高的性能。但是查找还是依赖于hash表来实现。

磁盘缓存使用了sqlite来保存文件缓存信息（filename, last_modify_time)，所以在读写小数据的时候（20KB）会直接在sqlite中读写，而不会生成一个独立的文件。所以在小文件和未命中的情况下效率会高很多。而读写大文件时，效率会降低一些，考虑到sqlite的缓存和执行，并不会降低太多。由于sqlite对时间创建了索引，所以在缓存过期查找上面会优秀一些。这种设计解决了小文件和未命中的效率问题，但是并不能实现高并发读写文件。

- **[PINCache](https://github.com/pinterest/PINCache.git)** **1759 Stars** **Objective-C**

使用了大量的Lock来处理读写，拥有异步读写接口，没有太多的特别优化。

磁盘缓存单纯使用了文件缓存，在初始化的时候就把整个目录及其元素的属性读到内存，来提高效率，但是使用的是数组存储，效率一般。

- **[SPTPersistentCache](https://github.com/spotify/SPTPersistentCache.git)** **1139 Stars** **Objective-C**

利用CRC32来校验文件，据说速度较快。

他将数据信息通过memory map的方式写到了文件头部，说是为了并发读写，但这也时每次更新updateTime需要写整个文件，这样必定会导致性能降低。个人建议还是把文件信息写到另一个文件中，方便内存缓存。

- **[OSCache](https://github.com/nicklockwood/OSCache.git)** **184 Stars** **Objective-C**

一个模仿NSCache的实现，内部使用NSDictionary。

- **[Haneke](https://github.com/Haneke/Haneke.git)** **1775 Stars** **Objective-C**

他和SDWebImage非常相似，个人看来，这个的代码及其结构会比SD好一些，但是功能太有限，就像作者自己说的是一个轻量级的实现。

- **[SDWebImage](https://github.com/rs/SDWebImage.git)** **18607 Stars** **Objective-C**

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

- **[FastImageCache](https://github.com/path/FastImageCache.git)** **7547 Stars** **Objective-C**

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
- **[HubFramework](https://github.com/spotify/HubFramework.git)** **1746 Stars** **Objective-C**

也是一款拆分CollectionView的设计，个人认为拆分的太细了，导致整个系统过于复杂，学习成本太高。

- **[BeeHive](https://github.com/alibaba/BeeHive.git)** **2236 Stars** **Objective-C**

将客户端的架构和服务端service结合，从而实现整个app的组件化。本身服务端和客户端在很多方面就不一样，需要更多的情景考虑。他的实现在有些场景还是不够的灵活，但是其思想可以借鉴下。

- **[IGListKit](https://github.com/Instagram/IGListKit.git)** **6775 Stars** **Objective-C**

事件驱动的collectionView组件化封装。具体参考[IGListKit简析与DDComponent](/2017/05/23/2017-05-23-IGListKit分析/)

- **[componentkit](https://github.com/facebook/componentkit.git)** **4062 Stars** **Objective-C++**

类似于React方式，使用component来布局UI。完全颠覆了传统的架构和编码方式，学习成本高。项目复杂，由objective-C++编写，利用了大量隐式转换的特性，所以不适用于swift。

# Crash Report
- [KSCrash](https://github.com/kstenerud/KSCrash.git) **1732 Stars** **Objective-C**

# Encrypt
- **[MIHCrypto](https://github.com/hohl/MIHCrypto.git)** **272 Stars** **Objective-C**

非常全面的加密库。

# Markdown
- [CocoaMarkdown](https://github.com/indragiek/CocoaMarkdown.git) **936 Stars** **Objective-C**
- [MMMarkdown](https://github.com/mdiep/MMMarkdown.git) **1083 Stars** **Objective-C**
- [macdown](https://github.com/MacDownApp/macdown.git) **6323 Stars** **Objective-C**

# Kit
- **[AppDevKit](https://github.com/yahoo/AppDevKit.git)** **1317 Stars** **Objective-C**

一些扩展，用处不大。

- **[YYKit](https://github.com/ibireme/YYKit.git)** **10852 Stars** **Objective-C**

包含了很多util方法，以及cache，image，text，json2model方面的类库。

- **[EasyIOS](https://github.com/zhuchaowe/EasyIOS.git)** **824 Stars** **Objective-C**

没有参考价值

- **[BlocksKit](https://github.com/zwaldowski/BlocksKit.git)**

可以将他的功能归为两类：

1, sequence，swift中自带的概念，和reactive的概念一致，是一种流式的写法。
2, 动态delegate，实现动态delegate的转换，从而实现了大量UI层的回调简化。

功能比较多，除了sequence和UI层的事件外，还有associate object、perform以及KVO（和KVOController类似）。如果是objc开发，可以考虑使用。

- **[Bolts-ObjC](https://github.com/BoltsFramework/Bolts-ObjC.git)** **5180 Stars** **Objective-C**

主要提供了两个工具：

1, Task，类似于promise，以及reactive，个人觉得不如另外两者。
2, AppLink，一种多平台兼容的跳转方案，同时兼容native和web等，应用面会比MGJRouter这种广一点，但实现上不是非常的完善和通用。

- **[QMUI_iOS](https://github.com/QMUI/QMUI_iOS.git)** **1687 Stars** **Objective-C**

一套非常完善的UI组件库，设计也比较精美，出自腾讯团队。本人认为他也有几个的缺点，那就是利用了大量的Runtime特性，导致很多系统方法都被hook了，这可能会带来某些隐患。由于很多方法都是在系统类上加的，所以api并不是很美观，总是有`qmui_`这样的前缀。同时hook了UI层的东西，所以如果使用原生的组件也势必会带上一些QMUI的东西。

NavigationBar交互动画的修正采用的是在`controller.view`上加上一个只设置了背景的`navigationBar`，同时隐藏原生的`navigationBar`来实现。相比于另一种使用`navigationController`再套一层每个`controller`，从而让每个`controller`的`navigationBar`相互独立，本人认为QMUI的方式更加优秀，影响面更加小，毕竟不会影响到整个controller的栈结构。

# Util
- **[YOLOKit](https://github.com/mxcl/YOLOKit.git)** **628 Stars** **Objective-C**

一个类似于reactive中sequence的工具类，建议直接使用Reactive。

- **[libextobjc](https://github.com/jspahrsummers/libextobjc.git)** **3682 Stars** **Objective-C**

非常有名的几个宏定义的出处，对宏的理解和运用都非常厉害，但是平常经常使用的也就那么几个。

```objc
@strongify()
@weakify()
@onExit{}
```

# Data
- **[json-framework](https://github.com/stig/json-framework.git)** **3799 Stars** **Objective-C**

原来的SBJson，建议使用系统方法。

- **[jsonmodel](https://github.com/jsonmodel/jsonmodel.git)** **6307 Stars** **Objective-C**

JSON转model，缺点是必须继承于JSONModel基类。

- **[ReactiveViewModel](https://github.com/ReactiveCocoa/ReactiveViewModel.git)** **1727 Stars** **Objective-C**

增加了active事件，没什么用。

- **[RestKit](https://github.com/RestKit/RestKit.git)** **10154 Stars** **Objective-C**

包括了网络请求，json转model，以及到core data，如果有这些方面的需求可以尝试下。

- **[JSONKit](https://github.com/johnezang/JSONKit.git)** **6136 Stars** **Objective-C**

建议使用系统方法。

- **[Mantle](https://github.com/Mantle/Mantle.git)** **10744 Stars** **Objective-C**

JSON转model，但是要继承于基类。

- **[Doppelganger](https://github.com/Wondermall/Doppelganger.git)** **660 Stars** **Objective-C**

一个diff工具，用于CollectionView的reload。

- **[Diff.swift](https://github.com/wokalski/Diff.swift.git)** **794 Stars** **Swift**

也是一个CollectionView reload的diff工具。

- **[OrderedDictionary](https://github.com/nicklockwood/OrderedDictionary.git)** **253 Stars** **Objective-C**

有序字典，意义是？

- **[FastCoding](https://github.com/nicklockwood/FastCoding.git)** **883 Stars** **C**

自动NSCoding，还不是特别通用。

- **[AutoCoding](https://github.com/nicklockwood/AutoCoding.git)** **969 Stars** **Objective-C**

利用获取property来自动NSCoding。

### KVO
- **[RZDataBinding](https://github.com/Raizlabs/RZDataBinding.git)** **445 Stars** **Objective-C**

对象绑定思想也是使用associate object，同时也hook了dealloc。但是很多地方使用了assign而不是weak。不推荐使用

他提出一个事务的概念，将众多变更一次性提交，但好像没什么太大的意义。

- **[KVOController](https://github.com/facebook/KVOController.git)** **5977 Stars** **Objective-C**

FB出品，使用associate object管理内存和负责移除KVO，非常良好的实现方式，推荐使用这个。

- **[HTBKVObservation](https://github.com/thehtb/HTBKVObservation)**

hook dealloc来负责移除，需要自己来保证observation的生命周期，使用上不如FB的方便。

- **[MAKVONotificationCenter](https://github.com/mikeash/MAKVONotificationCenter)**

hook dealloc来负责移除监听。

# DB
- **[YTKKeyValueStore](https://github.com/yuantiku/YTKKeyValueStore.git)** **1759 Stars** **Objective-C**

利用sqlite做的一个简单的KV存储。

- **[YapDatabase](https://github.com/yapstudios/YapDatabase.git)** **2919 Stars** **Objective-C**

利用sqlite做的一个KV存储，会保存数据元信息和对象间的关系，优化了多线程读写。

- **[realm-cocoa](https://github.com/realm/realm-cocoa.git)** **11297 Stars** **Objective-C**

和sqlite一样，也是一种关系型数据库（这里讨论本地的realm）。

数据保存方式为内存映射，按照realm的说法是sqlite在读取保存数据时候会产生内存拷贝而影响性能。

数据按照列（column）来保存，每一列的数据格式是固定的，在查找效率上也会提升。同时列拥有不同的chunk来同步到磁盘，这样在读写的时候可以只锁定目标chunk而达到高并发读写。

数据结构实现为B+树，与sqlite使用的B树不同，B+树保证了叶子节点存储的连续性。

- [CoreObject](https://github.com/etoile/CoreObject.git) **280 Stars** **Objective-C**
- [ensembles](https://github.com/drewmccormack/ensembles.git) **1536 Stars** **Objective-C**
- [MagicalRecord](https://github.com/magicalpanda/MagicalRecord.git) **10498 Stars** **Objective-C**
- **[fmdb](https://github.com/ccgus/fmdb.git)** **11935 Stars** **Objective-C**

sqlite的轻量级封装，缺少ORM，但是也非常简单，容易debug。在少量场景的情况下推荐使用。

- [sequelpro](https://github.com/sequelpro/sequelpro.git) **3695 Stars** **Objective-C**
- [GYDataCenter](https://github.com/Zepo/GYDataCenter.git) **608 Stars** **Objective-C**

- **[sqlcipher](https://github.com/sqlcipher/sqlcipher.git)** **2505 Stars** **C**

SQLCipher is an SQLite extension that provides 256 bit AES encryption of database files.

- **[wcdb](https://github.com/Tencent/wcdb.git)** **4079 Stars** **C**

微信封装的sqlite ORM。支持多线程和数据修复，支持数据加密，用接口的方式强制格式化sql语句，功能比较强大，缺点是必须使用c++来实现其model，实现也较为复杂。如果在这方面需求量不大的情况下，没有必要迁移。

其sql拼装是字符串累加，而不是从语法树生成，所以必须依赖底层sqlite的存储方式。

- **[rocksdb](https://github.com/facebook/rocksdb.git)** **8645 Stars** **C++**

基于leveldb，对齐进行了多线程以及ssd的优化。

- **[leveldb](https://github.com/google/leveldb.git)** **10957 Stars** **C++**

是基于Google的big data实现的一套KV存储，原理简单的说就是每次操作（增删改），都是生成一条数据，存入文件，在一定的条件下，会对这些文件进行merge操作，来保证文件的大小。这种方案解决了高并发写的问题，但是增加了读的开销，是一种折中方案。在移动端的场景下好像没有这么高的并发写场景，应该没有必要使用。

数据结构使用跳跃链表（skip list）来实现，他比B/B+数的实现简单，同时也有不错的性能。

# Notes
- **[iOS-Source-Code-Analyze](https://github.com/Draveness/iOS-Source-Code-Analyze.git)**

源码分析笔记，有些地方过于详细了。

- **[trip-to-iOS](https://github.com/Aufree/trip-to-iOS.git)** **7187 Stars** **Objective-C**

一些资源以及博客等整理，比较老了，偏向新手。

- **[ParseSourceCodeStudy](https://github.com/ChenYilong/ParseSourceCodeStudy.git)** **2506 Stars** **Objective-C**

Parse的一些列分析文章。

- [iOSInterviewQuestions](https://github.com/ChenYilong/iOSInterviewQuestions.git) **5883 Stars** **Objective-C**

iOS面试题集锦

- [iOSBlogCN](https://github.com/tangqiaoboy/iOSBlogCN.git) **4391 Stars** **Python**

iOS博客集合。

- [TomatoRead](https://github.com/everettjf/TomatoRead.git) **458 Stars** **Objective-C**

iOS博客集合。

- [idev-recipes](https://github.com/boctor/idev-recipes.git) **3003 Stars** **Objective-C**
- [IosHackStudy](https://github.com/pandazheng/IosHackStudy)


IOS安全学习资料汇总

- [The-Art-Of-Programming-By-July](https://github.com/julycoding/The-Art-Of-Programming-By-July.git) **11813 Stars** **C**
- [Apple-OfficialTranslation-SourceAnnotation](https://github.com/CustomPBWaters/Apple-OfficialTranslation-SourceAnnotation)
- [Halfrost-Field](https://github.com/halfrost/Halfrost-Field.git) **592 Stars** **Objective-C**

# Network
- [AFNetworking](https://github.com/AFNetworking/AFNetworking.git) **30057 Stars** **Objective-C**
- [NSURLProtocol-WebKitSupport](https://github.com/yeatse/NSURLProtocol-WebKitSupport.git)
- [WebViewProxy](https://github.com/marcuswestin/WebViewProxy.git) **793 Stars** **Objective-C**
- [MMLanScan](https://github.com/mavris/MMLanScan.git) **207 Stars** **Objective-C**

网络质量检测

- [DFImageManager](https://github.com/kean/DFImageManager.git) **1220 Stars** **Objective-C**
- [Nuke](https://github.com/kean/Nuke.git) **2370 Stars** **Swift**

swift of [DFImageManager](#DFImageManager)

- [OHHTTPStubs](https://github.com/AliSoftware/OHHTTPStubs.git) **3383 Stars** **Objective-C**
- [RTNetworking](https://github.com/casatwy/RTNetworking.git) **1097 Stars** **Objective-C**
- [CocoaSPDY](https://github.com/twitter/CocoaSPDY.git) **2342 Stars** **Objective-C**
- [RealReachability](https://github.com/dustturtle/RealReachability.git) **2399 Stars** **Objective-C**
- [XMNetworking](https://github.com/kangzubin/XMNetworking.git) **705 Stars** **Objective-C**
- [fastsocket](https://github.com/fastos/fastsocket.git) **3466 Stars** **C**

# In-App Purchase
- [CargoBay](https://github.com/mattt/CargoBay.git) **1772 Stars** **Objective-C**

# Objc Runtime
- **[jrswizzle](https://github.com/rentzsch/jrswizzle.git)** **2062 Stars** **Objective-C**

Method swizzling

- **[MAZeroingWeakRef](https://github.com/mikeash/MAZeroingWeakRef.git)** **336 Stars** **Objective-C**

MRC时代的weak实现，可以作为参考。

- **[Aspects](https://github.com/steipete/Aspects.git)** **5436 Stars** **Objective-C**

一个比较全面的hook库，一般用于测试。

- **[DLIntrospection](https://github.com/garnett/DLIntrospection.git)** **587 Stars** **Objective-C**

runtime方法的objc封装。

- **[fishhook](https://github.com/facebook/fishhook.git)** **1999 Stars** **C**

用来hook C方法。

- **[JSPatch](https://github.com/bang590/JSPatch.git)** **10076 Stars** **C**

非常有名的利用js来动态hook的库。主要通过将`:`转换为`_`来实现函数签名的通用，同时格式化js代码，使`.`调用变为`.__c()`的方法调用。

和其他（react-native等）的思想不同，不会收集oc的方法签名，然后转到js中生成函数，使用的是修改js代码的方式，但会让debug变得困难，个人更倾向于react-native这种方式。


# Socket
- [CocoaAsyncSocket](https://github.com/robbiehanson/CocoaAsyncSocket.git) **9204 Stars** **Objective-C**

## Web Socket
- [SocketRocket](https://github.com/facebook/SocketRocket.git) **7190 Stars** **Objective-C**
- [AZSocketIO](https://github.com/lukabernardi/AZSocketIO.git) **274 Stars** **Objective-C**

# Template
- [GRMustache](https://github.com/groue/GRMustache.git) **1318 Stars** **Objective-C**
- [CoreParse](https://github.com/beelsebob/CoreParse.git) **358 Stars** **Objective-C**

# Theme
- **[DKNightVersion](https://github.com/Draveness/DKNightVersion.git)** **2809 Stars** **Objective-C**

一种换肤框架实现，缺点也非常多，支持的属性也比较少，本人实现了一个更加简单完善的版本[DDSkin](https://github.com/djs66256/DDSkin)

- [Tweaks](https://github.com/facebook/Tweaks.git) **4622 Stars** **Objective-C**

# Util
- [NSDate-TimeAgo](https://github.com/kevinlawler/NSDate-TimeAgo.git) **1681 Stars** **Objective-C**

NSDate的Helper类，比较简单。

- [DateTools](https://github.com/MatthewYork/DateTools.git) **5763 Stars** **Objective-C**

NSDate的Helper类，比较全面。

----

# Router

- **[routable-ios](https://github.com/clayallsopp/routable-ios.git)** **1600 Stars** **Objective-C**
- **[HHRouter](https://github.com/lightory/HHRouter.git)** **1393 Stars** **Objective-C**
这两个都是类似的实现，比较简单。

- **[JLRoutes](https://github.com/joeldev/JLRoutes)**
脱离UIKit，非常好用的一个实现，据说性较低，没有实际验证过。

- **[MGJRouter](https://github.com/meili/MGJRouter.git)** **1040 Stars** **Objective-C**
蘑菇街的实现，算法经过优化的JLRoutes，实际没有验证过。

- **[CTMediator](https://github.com/casatwy/CTMediator.git)** **1212 Stars** **Objective-C**
使用中间人来解决路由系统，使用target-action方式注册行为，

# Hybrid

- **[Framework7](https://github.com/nolimits4web/Framework7)**

一款模仿ios和android原生特性的h5组件库，效果来看很不错，可以使用vue和react，如果是写纯网页应用可以考虑使用这个。

- **[react-native](https://github.com/facebook/react-native.git)** **53996 Stars** **JavaScript**

1.4k贡献者，社区非常活跃，目前最热门的方案。拥有非常完善的debug方式以及各种工具，同时React的发展也特别的好。可以完成整个app的功能，也可以作为app的一部分嵌入使用。首推。

大部分组件可以支持iOS和Android，也有很多定制化的组件，所以有些时候需要区分平台来写，也不能无缝降级h5。

- **[incubator-weex](https://github.com/apache/incubator-weex.git)** **5496 Stars** **JavaScript**

和react-native竞争的产品，由阿里出品。框架会比react-native小一点，但功能也会少很多，排版是受阉割的flex，和官方所说的无缝降级h5有出入。一份代码能够同时在iOS和Android上运行，但为了统一也失去了很多的系统特性，感觉没有官方吹的那样厉害。

- **[PhoneGap]**
cordova的商业版

- **[WebViewJavascriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge.git)** **9454 Stars** **Objective-C**

webView中js与native交互的库。一种简单的实现，如果需要更复杂的实现可以使用cordova。

- **[ng-cordova](https://github.com/ionic-team/ng-cordova.git)** **3629 Stars** **JavaScript**

利用webview js和native的通信实现web端调用native方法。

原理和JSWebviewBridge类似，利用的都是iframe和messageQueue，require组件是直接在head中插入script实现，不知道在组件变多的情况下是否会影响性能，考虑到lazy load的情况，可能会好一点。

组件需要自己根据需要添加，组件比较全面，该有的都有。

但是iOS端是基于UIWebView实现的，不知什么时候能够替换成WKWebView，来提升性能。

- **[code-push](https://github.com/Microsoft/code-push.git)** **2993 Stars** **TypeScript**

基于cordova和react的云端服务

- **[BeeFramework](https://github.com/gavinkwoe/BeeFramework.git)** **3378 Stars** **Objective-C**

利用xml来实现布局，目前已经废弃。

- **[samurai-native](https://github.com/hackers-painters/samurai-native.git)** **2280 Stars** **HTML**

利用css和html来实现布局和事件绑定，但是实现还是需要原生代码，所以不能独立的去实现一个页面的功能。

- **[VasSonic](https://github.com/Tencent/VasSonic.git)** **5742 Stars** **Java**

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

- **[Tangram-iOS](https://github.com/alibaba/Tangram-iOS.git)** **758 Stars** **Objective-C**

阿里首页的实现方式，可以认为是一种模板技术，需要客户端开发业务模板，用在业务比较稳定的场景，局限性较大，但是版本更新成本较低，维护成本低。平时设计接口的时候可以参照这种模板方式来配置。

- **[JASONETTE-iOS](https://github.com/Jasonette/JASONETTE-iOS.git)** **4786 Stars** **Objective-C**

可以认为是一种完整的DSL，功能还是挺强大的，列表使用UITableView，布局系统使用UIStackView，因此也有很大的局限性。

同时编辑JSON文件也是非常麻烦的事情，没有很好的工具可以支持。不太推荐使用，除非支持更灵活的布局和编辑。

# UI

# Image

- **[GPUImage](https://github.com/BradLarson/GPUImage.git)** **16408 Stars** **Objective-C**

是目前最好用的一个GPU计算的框架。利用OpenGL来处理图片，需要对OpenGL比较熟悉，会写GLSL，熟悉图片处理才能创建自己的filter。

架构是流式结构，filter也是流的一部分，既是input也是output

当存在多个filter的时候，优化工作也比较难以进行。比如scale和rotate可以合并为transform。

由于是顺序结构的方案，所以就不能采用多线程多render buffer来优化cpu部分的性能，如下。

```
CPU: filter1 |  idle   | filter2 |   idle   |
GPU:  idle   | filter1 |   idle  |  filter2 |

优化：
CPU: filter1 | filter2 |  idle   |
GPU:  idle   | filter1 | filter2 |
```

# animation

- **[Keyframes](https://github.com/facebookincubator/Keyframes.git)** **4632 Stars** **JavaScript**

功能类似于Lottie。

- **[lottie-ios](https://github.com/airbnb/lottie-ios.git)** **10787 Stars** **Objective-C**

利用AE生成JSON文件来简化交互动画的编写。

- **[AHEasing](https://github.com/warrenm/AHEasing.git)** **989 Stars** **Objective-C**

多种时间函数实现。

- **[popping](https://github.com/schneiderandre/popping.git)** **5272 Stars** **Objective-C**

依靠CADisplayLink来达到高帧率的动画效果。但是太依赖CPU，所以性能不一定比CA优秀。一般情况下感觉不太需要他来做动画。

- **[RBBAnimation](https://github.com/robb/RBBAnimation.git)** **1945 Stars** **Objective-C**

一种动画的封装，意义不大。

- **[Canvas](https://github.com/CanvasPod/Canvas.git)** **5233 Stars** **Objective-C**

将动画集成到了View中，感觉没什么必要。

- **[YapAnimator](https://github.com/yapstudios/YapAnimator.git)** **1697 Stars** **Swift**

和popping原理类似，使用CADisplayLink，实时去修改视图属性。
```swift
YapAnimator(initialValue: square.frame, willBegin: { [unowned self] in
	return self.square.frame
}, eachFrame: { [unowned self] (animator) in
	self.square.frame = animator.current.value
})
```
看似比popping简单点，但是popping是模仿CoreAnimation做的，所以没有可比性。建议使用popping。

- **[CRAnimation](https://github.com/CRAnimation/CRAnimation.git)** **306 Stars** **Objective-C**

一系列的动画效果。

## ActionSheet & Menu
- **[JGActionSheet](https://github.com/JonasGessner/JGActionSheet.git)** **865 Stars** **Objective-C**

![](https://github.com/JonasGessner/JGActionSheet/raw/master/JGActionSheet%20Tests/Screenshots/1.png)
![](https://github.com/JonasGessner/JGActionSheet/raw/master/JGActionSheet%20Tests/Screenshots/2.png)

- **[JTSActionSheet](https://github.com/jaredsinclair/JTSActionSheet.git)** **339 Stars** **Objective-C**

![](https://raw.githubusercontent.com/jaredsinclair/JTSActionSheet/master/jtsactionsheet.png)

- **[AHKActionSheet](https://github.com/fastred/AHKActionSheet.git)** **1189 Stars** **Objective-C**

![](https://raw.githubusercontent.com/fastred/AHKActionSheet/master/example.gif)

- **[AMPopTip](https://github.com/andreamazz/AMPopTip.git)** **1913 Stars** **Swift**

![](https://raw.githubusercontent.com/andreamazz/AMPopTip/master/assets/screenshot.gif)

- **[MMPopLabel](https://github.com/mgcm/MMPopLabel.git)** **556 Stars** **Objective-C**

![](https://raw.githubusercontent.com/mgcm/MMPopLabel/master/Assets/MMPopLabel-1.png)

- **[FTPopOverMenu](https://github.com/liufengting/FTPopOverMenu.git)** **619 Stars** **Objective-C**

![](https://raw.githubusercontent.com/liufengting/FTResourceRepo/master/Resource/FTPopOverMenu/screenshots.gif)

- **[CMPopTipView](https://github.com/chrismiles/CMPopTipView.git)** **2612 Stars** **Objective-C**

![](https://camo.githubusercontent.com/d953577314aafa7c65d1eb3b15f7fd73c9946d1e/687474703a2f2f6661726d352e7374617469632e666c69636b722e636f6d2f343030352f353139313634313033305f326239336134613535392e6a7067)

- **[CRToast](https://github.com/cruffenach/CRToast.git)** **3942 Stars** **Objective-C**

![](https://github.com/cruffenach/CRToast/raw/master/screenshots/demo.gif)

- **[GHContextMenu](https://github.com/GnosisHub/GHContextMenu.git)** **520 Stars** **Objective-C**

path style menu
![](https://github.com/GnosisHub/GHContextMenu/raw/master/cmocv.gif)

- **[AwesomeMenu](https://github.com/levey/AwesomeMenu.git)** **5125 Stars** **Objective-C**

path style menu

## Animation 各种动画
- **[CBStoreHouseRefreshControl](https://github.com/coolbeet/CBStoreHouseRefreshControl.git)** **3948 Stars** **Objective-C**

![](https://s3.amazonaws.com/suyu.test/CBStoreHouseRefreshControl1.gif)

- **[ZLSwipeableView](https://github.com/zhxnlai/ZLSwipeableView.git)** **2620 Stars** **Objective-C**

![swipe](https://github.com/zhxnlai/ZLSwipeableView/raw/master/Previews/swipe.gif)

- **[YLLongTapShare](https://github.com/liyong03/YLLongTapShare.git)** **472 Stars** **Objective-C**

![](https://github.com/liyong03/YLLongTapShare/raw/master/joy.gif)

- **[VBFJellyView](https://github.com/victorBaro/VBFJellyView.git)** **659 Stars** **Objective-C**

![](https://camo.githubusercontent.com/b0f5afe69dc6620e2f81f447345a67418d107933/68747470733a2f2f6431337961637572716a676172612e636c6f756466726f6e742e6e65742f75736572732f3338313133332f73637265656e73686f74732f313639343335382f7662666a656c6c79766965772e676966)

- **[TinderSimpleSwipeCards](https://github.com/cwRichardKim/TinderSimpleSwipeCards.git)**

![](https://camo.githubusercontent.com/cd6977c1efbd029aa0271a5b9266397c2b910da2/687474703a2f2f696d6775722e636f6d2f7758506e664e322e676966)

- **[CrossNavigation](https://github.com/artemstepanenko/CrossNavigation.git)** **353 Stars** **Objective-C**

不同方向的转场动画
![](https://github.com/artemstepanenko/CrossNavigation/raw/master/README%20Graphics/demo_storyboard.gif)

- **[FastAnimationWithPOP](https://github.com/WilliamZang/FastAnimationWithPOP.git)** **459 Stars** **Objective-C**

![](https://raw.githubusercontent.com/WilliamZang/FastAnimationWithPOP/master/Docs/demo.gif)

- **[CXCardView](https://github.com/ChrisXu1221/CXCardView.git)**

![](https://github.com/ChrisXu/CXCardView/raw/master/demo2.gif)

- **[ICGTransitionAnimation](https://github.com/itsmeichigo/ICGTransitionAnimation.git)** **347 Stars** **Objective-C**

![](https://raw.githubusercontent.com/itsmeichigo/ICGTransitionAnimation/master/Demo.gif)

- **[ZFDragableModalTransition](https://github.com/zoonooz/ZFDragableModalTransition.git)** **2290 Stars** **Objective-C**

![](https://raw.githubusercontent.com/zoonooz/ZFDragableModalTransition/master/Screenshot/ss.gif)

- **[ESConveyorBelt](https://github.com/escoz/ESConveyorBelt.git)** **188 Stars** **Objective-C**

开机启动画面方案，有点像ppt的动画方案
![](https://raw.githubusercontent.com/escoz/ESConveyorBelt/master/ESConveyorBelt.gif)

- **[EAIntroView](https://github.com/ealeksandrov/EAIntroView.git)** **3477 Stars** **Objective-C**

启动引导页方案，样式比较固定
![](https://raw.githubusercontent.com/ealeksandrov/EAIntroView/master/Screenshot01.png)

- **[URBMediaFocusViewController](https://github.com/u10int/URBMediaFocusViewController.git)** **1009 Stars** **Objective-C**

一个图片全屏展示的方案，问题多多。

- **[RQShineLabel](https://github.com/zipme/RQShineLabel.git)** **1674 Stars** **Objective-C**

![](https://raw.githubusercontent.com/zipme/RQShineLabel/master/Screenshots/rqshinelabel.gif)

- **[AMWaveTransition](https://github.com/andreamazz/AMWaveTransition.git)** **2329 Stars** **Objective-C**

![](https://raw.githubusercontent.com/andreamazz/AMWaveTransition/master/assets/screenshot.gif)

- **[SCSiriWaveformView](https://github.com/stefanceriu/SCSiriWaveformView.git)** **830 Stars** **Objective-C**

![](https://camo.githubusercontent.com/3c2fdd91d129aa57622d9acb8a6fec4a20a1d050/68747470733a2f2f64726976652e676f6f676c652e636f6d2f75633f6578706f72743d646f776e6c6f61642669643d3042794c436b554f39306c746f53566c6f4c58524b5343314462456b)

- **[AnimatedTransitionGallery](https://github.com/shu223/AnimatedTransitionGallery.git)** **2220 Stars** **Objective-C**

大量页面切换的动效。
![](https://github.com/shu223/AnimatedTransitionGallery/raw/master/gif/gallery.gif)

- **[MDCSwipeToChoose](https://github.com/modocache/MDCSwipeToChoose.git)** **2465 Stars** **Objective-C**

![](https://camo.githubusercontent.com/07a54fcf8ab7a955c22e58168178a91f800eecb8/687474703a2f2f636c2e6c792f696d6167652f304d316a314a3045307333472f4d44435377697065546f43686f6f73652d76302e322e302e676966)

- **[RPSlidingMenu](https://github.com/RobotsAndPencils/RPSlidingMenu.git)** **893 Stars** **Objective-C**

![](https://camo.githubusercontent.com/79db989540f237a3e0b43a7df8f0645910c33804/687474703a2f2f662e636c2e6c792f6974656d732f3150306c315830443062326b314333543243326f2f323031342d30332d313425323031315f33395f33362e676966)

- **[BRFlabbyTable](https://github.com/brocoo/BRFlabbyTable.git)** **830 Stars** **Objective-C**

![](https://camo.githubusercontent.com/be91b8bb8106725590a370646997ba1a83d7d387/687474703a2f2f692e696d6775722e636f6d2f466c3930724c6d2e706e67)
![](https://camo.githubusercontent.com/aaacbd03c84ecf1148933955a0c94dbaae78a411/687474703a2f2f692e696d6775722e636f6d2f304b6855684d4e2e706e67)

- **[SVGKit](https://github.com/SVGKit/SVGKit.git)** **2866 Stars** **Objective-C**

web svg在iOS端的实现，挺有意思。

- **[KMCGeigerCounter](https://github.com/kconner/KMCGeigerCounter.git)** **1864 Stars** **Objective-C**

一个点击音效。

- **[POP-MCAnimate](https://github.com/matthewcheok/POP-MCAnimate.git)** **948 Stars** **Objective-C**

基于POP的动画扩展。

#### Button

- **[DownloadButton](https://github.com/PavelKatunin/DownloadButton.git)** **1239 Stars** **Objective-C**

![](https://cloud.githubusercontent.com/assets/1636737/7921348/7fadc250-08ad-11e5-9f01-9f7e1f173a97.gif)
![](https://cloud.githubusercontent.com/assets/1636737/7920830/2c4470da-08aa-11e5-99be-e7e9a04479f8.png)

- **[IGLDropDownMenu](https://github.com/bestwnh/IGLDropDownMenu.git)** **1087 Stars** **Objective-C**

可展开按钮集合
![](https://raw.githubusercontent.com/bestwnh/IGLDropDownMenu/master/Screens/IGLDropDownMenuDemo.gif)

- **[VBFPopFlatButton](https://github.com/victorBaro/VBFPopFlatButton.git)** **2859 Stars** **Objective-C**

有动效。
![](https://raw.githubusercontent.com/iBaro/VBFPopFlatButton/master/examples.jpg)

- [AYVibrantButton](https://github.com/a1anyip/AYVibrantButton.git) **1171 Stars** **Objective-C**

![](https://github.com/a1anyip/AYVibrantButton/raw/master/Readme/screenshot.png?raw=true)

- **[BFPaperButton](https://github.com/bfeher/BFPaperButton.git)** **825 Stars** **Objective-C**

![](https://raw.githubusercontent.com/bfeher/BFPaperButton/master/BFPaperButtonDemoGif2.gif)

- **[FRDLivelyButton](https://github.com/sebastienwindal/FRDLivelyButton.git)** **1317 Stars** **Objective-C**

![](https://github.com/sebastienwindal/FRDLivelyButton/raw/master/images/screenshot.gif)

#### Calendar & DatePicker

- **[FSCalendar](https://github.com/WenchaoD/FSCalendar.git)** **5156 Stars** **Objective-C**

![](https://cloud.githubusercontent.com/assets/5186464/10262249/4fabae40-69f2-11e5-97ab-afbacd0a3da2.jpg)
![](https://cloud.githubusercontent.com/assets/5186464/10927681/d2448cb6-82dc-11e5-9d11-f664a06698a7.jpg)

- **[THCalendarDatePicker](https://github.com/hons82/THCalendarDatePicker.git)** **630 Stars** **Objective-C**

![](https://github.com/hons82/THCalendarDatePicker/raw/master/Screenshots/Screenshot1.png?raw=true)

- **[SACalendar](https://github.com/nopshusang/SACalendar.git)** **228 Stars** **Objective-C**

![](https://raw.githubusercontent.com/nopshusang/SACalendar/master/Screenshots/demo.png)

- **[MGConferenceDatePicker](https://github.com/matteogobbi/MGConferenceDatePicker.git)** **391 Stars** **Objective-C**

![](https://camo.githubusercontent.com/2d05d142773041b048ad777201f90d6ac32832bc/687474703a2f2f6935372e74696e797069632e636f6d2f32696c6e3565762e706e67)

- **[FFCalendar](https://github.com/fggeraissate/FFCalendar.git)** **554 Stars** **Objective-C**

![](https://raw.githubusercontent.com/fggeraissate/FFCalendar/master/FFCalendar/FFCalendars/Util/Images/YearlyCalendar.png)
![](https://raw.githubusercontent.com/fggeraissate/FFCalendar/master/FFCalendar/FFCalendars/Util/Images/MonthlyCalendar.png)

## CollectionView
- **[LxGridView](https://github.com/DeveloperLx/LxGridView.git)** **777 Stars** **Objective-C**

一个模仿iOS删除app界面，一个demo。

- **[MGBoxKit](https://github.com/sobri909/MGBoxKit.git)** **1855 Stars** **Objective-C**

相当于flexbox的一个子实现，建议直接使用flex库，比如yoga。

- **[CSStickyHeaderFlowLayout](https://github.com/CSStickyHeaderFlowLayout/CSStickyHeaderFlowLayout.git)** **4771 Stars** **Objective-C**

粘性header footer，实现不好，比较卡。

- **[CHTCollectionViewWaterfallLayout](https://github.com/chiahsien/CHTCollectionViewWaterfallLayout.git)** **3425 Stars** **Objective-C**

一种瀑布流实现。

- **[RACollectionViewReorderableTripletLayout](https://github.com/ra1028/RACollectionViewReorderableTripletLayout.git)** **1389 Stars** **Objective-C**

一个排序CollectionViewLayout实现，实现比较好可以作为参考。

- **[MJParallaxCollectionView](https://github.com/mayuur/MJParallaxCollectionView.git)** **1279 Stars** **Objective-C**

图片列表，没什么参考意义。

- **[DZNEmptyDataSet](https://github.com/dzenbot/DZNEmptyDataSet.git)** **9249 Stars** **Objective-C**

swizzle了reload方法来检测是否为空列表，从而来显示空状态。由于使用了黑科技，可能会对其他内容会有未知影响。

- **[CCFoldCell](https://github.com/bref-Chan/CCFoldCell.git)** **327 Stars** **Objective-C**

折叠动画

## Color
- **[Chameleon](https://github.com/ViccAlexander/Chameleon.git)** **9998 Stars** **Objective-C**

扁平化颜色集合。

- **[color](https://github.com/thisandagain/color.git)** **544 Stars** **Objective-C**

UIColor扩展。

- **[Colours](https://github.com/bennyguitar/Colours.git)** **2913 Stars** **Objective-C**

一种比较漂亮的颜色集合，以及一些颜色转换方法。

## UIController
- **[FDFullscreenPopGesture](https://github.com/forkingdog/FDFullscreenPopGesture.git)** **4379 Stars** **Objective-C**

全屏手势返回。通过KVC获取target，然后设置为第三方gesture的target，从而实现gesture替换的效果。

- **[PKRevealController](https://github.com/pkluz/PKRevealController.git)** **3950 Stars** **Objective-C**

- **[ECSlidingViewController](https://github.com/ECSlidingViewController/ECSlidingViewController.git)** **4447 Stars** **Objective-C**

Android风格侧滑抽屉
![](https://camo.githubusercontent.com/1570836e1f24c4567dde8dbe7466830897ce5bd1/687474703a2f2f692e696d6775722e636f6d2f574248595a55662e706e67)

- **[SWRevealViewController](https://github.com/John-Lluch/SWRevealViewController.git)** **4295 Stars** **Objective-C**

![](https://camo.githubusercontent.com/087f15627e48f65697027176502bf942c69fd887/68747470733a2f2f7261772e6769746875622e636f6d2f4a6f686e2d4c6c7563682f535752657665616c56696577436f6e74726f6c6c65722f6d61737465722f52657665616c436f6e74726f6c6c657250726f6a656374335f622e706e67)

- **[BTSimpleSideMenu](https://github.com/balram3429/BTSimpleSideMenu.git)** **406 Stars** **Objective-C**

![](https://raw.githubusercontent.com/balram3429/btSimpleSideMenu/master/btSimpleSideMenuDemo/raw/btSimpleSideMenu.png)

- **[RESideMenu](https://github.com/romaonthego/RESideMenu.git)** **7037 Stars** **Objective-C**

![](https://raw.githubusercontent.com/romaonthego/RESideMenu/master/Demo.gif?2)

- **[CYLTabBarController](https://github.com/ChenYilong/CYLTabBarController.git)** **3688 Stars** **Objective-C**

利用KVC修改系统tabbar，由于是私有api，可能不安全，不是特别建议。
![](https://camo.githubusercontent.com/bfa193ecd59323f8512b1c73ed35783b1a5feaad/68747470733a2f2f7777312e73696e61696d672e636e2f6c617267652f303036744e6252776c7931666739687536716e776267333038763067637463632e676966)

- **[TLYShyNavBar](https://github.com/telly/TLYShyNavBar.git)** **3373 Stars** **Objective-C**

![](https://github.com/telly/TLYShyNavBar/raw/master/resources/battle-tested-demo.gif)

- **[AXWebViewController](https://github.com/devedbox/AXWebViewController.git)** **220 Stars** **Objective-C**

![](https://camo.githubusercontent.com/42bbb3315ca1ed1edc42dd3cc7f451c3e78e2bad/687474703a2f2f7777332e73696e61696d672e636e2f6c617267652f6432323937626432677731663577706e69657a7170673230396f3068343471722e676966)

- **[VCTransitionsLibrary](https://github.com/ColinEberhardt/VCTransitionsLibrary.git)** **4203 Stars** **Objective-C**

多种页面切换动画。

- **[PYSearch](https://github.com/iphone5solo/PYSearch.git)** **2452 Stars** **Objective-C**

![](https://github.com/iphone5solo/learngit/raw/master/imagesForPYSearch/PYSearchDemo.gif)

## Chart
- [iOS-Echarts](https://github.com/Pluto-Y/iOS-Echarts.git) **1306 Stars** **Objective-C**
- [YKLineChartView](https://github.com/chenyk0317/YKLineChartView.git) **611 Stars** **Objective-C**

分时k线图

- [ANDLineChartView](https://github.com/anaglik/ANDLineChartView.git) **410 Stars** **Objective-C**
- [BEMSimpleLineGraph](https://github.com/Boris-Em/BEMSimpleLineGraph.git) **2631 Stars** **Objective-C**
- [PNChart](https://github.com/kevinzhow/PNChart.git) **8828 Stars** **Objective-C**
- [JSQMessagesViewController](https://github.com/jessesquires/JSQMessagesViewController.git) **10786 Stars** **Objective-C**

## Chat
- [ChatKit-OC](https://github.com/leancloud/ChatKit-OC.git) **1797 Stars** **Objective-C**
- [iosMath](https://github.com/kostub/iosMath.git) **661 Stars** **Objective-C**

数学公式

- [Atlas-iOS](https://github.com/layerhq/Atlas-iOS.git) **3672 Stars** **Objective-C**
- [ChatSecure-iOS](https://github.com/ChatSecure/ChatSecure-iOS.git) **2462 Stars** **Objective-C**
- [Messenger](https://github.com/relatedcode/Messenger.git) **2819 Stars** **Objective-C**
- [JBChartView](https://github.com/Jawbone/JBChartView.git) **3721 Stars** **Objective-C**
- [FishChat](https://github.com/yulingtianxia/FishChat.git) **715 Stars** **Objective-C**
- [LLWeChat](https://github.com/gyjzh/LLWeChat.git) **924 Stars** **Objective-C**

## ImagePicker
- [TZImagePickerController](https://github.com/banchichen/TZImagePickerController.git) **3779 Stars** **Objective-C**
- [PYPhotoBrowser](https://github.com/iphone5solo/PYPhotoBrowser.git) **1569 Stars** **Objective-C**
- [ZLPhotoBrowser](https://github.com/longitachi/ZLPhotoBrowser.git) **1239 Stars** **Objective-C**
- [MWPhotoBrowser](https://github.com/mwaterfall/MWPhotoBrowser.git) **7740 Stars** **Objective-C**
- [RSKImageCropper](https://github.com/ruslanskorb/RSKImageCropper.git) **1835 Stars** **Objective-C**
- [UzysAssetsPickerController](https://github.com/uzysjung/UzysAssetsPickerController.git) **747 Stars** **Objective-C**
- [DBCamera](https://github.com/danielebogo/DBCamera.git) **1268 Stars** **Objective-C**
- [PhotoZoom](https://github.com/brennanMKE/PhotoZoom.git)
- [TKImageView](https://github.com/3tinkers/TKImageView.git) **261 Stars** **Objective-C**

图片裁剪

## ImageView
- [FLAnimatedImage](https://github.com/Flipboard/FLAnimatedImage.git) **6081 Stars** **Objective-C**
- [YLGIFImage](https://github.com/liyong03/YLGIFImage.git) **1676 Stars** **Objective-C**

## Layout
- [iCarousel](https://github.com/nicklockwood/iCarousel.git) **9837 Stars** **Objective-C**
- [MyLinearLayout](https://github.com/youngsoft/MyLinearLayout.git) **2373 Stars** **Objective-C**
- [OAStackView](https://github.com/oarrabi/OAStackView.git)
- [SDAutoLayout](https://github.com/gsdios/SDAutoLayout.git) **4755 Stars** **Objective-C**
- [PureLayout](https://github.com/PureLayout/PureLayout.git) **6640 Stars** **Objective-C**
- **[Masonry](https://github.com/SnapKit/Masonry.git)** **15454 Stars** **Objective-C**
- [FDStackView](https://github.com/forkingdog/FDStackView.git) **2310 Stars** **Objective-C**
- [FlexBoxLayout](https://github.com/LPD-iOS/FlexBoxLayout.git) **134 Stars** **C**
- [yoga](https://github.com/facebook/yoga.git) **8424 Stars** **JavaScript**
- [layout](https://github.com/schibsted/layout.git) **1029 Stars** **Swift**

### Layout-DSL
- [VKCssProtocol](https://github.com/Awhisper/VKCssProtocol.git) **64 Stars** **Objective-C**


## Keyboard
- [IHKeyboardAvoiding](https://github.com/IdleHandsApps/IHKeyboardAvoiding.git) **1002 Stars** **Swift**
- [IQKeyboardManager](https://github.com/hackiftekhar/IQKeyboardManager.git) **9988 Stars** **Objective-C**
- [CYRKeyboardButton](https://github.com/illyabusigin/CYRKeyboardButton.git) **333 Stars** **Objective-C**

## Map
- [FBAnnotationClustering](https://github.com/infinum/FBAnnotationClustering.git) **730 Stars** **Objective-C**

## NavigationBar
- [BMYScrollableNavigationBar](https://github.com/beamly/BMYScrollableNavigationBar.git) **642 Stars** **Objective-C**

修改NavigationBar的frame来达到和滚动行为同步，没有参考价值。

- [KMNavigationBarTransition](https://github.com/MoZhouqi/KMNavigationBarTransition.git) **2144 Stars** **Objective-C**

将真正的NavigationBar的背景等转移到fake bar上，fake bar加在controller.view上，来达到这种效果。微信的实现

- [RTRootNavigationController](https://github.com/rickytan/RTRootNavigationController.git) **895 Stars** **Objective-C**

使用UINavigationController包裹一层，从而达到每个controller的NavigationBar是独立的。云音乐的实现。

- [JZNavigationExtension](https://github.com/JazysYu/JZNavigationExtension.git) **1194 Stars** **Objective-C**

和KMNavigationBarTransition类似，只是并不是直接使用UINavigationBar来做fake bar，而是采用截屏+addLayer来做。

## News
- **[TTNews](https://github.com/577528249/TTNews.git)** **635 Stars** **Objective-C**

一个demo性质的东西。

- **[bilibili-mac-client](https://github.com/typcn/bilibili-mac-client.git)** **2954 Stars** **Objective-C**

## Password
- **[SmileTouchID](https://github.com/liu044100/SmileTouchID.git)** **513 Stars** **Objective-C**

一个登录界面实现。

- **[VENTouchLock](https://github.com/venmo/VENTouchLock.git)** **983 Stars** **Objective-C**

Touch ID和key chain共同实现验证的功能。

- **[LTHPasscodeViewController](https://github.com/rolandleth/LTHPasscodeViewController.git)** **593 Stars** **Objective-C**

密码及界面
![](https://camo.githubusercontent.com/a7d667b8a1e095e61cc138d58b0ac75beb208ee8/68747470733a2f2f726f6c616e646c6574682e636f6d2f696d616765732f696f73372d7374796c652d70617373636f64652f73637265656e73686f742e706e67)

- **[onepassword-app-extension](https://github.com/AgileBits/onepassword-app-extension.git)**

## PDF
- **[GreatReader](https://github.com/semweb/GreatReader.git)** **542 Stars** **Objective-C**

一个功能完善的PDF阅读器，但是有些小问题。

- **[Reader](https://github.com/vfr/Reader.git)** **3907 Stars** **Objective-C**

一个比较完善的PDF组件，包含图片、链接。利用了CATiledLayer来分块绘制，优化性能。

- **[UXReader-iOS](https://github.com/vfr/UXReader-iOS.git)**

同Reader，但是是基于PDFium的实现。

## Progress
- **[MBProgressHUD](https://github.com/jdg/MBProgressHUD.git)** **13760 Stars** **Objective-C**

非常有名的loading。

- **[SVProgressHUD](https://github.com/SVProgressHUD/SVProgressHUD.git)** **10193 Stars** **Objective-C**

非常有名的loading。

SV与MB，MB功能更加多一些，SV设计上更好一点，各有优势。

- **[MRProgress](https://github.com/mrackwitz/MRProgress.git)** **2580 Stars** **Objective-C**

多种样式loading。

- **[JGProgressHUD](https://github.com/JonasGessner/JGProgressHUD.git)** **1911 Stars** **Objective-C**

![](https://github.com/JonasGessner/JGProgressHUD/raw/master/Examples/Screenshots/demo2.gif)

- **[NJKWebViewProgress](https://github.com/ninjinkun/NJKWebViewProgress.git)** **3733 Stars** **Objective-C**

![](https://camo.githubusercontent.com/082fc708cc461dc53832b7d14d5affdf475dd57b/68747470733a2f2f7261772e6769746875622e636f6d2f6e696e6a696e6b756e2f4e4a4b5765625669657750726f67726573732f6d61737465722f44656d6f4170702f53637265656e73686f742f73637265656e73686f74312e706e67)

- **[M13ProgressSuite](https://github.com/Marxon13/M13ProgressSuite.git)** **3582 Stars** **Objective-C**

非常丰富的多样式loading以及progress。

- **[UAProgressView](https://github.com/UrbanApps/UAProgressView.git)** **971 Stars** **Objective-C**

![](https://raw.githubusercontent.com/UrbanApps/UAProgressView/assets/UAProgressView.gif)

- **[MRCircularProgressView](https://github.com/martinezdelariva/MRCircularProgressView.git)** **113 Stars** **Objective-C**

![](https://camo.githubusercontent.com/e664b47382d41a876b05fdb3744b2be7dd3bfe53/68747470733a2f2f7261772e6769746875622e636f6d2f6d617274696e657a64656c61726976612f4d5243697263756c617250726f6772657373566965772f6d61737465722f766964656f2e676966)

- **[ASProgressPopUpView](https://github.com/alskipp/ASProgressPopUpView.git)** **1124 Stars** **Objective-C**

![screenshot](http://alskipp.github.io/ASProgressPopUpView/img/screenshot1.gif)

- **[ASValueTrackingSlider](https://github.com/alskipp/ASValueTrackingSlider.git)** **1716 Stars** **Objective-C**

![screenshot](http://alskipp.github.io/ASValueTrackingSlider/img/screenshot1.gif)

- **[YLProgressBar](https://github.com/yannickl/YLProgressBar.git)** **1041 Stars** **Objective-C**

![](https://github.com/YannickL/YLProgressBar/raw/master/web/YLProgressBar.gif)

#### Push
- **[Knuff](https://github.com/KnuffApp/Knuff.git)** **3875 Stars** **Objective-C**

工具：The debug application for Apple Push Notification Service (APNs).

## Refresh
- [MJRefresh](https://github.com/CoderMJLee/MJRefresh.git) **10994 Stars** **Objective-C**
- [INSPullToRefresh](https://github.com/inspace-io/INSPullToRefresh.git) **846 Stars** **Objective-C**
- [UzysAnimatedGifPullToRefresh](https://github.com/uzysjung/UzysAnimatedGifPullToRefresh.git) **1404 Stars** **Objective-C**
- [XHRefreshControl](https://github.com/xhzengAIB/XHRefreshControl.git) **700 Stars** **Objective-C**
- [EGOTableViewPullRefresh](https://github.com/enormego/EGOTableViewPullRefresh.git) **3347 Stars** **Objective-C**

## ScrollView
- [SDCycleScrollView](https://github.com/gsdios/SDCycleScrollView.git) **4297 Stars** **Objective-C**
- [LazyScrollView](https://github.com/alibaba/LazyScrollView.git) **1089 Stars** **Objective-C**
- [CustomScrollView](https://github.com/ole/CustomScrollView.git) **135 Stars** **Objective-C**

## TextView
- [SlackTextViewController](https://github.com/slackhq/SlackTextViewController.git) **7991 Stars** **Objective-C**
- [KIInPlaceEdit](https://github.com/kaiinui/KIInPlaceEdit.git) **124 Stars** **Objective-C**
- [ARAutocompleteTextView](https://github.com/alexruperez/ARAutocompleteTextView.git) **259 Stars** **Objective-C**
- [HTAutocompleteTextField](https://github.com/hoteltonight/HTAutocompleteTextField.git) **1068 Stars** **Objective-C**
- [JVFloatLabeledTextField](https://github.com/jverdi/JVFloatLabeledTextField.git) **6473 Stars** **Objective-C**
- [YetiCharacterLabelExample](https://github.com/hulsizer/YetiCharacterLabelExample.git) **361 Stars** **Objective-C**
- [AnimatedTextInput](https://github.com/jobandtalent/AnimatedTextInput.git) **481 Stars** **Swift**
- [ZSSRichTextEditor](https://github.com/nnhubbard/ZSSRichTextEditor.git) **2592 Stars** **Objective-C**
- [TTTAttributedLabel](https://github.com/TTTAttributedLabel/TTTAttributedLabel.git) **7779 Stars** **Objective-C**
- [dynamiccharts](https://github.com/FlowForwarding/dynamiccharts.git) **213 Stars** **Objective-C**
- [DTCoreText](https://github.com/Cocoanetics/DTCoreText.git) **5127 Stars** **Objective-C**

## TableView
- **[UITableView-FDTemplateLayoutCell](https://github.com/forkingdog/UITableView-FDTemplateLayoutCell.git)** **8118 Stars** **Objective-C**

利用[view sizeFittingSize:UILayoutFittingCompressedSize]来计算最小高度。

- **[MGSwipeTableCell](https://github.com/MortimerGoro/MGSwipeTableCell.git)** **5765 Stars** **Objective-C**

左右滑动删除实现，需要继承于其cell。
![](https://raw.githubusercontent.com/MortimerGoro/MGSwipeTableCell/master/readme-assets/border.gif)

- **[SWRevealTableViewCell](https://github.com/John-Lluch/SWRevealTableViewCell.git)** **440 Stars** **Objective-C**

左右滑动删除实现，需要继承于其cell。
![](https://cloud.githubusercontent.com/assets/1282248/3996276/e64e2efa-2933-11e4-8d4f-1072d6de9b6f.gif)

- **[SWTableViewCell](https://github.com/CEWendel/SWTableViewCell.git)** **6901 Stars** **Objective-C**

左右滑动删除实现，需要继承于其cell。
![](https://camo.githubusercontent.com/c138fcd3df24ae1d91f8bf6feb51a1cf111606a4/687474703a2f2f692e696d6775722e636f6d2f6e6a4b436a4b382e676966)

- **[FXForms](https://github.com/nicklockwood/FXForms.git)** **3020 Stars** **Objective-C**

利用model直接布局tableView的方案，比如登录、注册这种页面，难以定制化。

## Label
- **[UICountingLabel](https://github.com/dataxpress/UICountingLabel.git)** **1223 Stars** **Objective-C**

![](https://github.com/dataxpress/UICountingLabel/raw/master/demo.gif)

- **[KILabel](https://github.com/Krelborn/KILabel.git)** **412 Stars** **Objective-C**

一个比较好用的扩展UILabel富文本支持，但是也有一些bug没有修复。

## Other
- **[timeLineiOS](https://github.com/romaHerman/timeLineiOS.git)** **616 Stars** **Objective-C**

时间线
![](https://github.com/romaHerman/timeLineiOS/raw/master/output_ppeLRI.gif)

- **[DGCuteHelper](https://github.com/Desgard/DGCuteHelper.git)** **32 Stars** **Objective-C**

粘性效果
![](https://github.com/Desgard/DGCuteHelper/raw/master/Image/screenshot.gif)

- **[MotionBlur](https://github.com/fastred/MotionBlur.git)** **1481 Stars** **Objective-C**

快速移动时候的模糊效果。利用了CoreImage的自定义Filter，利用了`Core Image Kernel Language`，有点像OpenGL的`GLSL`。

- **[StackBluriOS](https://github.com/tomsoft1/StackBluriOS.git)** **565 Stars** **Objective-C**

近似高斯模糊算法

- **[FXBlurView](https://github.com/nicklockwood/FXBlurView.git)** **4984 Stars** **Objective-C**

利用vImage进行模糊。

- **[AsyncDisplayKit](https://github.com/facebook/AsyncDisplayKit.git)**
- **[Texture](https://github.com/TextureGroup/Texture.git)** **2004 Stars** **Objective-C**

就是AsyncDisplayKit

- **[KZLineDrawer](https://github.com/krzysztofzablocki/KZLineDrawer.git)**

利用cocos2d来手指画图，达到流畅的效果。

- **[UberSignature](https://github.com/uber/UberSignature.git)** **337 Stars** **Objective-C**

一种签名实现。
![](https://github.com/uber/UberSignature/raw/master/sign.gif)

- **[XXNibBridge](https://github.com/sunnyxx/XXNibBridge.git)** **486 Stars** **Objective-C**

一种在nib中动态load另一个nib中的内容的实现。

----

# Debug
- **[FLEX](https://github.com/Flipboard/FLEX.git)** **8426 Stars** **Objective-C**

一款非常完善的内置debug工具。包含视图查看、log、查看沙盒数据等等功能。

- **[RHObjectiveBeagle](https://github.com/heardrwt/RHObjectiveBeagle.git)**

已被删除

- **[CocoaLumberjack](https://github.com/CocoaLumberjack/CocoaLumberjack.git)** **9483 Stars** **Objective-C**

非常有名的log工具

- **[BugshotKit](https://github.com/marcoarment/BugshotKit.git)** **1369 Stars** **Objective-C**

bug反馈，截屏功能。

- **[Clue](https://github.com/Geek-1001/Clue.git)** **238 Stars** **Objective-C**

在一个bug反馈前，收集用户信息，包括录制视频。

- **[MLeaksFinder](https://github.com/Zepo/MLeaksFinder)**

依赖`FBRetainCycleDetector`来做的内存泄露分析。

- **[GYBootingProtection](https://github.com/liuslevis/GYBootingProtection.git)** **673 Stars** **Objective-C**

开机启动自修复，判定开机崩溃，进入修复流程。微信就有这样的功能。

- **[DBDebugToolkit](https://github.com/dbukowski/DBDebugToolkit.git)** **560 Stars** **Objective-C**

一个比较完善的debug工具集。

- **[IPAPatch](https://github.com/Naituw/IPAPatch.git)** **2003 Stars** **Objective-C**

不需要越狱注入其他app的工具。

- **[NetworkEye](https://github.com/coderyi/NetworkEye.git)** **1005 Stars** **Objective-C**

利用NSURLProtocol来观察网络请求状况，是一个内置的查看工具。

- **[FBSimulatorControl](https://github.com/facebook/FBSimulatorControl.git)** **2078 Stars** **Objective-C**

多模拟器选择。

- **[LifetimeTracker](https://github.com/krzysztofzablocki/LifetimeTracker.git)** **621 Stars** **Swift**

利用了associate object来监测对象生命周期，局限性太大。不过可能会持续更新

- **[FBMemoryProfiler](https://github.com/facebook/FBMemoryProfiler.git)** **2757 Stars** **Objective-C**

利用`FBRetainCycleDetector`和`FBAllocationTracker`做的一款工具，增加UI界面。

- **[FBRetainCycleDetector](https://github.com/facebook/FBRetainCycleDetector.git)** **2633 Stars** **Objective-C++**

利用objc的特性，利用Object、block等的属性布局收集强引用信息。

- **[FBAllocationTracker](https://github.com/facebook/FBAllocationTracker.git)** **792 Stars** **Objective-C++**

hook了`+alloc`和`-dealloc`来统计objc对象使用情况。

- [iOS-Hierarchy-Viewer](https://github.com/glock45/iOS-Hierarchy-Viewer.git) **1305 Stars** **C**

iOS视图结构查看器，需要通过http查看，还包括core data查看。
![](https://camo.githubusercontent.com/8e3e960a51e023472a06691ef0157a75c38d809d/687474703a2f2f692e737461636b2e696d6775722e636f6d2f796e7176472e706e67)

- **[libimobiledevice](https://github.com/libimobiledevice/libimobiledevice.git)** **1602 Stars** **C**

和设备通信的类库。

# Test
- **[ocmock](https://github.com/erikdoe/ocmock.git)** **1558 Stars** **Objective-C**

使用NSProxy对象替代原本的对象，在response和forward中记录和处理、转发消息来实现，是非常好用的mock类库。由于完全依赖oc的动态特性，所以对swift类无效。

- **[OCMockito](https://github.com/jonreid/OCMockito)**

类似于ocmock，关注度不高。

- **[KIF](https://github.com/kif-framework/KIF.git)** **5049 Stars** **Objective-C**

利用了私有方法，在非UI Unit test中进行UI测试。

- **[expecta](https://github.com/specta/expecta.git)** **1406 Stars** **Objective-C**
- **[specta](https://github.com/specta/specta.git)** **2058 Stars** **Objective-C**
- **[cedar](https://github.com/pivotal/cedar.git)** **1141 Stars** **Objective-C++**
- **[Kiwi](https://github.com/kiwi-bdd/Kiwi.git)** **3671 Stars** **Objective-C**

以上几种都是BDD方式的封装。

- **[OCHamcrest](https://github.com/hamcrest/OCHamcrest.git)** **638 Stars** **Objective-C**

可以认为是一些语法糖

- **[Nocilla](https://github.com/luisobo/Nocilla.git)** **1789 Stars** **Objective-C**

hook http请求

- **[Nimble](https://github.com/Quick/Nimble.git)** **2403 Stars** **Swift**

知名度比较高的测试断言库。

- **[Quick](https://github.com/Quick/Quick.git)** **6876 Stars** **Swift**

知名度比较高的BDD。

# React

- [react-native-maps](https://github.com/airbnb/react-native-maps.git) **5462 Stars** **Objective-C**

# Other
- [MonkeyDev](https://github.com/AloneMonkey/MonkeyDev.git) **847 Stars** **Objective-C**
- [CYLTabBarController](https://github.com/ChenYilong/CYLTabBarController.git) **3688 Stars** **Objective-C**
- [detect.location](https://github.com/KrauseFx/detect.location.git) **821 Stars** **Objective-C**
- [WeChatTweak-macOS](https://github.com/Sunnyyoung/WeChatTweak-macOS.git) **1165 Stars** **Objective-C**
- [FlatUIKit](https://github.com/Grouper/FlatUIKit.git) **7648 Stars** **Objective-C**
- [JLPermissions](https://github.com/jlaws/JLPermissions.git) **403 Stars** **Objective-C**

应用权限

- [ZXingObjC](https://github.com/TheLevelUp/ZXingObjC.git) **2497 Stars** **Objective-C**

二维码

- [SAMKeychain](https://github.com/soffes/SAMKeychain.git) **4556 Stars** **Objective-C**
- [SimulateIDFA](https://github.com/youmi/SimulateIDFA.git) **229 Stars** **Objective-C**
- [ohana-ios](https://github.com/uber/ohana-ios.git) **341 Stars** **Objective-C**

通讯录

- [class-dump](https://github.com/nygard/class-dump.git) **1727 Stars** **Objective-C**
- [DarkLightning](https://github.com/jensmeder/DarkLightning.git) **168 Stars** **Swift**

雷电口传输数据

- [peertalk](https://github.com/rsms/peertalk.git) **2042 Stars** **Objective-C**

USB数据传输

- [MMWormhole](https://github.com/mutualmobile/MMWormhole.git) **3296 Stars** **Objective-C**

app和extension的数据传输

- [MALoggingViewController](https://github.com/mamaral/MALoggingViewController.git) **51 Stars** **Objective-C**
- [ios-simulator-app-installer](https://github.com/stepanhruda/ios-simulator-app-installer.git) **238 Stars** **Objective-C**
- [KZPlayground](https://github.com/krzysztofzablocki/KZPlayground.git) Playground for Objective-C
- [PunchClock](https://github.com/panicinc/PunchClock.git) **1707 Stars** **Objective-C**
- [PonyDebugger](https://github.com/square/PonyDebugger.git) **5462 Stars** **Objective-C**

使用Chrome来debug view

- [MLPNeuralNet](https://github.com/nikolaypavlov/MLPNeuralNet.git) **917 Stars** **Objective-C**
- [GCDWebServer](https://github.com/swisspol/GCDWebServer.git) **3568 Stars** **Objective-C**
- [CocoaHTTPServer](https://github.com/robbiehanson/CocoaHTTPServer.git) **4297 Stars** **Objective-C**
- [radiant-player-mac](https://github.com/radiant-player/radiant-player-mac.git) **3006 Stars** **Objective-C**

音乐播放器for mac

- [ARAnalytics](https://github.com/orta/ARAnalytics.git) **1674 Stars** **Objective-C**
- [Onboard](https://github.com/mamaral/Onboard.git) **5774 Stars** **Objective-C**
- [electrino](https://github.com/pojala/electrino.git) **2601 Stars** **Objective-C**
