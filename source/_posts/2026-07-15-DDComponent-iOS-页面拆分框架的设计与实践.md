---
title: DDComponent：iOS 页面拆分框架的设计与实践
date: 2026-07-15 00:00:00
categories:
- 文章
tags:
- iOS
- 架构
- MVP
- 组件化
---

> 面对日益复杂的业务页面，如何将巨石 ViewController 拆解为可独立开发、独立测试、跨页面复用的功能模块？本文介绍 DDComponent 框架从设计思想到落地实践的全过程，涵盖 MVP 模式重定义、双树架构、状态驱动更新、增量 Diff、自动绑定、通信机制、拆分粒度控制等核心话题。

---

## 一、痛点与目标：为什么需要页面拆分？

### 1.1 业务复杂度失控

随着业务迭代，一个页面往往承载了多个方向的业务逻辑——点赞、评论、分享、播放、埋点、广告……所有逻辑混在一个 ViewController 或一个巨大的 Presenter 中，所有人都在改同一个文件，导致：

- **协作冲突频发**：多人并行开发同一页面时，Git 冲突几乎不可避免
- **复杂度线性增长**：每新增一个功能，文件的认知负荷就增加一分，最终变得无人能完整理解
- **发布耦合**：所有功能被卡在同一个文件的开发节奏上，A 功能的延期拖累 B 功能上线

### 1.2 功能边界模糊

当所有逻辑纠缠在一起，功能之间的边界逐渐消失，形成代码中的「三不管地带」：

- 没有人愿意对这块代码的质量负责
- 修改一个功能时，很容易意外破坏另一个功能
- 代码评审变得形式化——因为评审者也理不清逻辑

这不是开发者能力的问题，而是**架构层面缺乏有效的拆分手段**。

### 1.3 跨 App 复用的困境

在大型产品矩阵中，同一功能逻辑常常需要在不同 App 中呈现不同的 UI。例如：

- 底层逻辑完全一致（点赞接口、状态管理、错误处理）
- 但 UI 差异巨大（不同 App 有不同设计规范、不同交互方式）

如果没有良好的抽象，开发者只能选择复制代码修改 UI，或者用 `if-else` 分支污染业务逻辑。

### 1.4 框架的设计目标

基于以上痛点，我们确立了 DDComponent 的核心目标：

1. **标准化拆分**：提供统一的页面功能拆分框架，让每个开发者都能以一致的方式拆解页面
2. **动态插拔**：支持运行时动态装配功能模块，不同页面可以按需组合
3. **UI 灵活绑定**：View 层与逻辑层解耦，同一套逻辑可以绑定不同的 UI 实现
4. **高度可复用**：模块设计以复用为第一原则，一次开发，多处使用

---

## 二、核心思想：重新理解 MVP

### 2.1 传统 MVP 的走样

MVP（Model-View-Presenter）在移动端已经流行多年，但在实际使用中常常走样：

- Presenter 变成「第二个 ViewController」，承载了所有逻辑和部分视图管理职责
- View 和 Presenter 之间通过复杂的协议和回调耦合，牵一发而动全身
- 名义上遵循 MVP，实际上耦合度反而更高了

问题的根源在于：**对 Presenter 和 View 的职责界定不清，以及缺乏有效的组合机制**。

### 2.2 Presenter = 业务逻辑的抽象

在 DDComponent 中，我们对 Presenter 给出了明确的定义：

> Presenter 是**业务逻辑的抽象单元**，是对逻辑的复用。它很像 MVC 中的 Controller，但和 MVVM 中的 ViewModel 并不相同——ViewModel 更侧重于数据驱动和双向绑定，而 Presenter 侧重于**逻辑的封装与组合**。

一个健康的 Presenter 应该满足：

- **职责单一**：只负责一个明确的业务能力（如点赞、评论、埋点）
- **边界清晰**：对外暴露的接口干净，内部实现可以自由变更
- **可独立存在**：脱离当前页面，可以被另一个页面直接使用

**判断标准**：如果 Presenter 提供的功能很多，且被多方向的业务逻辑耦合，无法对逻辑进行合理收敛，说明这个 Presenter 的设计是不合理的。

### 2.3 View = 数据的消费终点，而非 UIView

这是 DDComponent 中最关键的认知转变：

> 在 MVP 中，View 不能等价于 UIView。View 表示的是**数据展示和消费的终点**，可以是 UI，也可以是其他任何东西。因此 View 一般都是**协议**，而非实体类型。

这个定义带来了极大的灵活性：

- **View 是 UIView**：最常见的情况，用户可见的界面元素
- **View 是服务**：例如埋点服务 `TraceService`，Presenter 通过 View 协议向它传递数据
- **View 是 Void**：当 `View = Void` 时，Presenter 就是一个纯逻辑模块，没有任何视图依赖，但仍然可以享受生命周期管理、通信机制等框架能力

```swift
// View 是 UI —— 协议而非具体类型
protocol LikeViewProtocol: AnyObject {
    var isLiked: Bool { get set }
    var likeCount: Int { get set }
    var onLikeTapped: (() -> Void)? { get set }
}

// View 是服务 —— 数据消费端
protocol TraceService {
    func trace(_ dict: [String: Any])
}

// View 是 Void —— 纯逻辑模块
class BackgroundTaskPresenter: ViewPresenter<Void> {
    // 无需 UI，但拥有完整的生命周期和通信能力
}
```

### 2.4 两个核心示例

**示例一：LikePresenter —— 功能封装 + 多 UI 绑定**

