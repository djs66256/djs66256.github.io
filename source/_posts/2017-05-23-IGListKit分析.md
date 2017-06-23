 ---
title: IGListKit分析
date: 2017-05-23 21:31:25
categories:
- iOS
tags:
- IGListKit
- DDComponent
- 组件化
---

在我们的项目中大量使用了列表以及模块化的思想，所以才有了`DDComponent`，这个的原理在之前的[美学的表现层组件化之路](/2017/04/09/2017-04-09-美学的表现层组件化之路/)详细的说明了使用方式。最近翻了翻`IGListKit`的代码，发现他的思想和我的思想非常的类似，但也有部分区别，这里就来分析下`IGListKit`的场景。

# 待更新

<!--more-->

## 首先，来看看IGListKit的使用

IGListKit封装了CollectionView的Api

```swift
func objects(for listAdapter: ListAdapter) -> [ListDiffable] {
    return [1, 2, 3, 4, 5, 6] as [NSNumber]
}

func listAdapter(_ listAdapter: ListAdapter, sectionControllerFor object: Any) -> ListSectionController {
    return DisplaySectionController()
}

func emptyView(for listAdapter: ListAdapter) -> UIView? { return nil }
```
