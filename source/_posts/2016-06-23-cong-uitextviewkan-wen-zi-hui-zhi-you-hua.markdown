---
layout: post
title: "从UITextView看文字绘制优化"
date: 2016-06-23 09:39:50 +0800
comments: true
categories:
- iOS
tags:
- UITextKit
- NSAttributedString
---

最近有一个地方需要自定义文字编辑器，所以使用了iOS7开始支持的UITextKit来绘制，同时也遇到不少的坑，这里来说说我遇到的几个坑，以及解决方案。源码在[Github](https://github.com/djs66256/DDAttachmentTextView)。

<!--more-->

## UITextView 分段绘制原理分析

首先，我们来看下`NSLayoutManager`里面的几个方法：

```objc
- (void)drawGlyphsForGlyphRange:(NSRange)glyphsToShow atPoint:(CGPoint)origin;

- (void)invalidateDisplayForCharacterRange:(NSRange)charRange;
- (void)invalidateDisplayForGlyphRange:(NSRange)glyphRange;

- (void)ensureGlyphsForCharacterRange:(NSRange)charRange;
- (void)ensureGlyphsForGlyphRange:(NSRange)glyphRange;
- (void)ensureLayoutForCharacterRange:(NSRange)charRange;
- (void)ensureLayoutForGlyphRange:(NSRange)glyphRange;
```

可以看出来，无论是绘制方法，还是布局方法，都是有个范围选择，由此可以知道，UITextView的绘制过程绝对不是一次性绘制（对比[YYText](https://github.com/ibireme/YYText))。重写该方法也可以看出来UITextView是分多段绘制的。

现在我们来简单的做几个实验：

重写`- (void)drawGlyphsForGlyphRange:(NSRange)glyphsToShow atPoint:(CGPoint)origin;`,并使用该LayoutManager创建UITextView：

```objc
DDAttachmentLayoutManager *layoutManager = [[DDAttachmentLayoutManager alloc] init];
NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:CGSizeMake(frame.size.width, CGFLOAT_MAX)];
textContainer.widthTracksTextView = YES;
[layoutManager addTextContainer:textContainer];
NSTextStorage *textStorage = [[NSTextStorage alloc] initWithString:@""];
[textStorage addLayoutManager:layoutManager];

UITextView *textView = [[UITextView alloc] initWithFrame:frame textContainer:textContainer];
```

放入一段足够长的文字，在我们滑动的过程中，UITextView会分多次调用draw方法，这样显著降低了损耗和提升了性能，把多次绘制过程分散到滑动的过程中。

以上是纯文本的结果，那如果我们放入其他类型的数据呢？在这里，我放入多个`NSTextAttachment`自定义类型的数据。重复以上的测试。

结果是，当缓慢下拉的时候，同样是分段载入的，而且`attachment`往往作为单独的一段来绘制。但是有个不同的地方就是，可以看到`contentSize`在变化，而且可以看到右边的进度条在接近底部的时候忽然间回到上面，并且变短了。

![image](/images/2016/scroll.gif)

由此可知在开始的时候，UITextView会拥有一个预期的大小，在加载过程中如果碰到attachment导致这个大小不符合，就会将下面一段内容加入计算，重新得出`contentSize`。这样会给我们带来一些麻烦，不能准确的获得`contentSize`，导致一些bug，解决方案很简单，我们先看下面另一个问题。

如果我们进入的时候是在最后一行呢。同样也是有这样的逻辑，这样的逻辑对于自定义的AttachmentView来说会有很多的问题，最大的问题就是在`contentSize`变化的时候，subview位置错误。

如何解决这样的问题，只要我们强制让UITextView布局整个的富文本就行了。

```objc
[self.textView.layoutManager ensureLayoutForCharacterRange:NSMakeRange(0, self.textView.textStorage.length)];
```

## 自定义富文本编辑器

首先我们需要实现自己的Attachment，主要功能是实现占位符的大小。

```objc
@interface DDTextAttachment : NSTextAttachment

@property (copy, nonatomic) NSString *placeholderString;
@property (strong, nonatomic) id data;

@property (assign, nonatomic) BOOL fillWidth;
@property (assign, nonatomic) UIEdgeInsets contentInset;
@property (assign, nonatomic) CGSize size;

@end
```

然后重写DDAttachmentLayoutManager

```objc
- (void)drawGlyphsForGlyphRange:(NSRange)glyphsToShow
                        atPoint:(CGPoint)origin
```

在这里把需要展示的视图，按照位置贴到父视图上。

这样就是整个方案的思路，具体实现可以参考[Github](https://github.com/djs66256/DDAttachmentTextView)

## 内存优化方案

最开始，我采用的是把所有的attachment view都实例化出来，再贴到textView上，但是当整个文章比较长，并且结构复杂的时候，会发现占用很多的内存，联想到苹果的分段绘制和tableView的reuse，我决定把整个框架改写为可重用的模式。

首先，我们模仿tableView定义接口。

```objc
- (void)registerClass:(Class)cls forAttachmentViewWithReuseIdentifier:(NSString *)identifier;
- (__kindof DDAttachmentReusableView *)dequeueReusableAttachmentViewWithIdentifier:(NSString *)identifier;
```

```objc
// protocol
- (DDAttachmentReusableView *)textView:(DDAttachmentTextView *)textView attachmentViewWithAttachment:(DDTextAttachment *)attachment;
```

然后，重写AttachmentLayoutManager绘制方法，在需要绘制的时候再去生成视图。

```objc
- (void)drawGlyphsForGlyphRange:(NSRange)glyphsToShow
                        atPoint:(CGPoint)origin
{
    [super drawGlyphsForGlyphRange:glyphsToShow atPoint:origin];

    NSUInteger start = [self characterIndexForGlyphAtIndex:glyphsToShow.location];
    NSUInteger end = [self characterIndexForGlyphAtIndex:glyphsToShow.location + glyphsToShow.length];

    [self.textStorage enumerateAttribute:NSAttachmentAttributeName
                                 inRange:NSMakeRange(start, end - start)
                                 options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired | NSAttributedStringEnumerationReverse
                              usingBlock:^(id  _Nullable value, NSRange range, BOOL * _Nonnull stop) {
                                  DDTextAttachment *attachment = (DDTextAttachment *)value;
                                  if ([attachment isKindOfClass:[DDTextAttachment class]]) {
                                      NSUInteger glyphIndex = [self glyphIndexForCharacterAtIndex:range.location];
                                      CGRect rect = [self boundingRectForGlyphRange:NSMakeRange(glyphIndex, 1)
                                                                    inTextContainer:[self textContainerForGlyphAtIndex:glyphIndex
                                                                                                        effectiveRange:NULL]];
                                      // 这里才去生成视图
                                      UIView *attachmentView = [self.attachmentDelegate attachmentLayoutManager:self viewForAttachment:attachment];
                                      attachmentView.frame = CGRectMake(origin.x + rect.origin.x + attachment.contentInset.left,
                                                                        origin.y + rect.origin.y + attachment.contentInset.top,
                                                                        rect.size.width - attachment.contentInset.left - attachment.contentInset.right,
                                                                        attachment.size.height);
                                      attachmentView.hidden = NO;
                                  }
                              }];
}
```

然后，重写contentOffset，在其变化的时候检测是否有视图需要显示，或者是否有视图已经移出屏幕。

```objc
- (void)setContentOffset:(CGPoint)contentOffset {
    [super setContentOffset:contentOffset];

    CGFloat visiblePadding = 10;    // 让他稍微大一点，可以早一点载入
    CGRect visibleRect = CGRectOffset((CGRect){0, -visiblePadding, self.frame.size.width, self.frame.size.height+2 * visiblePadding},
                                      self.contentOffset.x,
                                      self.contentOffset.y);
    for (DDAttachmentReusableView *view in _attachmentViews) {
        if (view.superview) {
            // [1]
            if (!CGRectIntersectsRect(visibleRect, view.frame)) {
                [view removeFromSuperview];
            }
        }
    }
    NSRange range = [self.layoutManager glyphRangeForBoundingRect:CGRectMake(0, visibleRect.origin.y+self.textContainerInset.top, visibleRect.size.width, visibleRect.size.height) inTextContainer:self.textContainer];
    NSRange charRage = [self.layoutManager characterRangeForGlyphRange:range actualGlyphRange:nil];
    [self.textStorage enumerateAttribute:NSAttachmentAttributeName inRange:charRage options:0 usingBlock:^(id  _Nullable value, NSRange range, BOOL * _Nonnull stop) {
        if ([value isKindOfClass:[DDTextAttachment class]]) {
            for (DDAttachmentReusableView *view in _attachmentViews) {
                // [2]
                if (view.superview && view.attachment == value) {
                    return ;
                }
            }
            // [3]
            [self.layoutManager invalidateDisplayForCharacterRange:range];
        }
    }];
}
```

[1] 当视图不在屏幕显示区域内的时候，移出父视图

[2] 当视图在显示区域并且没有变化的时候不需要重用操作。

[3] 重用视图，要求重绘这个占位符。

这样，又会转移到绘制的地方，最终会调用reuse的代码。经过实验测试，原来可能实例化的很多视图，现在同时存在的一般维持在2个左右，大大降低了内存占用。

这样的做法对性能的影响：

1. 在我使用UIImageView的时候，完全感觉不出来。
2. 在我使用UICollectionView的时候，在iPhone 4s手机上会有一点点的感觉，但是几乎难以察觉。

所以对这次的优化还是非常满意的。


## ios8 deleteBackward

这是应该是苹果的一个bug，从iOS8.0-8.3系统，重写UITextView，UIInput协议的deleteBackward的时候，发现删除的时候不能被触发，而且仅仅只在这几个系统下才有这样的问题。stackoverflow上提出的解决方案是重写一个私有api，这个不会被苹果AppStore拒绝。

```objc
- (BOOL)keyboardInputShouldDelete:(TextField *)textField {
    BOOL shouldDelete = YES;

    if ([TextField instancesRespondToSelector:_cmd]) {
        BOOL (*keyboardInputShouldDelete)(id, SEL, UITextField *) = (BOOL (*)(id, SEL, UITextField *))[UITextField instanceMethodForSelector:_cmd];

        if (keyboardInputShouldDelete) {
            shouldDelete = keyboardInputShouldDelete(self, _cmd, textField);
        }
    }

    BOOL isIos8 = ([[[UIDevice currentDevice] systemVersion] intValue] == 8);
    BOOL isLessThanIos8_3 = ([[[UIDevice currentDevice] systemVersion] floatValue] < 8.3f);

    if (![textField.text length] && isIos8 && isLessThanIos8_3) {
        [self deleteBackward];
    }

    return shouldDelete;
}
```

## ios7 boudingRect

在iOS7上，要计算文字的高度，被换成了新的方法`boudingRect`，但是在iOS7的系统上，还是会有错误的。

如果你是UILabel，那么没有问题，但是，如果你使用的是UITextView，那么，两者的实际高度为不一致的，可以看的出来，在iOS7上，Label的绘制方式和UITextView还是不一样的。

要解决这个问题，只能实例化一个UITextView对象了：

```objc
if ([[UIDevice currentDevice].systemVersion integerValue] == 7) {
   UITextView *textView = self.templateRepoEditorTextView;
   textView.attributedText = [[NSAttributedString alloc] initWithString:realText attributes:attributes];

   return [textView sizeThatFits:CGSizeMake(width, CGFLOAT_MAX)].height + paragraphSpacing;
}
```

在某些场合，为了避免频繁的动态生成，可以使用NSCache做一层缓存。


```objc
- (UITextView *)templateRepoEditorTextView {
    static NSString * const key = @"templateRepoEditorTextView";
    UITextView *textView = [_cache objectForKey:key];
    if (textView == nil) {
        textView = [[UITextView alloc] init];
        textView.textContainer.widthTracksTextView = YES;
        textView.textContainer.lineFragmentPadding = 0;
        textView.textContainerInset = UIEdgeInsetsZero;

        [_cache setObject:textView forKey:key];
    }
    return textView;
}
```

## NSTextAlignmentJustified 两端对齐

在UITextView和UILabel的对齐样式属性里面，虽然没有说明禁止使用两端对齐的方式，但是其实是不支持的，如果需要支持，需要使用NSAttributedString来设置，而且只设置了对齐方式还是不能对齐的，还需要一个下划线的属性（这可能也是一个系统缺陷）。

```objc
NSMutableParagraphStyle *paragraph = [[NSMutableParagraphStyle defaultParagraphStyle] mutableCopy];
paragraph.lineSpacing = 5;
paragraph.paragraphSpacing = 15;
paragraph.lineBreakMode = NSLineBreakByWordWrapping;
paragraph.alignment = NSTextAlignmentJustified;

NSDictionary *attribute = @{
    NSFontAttributeName: [UIFont fontWithName:@"Helvetica" size:17],
    NSParagraphStyleAttributeName: paragraph,
    NSForegroundColorAttributeName: RGB(60, 60, 0),
    NSUnderlineStyleAttributeName: @0
};
```