```swift
class LikePresenter: ViewPresenter<LikeViewProtocol> {

    struct LikeInfo {
        var isLiked: Bool = false
        var likeCount: Int = 0
    }

    var _likeInfo = LikeInfo()
    var likeInfo: LikeInfo {
        set { setState { _likeInfo = newValue } }
        get { _likeInfo }
    }

    func toggleLike() {
        guard let service = getService(LikeService.self) else { return }
        service.toggleLike(likeInfo) { [weak self] result in
            self?.likeInfo = result
            self?.notifyGlobal(listener: LikePresenterListener.self) {
                $0.onLikeInfoChanged(presenter: self!, ...)
            }
        }
    }

    override func onBindView(_ view: LikeViewProtocol) {
        super.onBindView(view)
        view.onLikeTapped = { [weak self] in self?.toggleLike() }
    }

    override func onUnbindView() {
        super.onUnbindView()
        view?.onLikeTapped = nil
    }
}
```

同一个 LikePresenter 可以绑定任何实现了 `LikeViewProtocol` 的视图：

```swift
// 大按钮风格
class BigLikeButton: UIView, LikeViewProtocol { ... }

// 小按钮风格
class SmallLikeButton: UIView, LikeViewProtocol { ... }

// 绑定不同的 View
if useBigStyle {
    likePresenter.bindView(bigLikeButton)
} else {
    likePresenter.bindView(smallLikeButton)
}
```

**示例二：LifecycleTracePresenter —— View 即服务**

```swift
class LifecycleTracePresenter: ViewPresenter<TraceService> {

    override func onAttach(presenter: ViewPresentable) {
        super.onAttach(presenter: presenter)
        // View 是服务，Attach 时立即绑定
        bindView(getService(TraceService.self)!)
    }

    override func onDetach() {
        super.onDetach()
        unbindView()
    }

    func viewDidDisappear(_ animated: Bool) {
        trace(["event": "page_view_end"])
    }

    private func trace(_ dict: [String: Any]) {
        var infos = dict
        infos.merge(extraInfos)
        view?.trace(infos)
    }
}
```

这里 `TraceService` 是 View 的类型参数，Presenter 把它当作数据的消费方，而不是 UI。这种模式在埋点、日志、监控等场景中非常实用。

---

## 三、架构基石：双树结构与生命周期

### 3.1 P-Tree：Presenter 组成的逻辑树

DDComponent 的核心架构是**双树结构**。P-Tree 是 Presenter 组合而成的树，代表页面的功能逻辑组织结构。

```
RootPresenter
├── LikePresenter
├── CommentPresenter
│   ├── CommentInputPresenter
│   └── CommentListPresenter
├── SharePresenter
└── LifecycleTracePresenter
```

每个 Presenter 通过 `add(child:)` 加入父节点，形成父子关系。这棵树的根节点有且只有一个 `RootPresenter`，负责持有全局的 UpdatePipeline 和 Service 容器。

### 3.2 V-Tree：View 组成的展示树

V-Tree 是 UI 的展示层，由实际的 UIView 组成。P-Tree 和 V-Tree 之间是**弱耦合**的——它们通过 `bindView(_:)` 手动建立关联。

```
RootView
├── LikeButton (UIView, 实现 LikeViewProtocol)
├── CommentSection (UIView)
│   ├── CommentInput (UIView)
│   └── CommentList (UITableView)
└── ShareButton (UIView)
```

**核心价值**：同一棵 P-Tree 可以挂载不同形态的 V-Tree。这意味着：

- 功能逻辑完全相同的页面，可以有不同的 UI 布局
- 不同 App 只需替换 V-Tree 的实现，P-Tree 无需任何修改
- 功能可以按需装配——不需要的功能直接不安装对应的 Presenter

这在一些功能逻辑相同但 UI 展示不同的页面中，复用程度会非常高。

### 3.3 统一生命周期

每个 Presenter 都有统一的生命周期，分为三个阶段：

**Attach / Detach（树结构生命周期）**

当 Presenter 通过 `add(child:)` 被加入 P-Tree 时，触发 `onAttach(presenter:)`。当通过 `removeFromSuper()` 或 `remove(child:)` 被移出时，触发 `onDetach()`。这个阶段标志着 Presenter 正式成为页面逻辑的一部分。

**BindView / UnbindView（视图绑定生命周期）**

当 Presenter 通过 `bindView(_:)` 绑定 View 时，触发 `onBindView(_:)`。当通过 `unbindView()` 解绑时，触发 `onUnbindView()`。解绑发生在三种情况：

1. 手动调用 `unbindView()`
2. 绑定新的 View（自动先解绑旧的）
3. 页面销毁（递归解绑整棵树）

**UpdateView（视图更新生命周期）**

当数据变更时，通过 `setState { }` 触发更新请求。`onUpdate(view:context:)` 会在合适的时机被调用——这个时机由 Pipeline 控制，包括但不限于：

- 立即更新
- 在下一个 RunLoop 更新
- 列表增量更新场景下，异步 Diff 计算完成后的时机

```
         Attach ←→ Detach
           │
    BindView ←→ UnbindView
           │
    setState { }
           │
   Pipeline 调度
           │
      UpdateView
```

---

## 四、状态驱动的视图更新

### 4.1 为什么需要状态驱动

在传统 iOS 开发中，视图更新通常通过直接设置属性来完成：

```swift
// 传统做法：多处直接修改 View
view.label.text = newTitle
view.button.isHidden = shouldHide
view.imageView.image = newImage
```

这种做法在复杂场景下会带来严重问题：

- **数据不对齐**：多个地方修改同一个视图属性，更新顺序和时机难以保证
- **复用场景失控**：Cell 复用时，旧状态残留在视图上
- **父容器无感知**：子 View 被直接修改后，父容器无法响应（如需要重新计算布局）

DDComponent 的解决方案是借鉴 React 和 SwiftUI 的思想：**把视图视为一个状态机，所有变更通过声明式状态驱动**。

### 4.2 setState 机制

`setState` 是视图更新的唯一入口：

```swift
class AViewPresenter: ViewPresenter<AViewProtocol> {
    var dataA: Any
    var dataB: Any

    func updateData() {
        setState {
            dataA = newValueA
            dataB = newValueB
        }
    }

    // 可以通过属性封装
    var isAVisible: Bool {
        didSet {
            setState {}  // 状态变更，触发视图更新
        }
    }

    // Pipeline 调度后调用此方法
    override func onUpdate(view: AViewProtocol, context: ViewUpdateContext) {
        view.dataA = dataA
        view.dataB = dataB
        view.isAVisible = isAVisible
    }
}
```

`setState` 支持传入 Context 和 completion 来控制更新行为：

```swift
setState {
    _likeInfo = newValue
} context: {
    $0.animated = true           // 动画更新
    $0.invalidateLayout = true   // 需要重新布局
    $0.layoutImmediately = true  // 立即布局
})
```

**`@StateChecker` 属性包装器**

框架还提供了 `@StateChecker` 属性包装器来确保状态修改的安全性：它会在运行时断言检查，确保状态值的修改**必须发生在 `setState { }` 闭包内部**。如果直接在闭包外修改被 `@StateChecker` 标记的属性，会触发 assertion failure：

```swift
class MyPresenter: ViewPresenter<MyViewProtocol> {
    @StateChecker var count: Int = 0

    func increment() {
        count += 1  // ❌ Assertion failure: 必须在 setState 内修改
    }

    func incrementCorrectly() {
        setState {
            count += 1  // ✅ 正确
        }
    }
}
```

### 4.3 UpdatePipeline：全局统一调度

这是框架最巧妙的设计之一。**只有 RootPresenter 持有唯一的 Pipeline 实例**，所有子 Presenter 的 `setState` 调用都会向上传播到 RootPresenter 的 Pipeline，由它统一调度。

```swift
public protocol ViewUpdatePipeline: AnyObject {
    var superPipeline: ViewUpdatePipeline? { get set }
    var rootPresenter: ViewPresentable? { get }
    func markDirty(presenter: ViewPresentable, context: ViewUpdateContext, _ completion: (() -> Void)?)
    func updateViewPresenterIfNeeded(_ presenter: ViewPresentable)
    func updateViewIfNeeded(synchronize: Bool)
    func destroy()
}
```

这种集中式调度的好处：

- **全局一致**：整个页面的视图更新在一个调度循环中完成
- **避免重复**：多次 `setState` 可以被合并为一次 `updateView`
- **时机可控**：Pipeline 决定是在当前 RunLoop 还是下一个 RunLoop 更新
- **策略可切换**：不同场景使用不同的 Pipeline 实现

Pipeline 的多种实现：

| Pipeline 类型 | 适用场景 |
|-------------|---------|
| `TransactionPipeline` | 固定视图页面，事务性更新 |
| `Engine.PartialTrasactionPipeline` | 列表视图，新 Pipeline，配合 Diff 增量更新 |
| `Engine.ListUpdater` | 列表视图，旧 Pipeline，支持 Diff + BatchUpdate |
| `GlobalViewUpdatePipeline` | 全局单例协调器，管理所有 Pipeline 的调度循环 |

**`performBatchUpdate` 批量更新**

当需要在一次更新中合并多个状态变更时，可以使用全局函数 `performBatchUpdate(_:context:)` 将多个 `setState` 调用合并为一个事务：

```swift
performBatchUpdate({
    self.title = newTitle
    self.count = newCount
    self.isEnabled = newEnabled
}, context: { ctx in
    ctx.animated = true
    ctx.invalidateLayout = true
})
```

这样可以避免多次 `setState` 触发多次 Pipeline 调度，所有变更在同一个 Context 下一次完成。

**`Updater` 与 `Effect`：结构化的副作用管理**

除了重写 `onUpdate(view:context:)` 方法，Presenter 还支持通过 `Updater` 和 `Effect` 来管理视图更新闭包和副作用：

```swift
class MyPresenter: ViewPresenter<MyViewProtocol> {

    // Updater：声明式视图更新闭包，自动在 onUpdate 时调用
    let displayUpdater = Updater(updater: { view, context in
        view.title = self.title
        view.isEnabled = self.isEnabled
    })

    // Effect：管理副作用（如网络请求、定时器），自动跟随 onAttachToRoot/onDetachFromRoot 生命周期
    let pollingEffect = Effect(action: { [weak self] in
        let timer = Timer.scheduledTimer(...)
        return { timer.invalidate() }  // 返回取消闭包，detach 时自动调用
    })

    override init() {
        super.init()
        updaters.append(displayUpdater)
        effects.append(pollingEffect)
    }
}
```

`Updater` 在 `onUpdate(view:context:)` 时自动调用，`Effect` 在 `onAttachToRoot` 时启动、在 `onDetachFromRoot` 时自动取消。它们都受到 Presenter 生命周期的管理，deinit 时也会自动清理。

> **注意**：框架也提供了便捷方法 `useUpdate(_:)` 和 `useEffect(_:)` 来简化 Updater 和 Effect 的创建，推荐在子类中使用这些便捷方法。

### 4.4 列表场景的增量更新管线

列表是框架中最复杂的更新场景，ListUpdater 为此设计了精细的三路分发机制：

**三类更新路径**

```
setState { }
    │
    ├── invalidateDataSource = true  → Diff → BatchUpdate
    ├── invalidateContentSize = true → invalidateLayout + 重新计算 Size
    └── 默认（Cell 内部变更）        → 仅更新可见 Cell 的视图
```

- **数据源变更**：Section 或 Item 的增删改。触发 Diff 算法，产出增量结果，然后通过 `performBatchUpdates` 执行动画更新
- **仅布局变更**：内容尺寸变化但数据源不变。仅 `invalidateLayout` + 重新计算尺寸缓存，不触发数据源刷新
- **Cell 内部更新**：如点赞数变化、文案更新。只更新当前可见 Cell 的视图，不触发任何列表级操作，性能最优

**Differ 引擎**

Diff 算法基于 `ObjectIdentifier`（即 Presenter 实例的指针）进行比对，复杂度为 O(n)。产出两层结果：

```swift
struct IndexDiffResult {
    var inserts: IndexSet        // 新增的 Section
    var deletes: IndexSet        // 删除的 Section
    var moves: [Move]            // 移动的 Section
    var reloads: IndexSet        // 需要刷新的 Section
}

struct IndexPathDiffResult {
    var inserts: [IndexPath]     // 新增的 Item
    var deletes: [IndexPath]     // 删除的 Item
    var moves: [Move]            // 移动的 Item
}
```

**异步 Diff 与取消机制**

在数据频繁变更的场景（如实时列表更新），Diff 计算本身可能成为性能瓶颈。ListUpdater 将 Diff 放到后台队列异步执行，并通过 `dirtyVersion` 实现取消：

```swift
// 每次 markDirty 时递增版本号
dirtyVersion += 1

// 异步 Diff
let originVersion = dirtyVersion
queue.async {
    // 在后台队列计算 Diff
    let diffResults = self.doDiff(oldData, newData)

    DispatchQueue.main.async {
        // 回主线程前检查版本号——如果变更了，说明数据源已过时，取消本次更新
        guard self.dirtyVersion == originVersion else { return }
        self.doApplyDiff(oldData: oldData, newData: newData,
                         diffResults: diffResults, ...)
    }
}
```

这意味着如果数据源在短时间内发生多次变更，只有最后一次变更会真正执行 Diff 和 BatchUpdate，中间的无效计算全部被丢弃。

**动画控制**

```swift
if isAnimated {
    // 带动画的 BatchUpdate
    listView.performBatchUpdates { ... }
} else {
    // 无动画：通过 CATransaction 禁用隐式动画
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    listView.performBatchUpdates { ... }
    CATransaction.commit()
}
```

---

## 五、View 自动绑定机制

### 5.1 设计动机

在手动绑定模式下，每个子 Presenter 都需要在父 Presenter 的 `onBindView` 中显式绑定 View：

```swift
override func onBindView(_ view: SuperView) {
    super.onBindView(view)
    likePresenter.bindView(view.likeButton)
    commentPresenter.bindView(view.commentSection)
    sharePresenter.bindView(view.shareButton)
    // 每个子 Presenter 都要手动写一行...
}
```

这在复杂页面中非常繁琐，而且容易遗漏。实际上，子 Presenter 需要的 View 通常就在父 View 的视图层级中，类型信息也在泛型参数中明确了——完全可以自动发现。

### 5.2 自动绑定算法

`ViewAutoBinder` 实现了从父 Presenter 的 View 出发，**BFS（广度优先）遍历 UIView 子树**，找到类型匹配的子 View：

```swift
struct ViewAutoBinder {
    func findChildView<T>(presenter: ViewPresentable) -> T? {
        // 1. 如果父 View 实现了 ViewAutoBindable，使用自定义查找
        if let customView = presenter.anyView as? ViewAutoBindable {
            return customView.findView()
        }
        // 2. 如果要查找的类型与父 View 类型一致（Shadow Presenter），直接返回父 View
        else if let view = nearestUIView(presenter: presenter) {
            if let v = view as? T { return v }
            // 3. BFS 遍历子视图层级
            return findViewBFS(views: view.subviews)
        }
        return nil
    }
}
```

**Shadow Presenter** 是一个特殊场景：子 Presenter 与父 Presenter 绑定到同一个 View 上。此时子 Presenter 作为「影子」Presenter 存在，只提供逻辑拆分，不持有独立的 View。

### 5.3 控制开关

框架提供了两个开关来控制自动绑定行为：

```swift
public var autoBindView: Bool = true
public var autoBindChildrenPresenterViews: Bool = true
```

- `autoBindView`：控制自身是否参与自动绑定。关闭后需要手动调用 `bindView(_:)`
- `autoBindChildrenPresenterViews`：控制是否自动为子 Presenter 绑定 View。关闭后子 Presenter 需要各自手动绑定

**触发时机**：

1. 父 Presenter 调用 `bindView` 时，自动递归为所有子 Presenter 绑定 View
2. 子 Presenter 被 `add(child:)` 时，如果父 Presenter 已经绑定了 View，也会自动触发绑定

**默认行为**：

- 普通 `ViewPresenter`：`autoBindView = true`，自动绑定
- `RootViewPresenter`：`autoBindView = false`，根节点不自动绑定
- `ReusableViewPresenter`：`autoBindView = false`，因为复用场景下 View 由系统管理，不能自动绑定
- `ReusableViewPresenterHolder`：`autoBindChildrenPresenterViews = false`，原因同上

### 5.4 适用边界

| 场景 | 自动绑定 | 手动绑定 |
|------|---------|---------|
| 固定视图（View 层级与 P-Tree 对应） | ✅ 推荐 | 可选 |
| 列表 Cell 复用 | ❌ 不适合 | ✅ 必须 |
| Shadow Presenter | ✅ 自动处理 | 可选 |
| View 不在父视图层级中 | ❌ 找不到 | ✅ 必须 |

---

## 六、模块间通信机制

### 6.1 广播通知（Notify）

页面拆分后，各模块之间的通信成为一个关键问题。如果让 Presenter 之间直接相互引用，又会引入新的耦合。DDComponent 采用**广播机制**来解耦模块间的消息传递。

**全局广播**

`notifyGlobal(listener:)` 将消息发送到 P-Tree 中所有 Presenter，以及手动注册的接收方：

```swift
// 定义消息协议
protocol LikePresenterListener: AnyObject {
    func onLikeInfoChanged(presenter: LikePresenter, isLiked: Bool, likeCount: Int)
}

// 发送方 —— LikePresenter
notifyGlobal(listener: LikePresenterListener.self) { listener in
    listener.onLikeInfoChanged(presenter: self, isLiked: isLiked, likeCount: likeCount)
}

// 接收方 —— 任何继承 LikePresenterListener 的 Presenter
extension MyRootPresenter: LikePresenterListener {
    func onLikeInfoChanged(presenter: LikePresenter, isLiked: Bool, likeCount: Int) {
        // 收到点赞变更通知，更新自己的状态
        model.isLiked = isLiked
        model.likeCount = likeCount
    }
}
```

**向下广播**

`notifyChildren(listener:)` 仅向子模块广播，递归实现。在 ReusableView 场景下，通常只需要通知自己模块内的子 Presenter，使用向下广播可以避免影响其他模块：

```swift
// 只通知自己模块下的子 Presenter
notifyChildren(listener: SomeListener.self) { $0.onSomethingChanged() }
```

**自定义 Scope**

框架还支持自定义通知 Scope，例如 `.reusable` 作用域会在 `ReusableViewPresenterHolder` 中被限制为仅通知当前复用单元的子树，防止跨 Cell 的消息泄漏。

### 6.2 服务桥接（Service）

很多能力属于提供某种功能，而非业务逻辑本身——比如埋点服务、路由跳转、数据加载。这些能力无法定义为全局单例（因为需要页面上下文信息），但又需要在多个 Presenter 之间共享。

DDComponent 提供了**页面级 DI 容器**：

**注册服务**

有两种注册方式：

```swift
// 方式一：在 presenterDidLoad 中通过 pageInstallers 声明式注册
@PageInstallerBuilder override var pageInstallers: PageInstaller {
    ServiceInstaller(LikeService.self, { LikeServiceImpl() })
    ServiceInstaller(DataLoader.self, { MockDataLoaderImpl() })
    ServiceInstaller(RouterService.self, { RouterServiceImpl() })
}

// 方式二：通过 PageInstaller DSL 的 install 方法
presenter.install {
    ServiceInstaller(LikeService.self, { LikeServiceImpl() })
}
```

**获取服务**

```swift
// 在任意 Presenter 中获取，沿 P-Tree 向上查找
if let service = getService(LikeService.self) {
    service.toggleLike(...)
}
```

**与全局单例的区别**：

- 服务的生命周期与页面绑定，页面销毁时自动释放
- 服务可以访问页面上下文（如 Presenter 树、ViewController）
- 不同页面可以注册不同的服务实现，天然支持 Mock

**`NotifiableService` 与 `ManagerService`**

框架提供了两种特殊的 Service 协议来扩展服务的能力：

- `NotifiableService`：使服务可以参与广播通信。实现此协议的服务可以像 Presenter 一样调用 `notifyGlobal`、`notifyChildren` 等方法发送消息
- `ManagerService`：使服务可以获取其他服务。实现此协议的服务可以通过 `getService(_:)` 访问其他已注册的服务，实现服务间的依赖

```swift
class MyTraceService: NotifiableService {
    var notifier: ServiceNotifier?

    func reportEvent(_ name: String) {
        // 服务也可以发送广播
        notifyGlobal(listener: TraceListener.self) { $0.onEvent(name) }
    }
}

class MyCoordinatorService: ManagerService {
    var provider: ServiceProvider?

    func doSomething() {
        // 服务可以获取其他服务
        let router = getService(RouterService.self)
        router?.navigate(to: .nextPage)
    }
}
```

### 6.3 PageLifecycle 传播

`PageViewController` 会自动将 UIKit 的生命周期事件（`viewWillAppear`、`viewDidAppear`、`viewWillDisappear`、`viewDidDisappear`）通过全局广播发送给 P-Tree 中的所有注册了 `PageLifecycle` 协议的 Presenter。任何 Presenter 只需继承 `PageLifecycle` 协议并通过 `add(listener:object:)` 注册即可接收这些事件：

```swift
protocol PageLifecycle {
    func viewWillAppear(_ animated: Bool)
    func viewDidAppear(_ animated: Bool)
    func viewWillDisappear(_ animated: Bool)
    func viewDidDisappear(_ animated: Bool)
}

// 注册监听（通常在 onAttach 中）
rootPresenter.add(listener: PageLifecycle.self, object: self)

// 任意 Presenter 都可以接收页面生命周期事件
extension MyPresenter: PageLifecycle {
    func viewDidAppear(_ animated: Bool) {
        // 页面出现时开始上报
        startReporting()
    }

    func viewDidDisappear(_ animated: Bool) {
        // 页面消失时停止上报
        stopReporting()
    }
}
```

这种机制使得每个 Presenter 都可以独立响应页面生命周期，而不需要 ViewController 逐一手动通知。

---

## 七、拆分粒度与控制

### 7.1 拆分原则

拆分的核心原则是：**以功能为维度，而非以 UI 层级为维度**。

- ❌ 错误：按照视图层级拆分——「顶部区域 Presenter」「中间区域 Presenter」「底部区域 Presenter」
- ✅ 正确：按业务功能拆分——「点赞 Presenter」「评论 Presenter」「分享 Presenter」「埋点 Presenter」

一个 Presenter 应该等于一个**独立可复用的业务能力**。判断标准很简单：**这个 Presenter 能否脱离当前页面，被另一个页面直接使用？** 如果能，说明拆分合理；如果不能，说明它与当前页面耦合太深，需要进一步抽象。

### 7.2 粒度权衡

| 问题 | 表现 | 解决方案 |
|------|------|---------|
| 过粗 | 单个 Presenter 承载过多职责，退化为传统 Controller | 按功能继续拆分，每个 Presenter 只做一件事 |
| 过细 | 产生大量琐碎 Presenter，装配复杂度上升，跨 Presenter 通信成本增加 | 合并强耦合的子功能，通过 Notify 而非直接引用通信 |

**建议粒度**：一个 Presenter 对应一个完整的用户可感知功能。例如「点赞按钮」是一个 Presenter，而不是「点赞图标 Presenter」+「点赞数字 Presenter」——后者是 UI 层的拆分，应该在 View 协议内部处理，而不是暴露为两个独立的逻辑模块。

### 7.3 装配方式

框架提供了多种装配方式，灵活度从高到低：

**命令式装配（`add(child:)`)**

最灵活的方式，适合运行时条件性装配：

```swift
override func onAttach(presenter: ViewPresentable) {
    super.onAttach(presenter: presenter)
    add(child: likePresenter)
    if needComment {
        add(child: commentPresenter)
    }
}
```

**声明式装配（`PresenterInstaller` / `ServiceInstaller`）**

适合静态页面结构，使用 ResultBuilder DSL：

```swift
@PageInstallerBuilder override var pageInstallers: PageInstaller {
    PresenterInstaller(lazyLoad: true, { LikePresenter() })
    PresenterInstaller(lazyLoad: true, { CommentPresenter() })
    ServiceInstaller(LikeService.self, { LikeServiceImpl() })
}
```

**类型系统装配（`typeBox` / `typeUnbox`）**

通过 `ViewPresenterIdentify` 协议和 `IdentifierViewGroupPresenter`，框架提供了基于类型的 Presenter 注册和查找系统。`IdentifierViewGroupPresenter` 内部维护一个 `ViewPresenterIdentifierStore`，允许通过 `ObjectIdentifier`（即类型）来管理子 Presenter：

```swift
class MyRootPresenter: IdentifierViewGroupPresenter<MyViewProtocol> {

    override func onAttach(presenter: ViewPresentable) {
        super.onAttach(presenter: presenter)
        // 注册 Presenter（立即创建）
        typeBox(LikePresenter())
        // 注册 Presenter（懒加载，首次获取时才创建）
        typeBoxLazy({ CommentPresenter() })
    }

    func updateLike() {
        // 按类型获取
        let likePresenter: LikePresenter? = typeUnbox()
        likePresenter?.toggleLike()
    }

    func removeComment() {
        // 按类型移除
        removeTypeBox(CommentPresenter.self)
    }
}
```

`IdentifierViewGroupPresenter` 的核心优势在于无需手动持有每个子 Presenter 的引用——通过类型系统即可完成注册、查找、移除，在子 Presenter 数量较多的复杂页面中尤为实用。

### 7.4 拆分后的组织形态

一个典型的页面结构如下：

```
PageViewController
└── RootPresenter
    ├── LikePresenter          ← 点赞功能，独立开发
    ├── CommentPresenter       ← 评论功能，独立开发
    │   ├── InputPresenter
    │   └── ListPresenter
    ├── SharePresenter         ← 分享功能，独立开发
    └── TracePresenter         ← 埋点，独立开发
```

每个功能 Presenter 可以：

- **独立开发**：不同开发者/团队各自负责不同的 Presenter，互不冲突
- **独立测试**：每个 Presenter 可以 Mock View 和 Service 进行单元测试
- **独立复用**：需要点赞功能的页面直接引入 LikePresenter 即可

---

## 八、实践：固定视图场景

### 8.1 PageViewController 基类

`PageViewController` 是页面的入口，封装了 Presenter 和 View 的初始化与绑定：

```swift
class MyViewController: PageViewController<MyFrameView, MyRootPresenter, MyViewProtocol> {

    override func makeView() -> MyFrameView {
        MyFrameView()
    }

    override func makePresenter() -> MyRootPresenter {
        MyRootPresenter()
    }

    @PageInstallerBuilder override var pageInstallers: PageInstaller {
        PresenterInstaller(lazyLoad: true, { LikePresenter() })
        ServiceInstaller(DataLoader.self, { MyDataLoader() })
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // 加载数据
        if let loader = getService(DataLoader.self) {
            loader.refreshData()
        }
    }
}
```

> **提示**：推荐通过重写 `pageInstallers` 属性来声明式注册 Presenter 和 Service。如果需要在运行时条件性装配，也可以在 `onAttach(presenter:)` 中使用 `add(child:)` 命令式装配。

### 8.2 RootPresenter

`RootPresenter` 有且只有一个，负责持有全局 Pipeline 和 Service 容器。虽然可以把业务逻辑直接放在 RootPresenter 中，但我们更推荐将逻辑拆分到各自的子 Presenter 中，RootPresenter 只负责装配和协调。

### 8.3 完整示例：LikePresenter 的装配

以下是一个完整的 LikePresenter 装配示例：

```swift
// 父 Presenter 中装配子 Presenter
class SuperPresenter: ViewPresenter<SuperViewProtocol> {

    let likePresenter = LikePresenter()

    override func onAttach(presenter: ViewPresentable) {
        super.onAttach(presenter: presenter)
        // 加入 P-Tree
        add(child: likePresenter)
    }

    override func onBindView(_ view: SuperViewProtocol) {
        super.onBindView(view)
        // 绑定 V-Tree（如果关闭了自动绑定）
        likePresenter.bindView(view.likeButton)
    }

    override func onUnbindView() {
        super.onUnbindView()
        likePresenter.unbindView()
    }
}
```

如果开启了自动绑定（默认），且 View 层级与 P-Tree 结构对应，则 `onBindView` 中的手动绑定代码可以完全省略。

---

## 九、实践：列表与复用场景

### 9.1 固定列表（无复用）

当列表项不需要复用时，使用方式与固定视图完全一致——构造一一对应的 Presenter 和 View 即可：

```swift
class RootPresenter: ViewPresenter<RootView> {
    var listPresenters: [ListItemPresenter]

    override func onBindView(_ view: RootView) {
        super.onBindView(view)
        for (i, presenter) in listPresenters.enumerated() {
            presenter.bindView(view.listItemViews[i])
        }
    }
}
```

这种模式只适合简单场景——cell 数量固定且较少，cell 内部不需要继续 MVP 拆分。

### 9.2 复用 Presenter（ReusableViewPresenter）

列表复用的核心挑战是：**Cell 在被复用时，其绑定的 Presenter 也需要被复用**。DDComponent 为此设计了完整的复用体系：

**基类**

```swift
open class ReusableViewPresenter<View>: ViewPresenter<View>, ReusablePresentable {
    required public override init() {
        super.init()
        autoBindView = false  // 复用场景关闭自动绑定
    }
    open func prepareForReuse() {
        // 子类重写，重置状态
    }
}
```

**数据源三层模型**

列表页面的实际架构使用了 `UICollectionViewRootPresenter` 作为根节点，它内部持有一个 `UICollectionViewPresenter` 子节点来管理列表逻辑，形成双层根结构：

```
UICollectionViewRootPresenter (RootViewPresenter)
└── UICollectionViewPresenter (CollectionPresenter)
    ├── SectionPresenter (CollectionSectionPresentable)
    │   ├── ItemPresenter (CollectionItemPresentable + Holder)
    │   │   └── ReusableViewPresenter (ReusablePresentable)
    │   └── Supplementary ItemPresenters (header/footer)
    └── SectionPresenter
        └── ...
```

每一层都是 Presenter，形成完整的 P-Tree：

- `UICollectionViewRootPresenter`：页面的 RootPresenter，持有 `UICollectionViewPresenter`
- `UICollectionViewPresenter`：管理列表的 Pipeline、Proxy 和代理
- `SectionPresenter`：管理一个 Section 的 Item 和 Supplementary（Header/Footer）
- `ItemPresenter`：作为 Holder，在 Cell 出现时创建/复用 ReusableViewPresenter
- `ReusableViewPresenter`：实际的业务逻辑载体，随 Cell 复用而复用

**Supplementary 视图（Section Header/Footer）**

`CollectionSectionPresenter` 通过 `supplementaries` 字典支持 Section Header 和 Footer：

```swift
// 在 UICollectionViewFlowSectionPresenter 中
section.header = MyHeaderPresenter()  // 自动加入 supplementaries
section.footer = MyFooterPresenter()

// 或手动管理
section.setSupplementary(
    UICollectionView.elementKindSectionHeader,
    [MyHeaderPresenter()],
    animated: true
)
```

Supplementary 与 Item 共享相同的复用机制——它们也是通过 `CollectionItemReusablePresenterHoldable` 绑定 ReusableViewPresenter，并享受相同的自动 Size 计算和增量更新能力。

**Holder 机制**

```swift
open class ReusableViewPresenterHolder<P, V>: ViewPresenter<()>, ReusableViewPresenterHoldable
    where P: ReusableViewPresenter<V> {

    // 管理复用的 Presenter 实例
    public private(set) var reusedPresenters: [P] = []

    // 绑定复用的 Presenter
    public func bindReusablePresenter(_ presenter: P) {
        presenter.removeFromSuper()
        add(child: presenter)
        reusedPresenters.append(presenter)
        onBindReusablePresenter(presenter)
    }

    // 解绑
    public func unbindReusablePresenter(_ presenter: P) {
        onUnbindReusablePresenter(presenter)
        remove(child: presenter)
        reusedPresenters.removeAll { $0 == presenter }
    }
}
```

### 9.3 列表自动 Size 计算

列表中最常见的性能问题之一是 Size 计算。DDComponent 提供了完整的自动计算方案。

**三种布局计算方式**

```swift
public enum LayoutType: Int {
    case autoLayout            // systemLayoutSizeFitting + 约束
    case sizeThatFits          // sizeThatFits(_:)
    case intrinsicContentSize  // intrinsicContentSize
}
```

| 方式 | 原理 | 适用场景 |
|------|------|---------|
| `autoLayout` | 通过临时约束 + `systemLayoutSizeFitting` 计算 | 使用 Auto Layout 的 Cell |
| `sizeThatFits` | 调用 `sizeThatFits(_:)` | 手动计算尺寸的 Cell |
| `intrinsicContentSize` | 读取 `intrinsicContentSize` | 内容自适应的简单 Cell |

**Fitting 模式**

```swift
public enum Fitting {
    case containerSize(CGSize)   // 指定容器尺寸，约束宽高
    case width(CGFloat)          // 仅约束宽度，高度自适应
    case height(CGFloat)         // 仅约束高度，宽度自适应
}
```

Fitting 决定了在计算尺寸时，哪个维度是固定的，哪个维度是自适应的——这通常由列表的滚动方向和 Section 的列数决定。

**SizeCache 缓存**

```swift
class SizeCache {
    var cache: [ObjectIdentifier: CGSize] = [:]

    subscript(_ key: ViewPresentable) -> CGSize? {
        get { cache[ObjectIdentifier(key)] }
        set { cache[ObjectIdentifier(key)] = newValue }
    }
}
```

- 基于 `ObjectIdentifier` 缓存，与 Presenter 实例一一对应
- Diff 增量更新时，新增/变更的 Item 会自动清除对应缓存
- 手动调用 `invalidateLayout()` 可清空全部缓存

**计算流程**

```
1. dequeuePresenter(for: presenterClass)  → 获取复用的 Presenter 实例
2. dequeueView(for: viewClass)            → 获取复用的 View 实例
3. 临时绑定 Presenter 和 View
4. updateViewIfNeeded()                   → 触发状态更新
5. sizeCalculator.size(for:cell:)         → 计算尺寸
6. unbindView() + unbindReusablePresenter → 解绑回收
```

整个过程使用 `isDryRun = true` 模式，不会产生副作用（如网络请求、埋点上报等）。

**自定义 Size 计算**

对于需要手动计算尺寸的场景，实现 `UICollectionItemSizeCaculatable` 协议并设置 `calculateSizeAutomatically = false`：

```swift
extension MyItemPresenter: UICollectionItemSizeCaculatable {
    var layoutInfo: UICollectionItemFlowLayoutInfo {
        var info = UICollectionItemFlowLayoutInfo()
        info.calculateSizeAutomatically = false
        return info
    }

    func calculateSize(containerSize: CGSize) -> CGSize {
        // 自定义计算逻辑
        return CGSize(width: containerSize.width, height: myCustomHeight)
    }
}
```

### 9.4 自定义 Layout 支持

**声明式 LayoutInfo**

```swift
public protocol UICollectionViewLayoutInfo { }

// Item 级别的 FlowLayout 配置
struct UICollectionItemFlowLayoutInfo {
    var calculateSizeAutomatically: Bool = true
    var autoLayoutSizeFitting: SizeFitting = .auto
    var layoutType: LayoutType = .autoLayout
}

// Section 级别的 FlowLayout 配置（列数、间距、内边距等）
struct UICollectionViewFlowSectionLayoutInfo {
    var columnCount: Int = 1
    var inset: UIEdgeInsets = .zero
    var lineSpacing: CGFloat = 0
    var itemSpacing: CGFloat = 0
}
```

Item 级别通过 `UICollectionItemFlowLayoutInfo` 声明尺寸计算策略，Section 级别通过 `UICollectionViewFlowSectionLayoutInfo` 声明布局参数（多列、间距等）。框架自动对接两者的 Size 计算和多列布局。

**Proxy 子类化扩展**

`UICollectionViewDelegateProxy` 是整个列表系统的大脑，同时承担了 `UICollectionViewDataSource`、`UICollectionViewDelegate`、`UIScrollViewDelegate` 的角色。通过子类化可以扩展自定义 Layout：

```swift
// 内置的 FlowLayout 实现
open class UICollectionViewFlowLayoutProxy: UICollectionViewDelegateProxy,
                                            UICollectionViewDelegateFlowLayout {
    // 自动对接 Size 计算、缓存、多列适配
}

// 自定义 Layout 只需继承并重写
class MyCustomLayoutProxy: UICollectionViewDelegateProxy {
    // 实现自定义 Layout 的 delegate 方法
}
```

使用时通过 `UICollectionViewRootPresenter` 的 `bindView(_:layoutProxy:)` 指定自定义 Proxy 类型。

### 9.5 Item 交互方法

`UICollectionViewItemPresentable` 协议提供了一系列交互方法，覆盖了 Cell 的完整生命周期和用户交互。这些方法可以直接在 Item Presenter 中重写，无需手动设置 delegate：

```swift
public protocol UICollectionViewItemPresentable: CollectionItemPresentable {
    var canMove: Bool { get }

    var shouldHighlight: Bool { get }
    func onDidHighlighted()
    func onDidUnhighlight()

    var shouldSelect: Bool { get }
    var shouldDeselect: Bool { get }
    func onDidSelect()
    func onDidDeselect()

    func onWillDisplay()
    func onDidEndDisplaying()
}
```

此外，通过扩展还提供了便捷的编程式操作：

```swift
// 选中/取消选中
itemPresenter.selectedInCollectionView = true
itemPresenter.deselectedInCollectionView(animated: true)

// 滚动到可见
itemPresenter.scrollToVisible(position: .centeredVertically, animated: true)

// 查找布局属性
let attributes = itemPresenter.findLayoutAttributes()
```

这些方法内部通过沿 P-Tree 向上查找 `UICollectionViewPresentable` 来获取 `UICollectionView` 的引用，因此 Item Presenter 无需持有任何 CollectionView 的引用即可完成选中、滚动等操作。

---

## 十、总结与思考

### 10.1 框架的核心价值

回顾整个框架，DDComponent 的核心价值可以归纳为三个层次：

**拆得开**：通过 P-Tree 将页面功能标准化拆分为独立的 Presenter 单元，每个单元职责单一、边界清晰、可独立开发。

**装得上**：通过声明式 DSL 和命令式 API，将拆分的 Presenter 灵活装配为完整的页面。Presenter 可以懒加载、条件性装配、按类型动态查找。

**复用得了**：通过 P-Tree / V-Tree 分离，同一套逻辑可以绑定不同的 UI 实现。View 的协议化定义使得复用不仅限于 UI，还包括服务、数据通道等任意数据消费方。

### 10.2 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 架构模式 | MVP（重新定义） | 比 MVVM 更侧重逻辑复用而非数据绑定 |
| 组合方式 | 树形结构 | 天然匹配页面层级，生命周期管理清晰 |
| View 定义 | 协议 | 支持多 UI 绑定，支持 Void 纯逻辑 |
| 更新机制 | 状态驱动 + 集中 Pipeline | 避免多源修改不一致，统一调度 |
| 通信方式 | 广播 + 服务 | 解耦模块间依赖，编译期类型安全 |
| 列表 Diff | 自研 O(n) | 基于 ObjectIdentifier，轻量且高效 |

### 10.3 适用场景与局限

**适合的场景**：

- 复杂业务页面，包含多个独立的功能模块
- 不同端 UI 差异化但逻辑一致的场景
- 需要功能动态插拔的页面（如 A/B 测试不同功能组合）
- 大型团队协作开发，需要明确的功能边界

**不太适合的场景**：

- 简单页面（如纯展示页），引入成本高于收益
- 对包体积敏感的项目（框架本身有一定代码量）
- 团队规模小、迭代速度极快、对架构抽象容忍度低的早期项目

**学习成本**：

需要团队理解 MVP 重定义、树结构生命周期、状态驱动更新、广播通信等概念。建议通过 Demo 和内部文档渐进式推广。

### 10.4 与主流框架的对比

| 框架 | 相似点 | 差异点 |
|------|--------|--------|
| MVVM | 都有逻辑层抽象 | MVVM 侧重数据绑定，DDComponent 侧重逻辑组合与复用 |
| VIPER | 都有 Router/Interactor/Presenter 分层 | DDComponent 更轻量，拆分粒度更灵活，没有强制五层 |
| React/SwiftUI | 状态驱动更新思想 | DDComponent 是 OOP 的树形组合，而非声明式 UI DSL |
| IGListKit | 列表 Diff 增量更新 | DDComponent 的 Diff 粒度更细，且融合了 MVP 拆分 |
