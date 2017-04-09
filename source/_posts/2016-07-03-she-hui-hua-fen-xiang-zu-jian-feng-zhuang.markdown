---
layout: post
title: "社会化分享组件封装"
date: 2016-07-03 21:14:27 +0800
comments: true
categories:
- iOS
tags:
- iOS
- 社会化分享
---

社会化分享是大部分应用都会集成的模块，现在市场上也有很多的商业产品（友盟，shareSDK），但是很多时候我们还是需要自己的分享组件，同时也要支持第三方登录。

<!--more-->

## 分享内容

如果需要统一接口，必须首先统一分享内容，把几种比较常见的和共有的分享内容合并。以下是几种各个平台都比较统一的结构。构造分享内容的时候尽量填满所有的类型，来满足各个平台的不同需求。

```objc
typedef NS_ENUM (NSInteger, MZShareType) {
    MZShareTypeUndefined = 0,
    MZShareTypeURL,
    MZShareTypeText,
    MZShareTypeImage
};

@property (assign, nonatomic) NSInteger shareType;

@property (strong, nonatomic) NSString *title;
@property (strong, nonatomic) NSString *detail;

@property (strong, nonatomic) NSURL *URL;

@property (strong, nonatomic) UIImage *image;
@property (strong, nonatomic) UIImage *thumbImage;

@property (strong, readonly, nonatomic) NSData *imageData;          // < 5M
@property (strong, readonly, nonatomic) NSData *thumbImageData;
```

因为很多平台对缩略图有要求，而且大小不一致，这里我们可以在不影响质量的情况下取最小值。

```objc
- (UIImage *)thumbImageWithImage:(UIImage *)image maxPixelSize:(NSInteger)size forceCreated:(BOOL)forceCreated {
    CFStringRef thumbnailCreatedKey = forceCreated ? kCGImageSourceCreateThumbnailFromImageAlways:kCGImageSourceCreateThumbnailFromImageIfAbsent;
    NSDictionary *options = @{(__bridge NSString *)kCGImageSourceThumbnailMaxPixelSize: @(size),
                              (__bridge NSString *)thumbnailCreatedKey : @YES};
    CGImageSourceRef imageSource = CGImageSourceCreateWithData((__bridge CFDataRef)UIImagePNGRepresentation(image), (__bridge CFDictionaryRef)options);
    CGImageRef thumbImage = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, (__bridge CFDictionaryRef)options);
    UIImage *UIThumbImage = [UIImage imageWithCGImage:thumbImage];

CLEAR:
    CGImageRelease(thumbImage);
    if (imageSource) {
        CFRelease(imageSource);
    }

    return UIThumbImage;
}
```

## 第三方认证数据

大部分都会有`token`和`expireDate`这两个参数，同样，也建立一个类来保存用户认证信息。

```objc
@property (strong, nonatomic) NSString *token;
@property (strong, nonatomic) NSDate *expireDate;
```

## 分享外观Manager

这里我们采用尽可能的去分享的原则来处理。只要支持这种类型，并且安装了app的就显示分享。

```objc
+ (BOOL)openURL:(NSURL *)url;

// 所有对该分享对象可用的分享类型
+ (NSArray<ShareInterface *> *)avaliableInterfacesForShareItem:(ShareItem *)item;
+ (void)share:(ShareItem *)item delegate:(id<ShareDelegate>)delegate;

// 所有可用的认证类型
+ (NSArray<AuthInterface *> *)avaliableInterfacesForAuthentication;
+ (void)authWithInterface:(AuthInterface *)interface delegate:(id<ShareDelegate>)delegate;

+ (void)logout;	// 注销所有的认证账号
```

## 分享接口

我们需要统一不同类型的分享

```obc
+ (BOOL)canShareItem:(MZShareItem *)item;  
+ (BOOL)canShareText;
+ (BOOL)canShareImage;
+ (BOOL)canShareURL;

+ (BOOL)supportAppInnerShare;
+ (BOOL)requiresAuthentication;
+ (BOOL)isLogin;

+ (BOOL)needLocalApplication;
+ (BOOL)isApplicationInstall;

- (BOOL)openURL:(NSURL *)URL;

- (instancetype)initWithItem:(MZShareItem *)shareItem;
- (void)send;

- (void)notifySuccess;
- (void)notifyFailureWithMessage:(NSString *)error;
```

```objc
// Delegate
- (void)shareDidSucceed:(MZShareInterface *)interface;
- (void)shareDidFail:(MZShareInterface *)interface error:(NSError *)error;
```

## 认证接口

## 注意事项

这里最大的注意事项是，我们不能确保整个流程是否能够完全的走完。当跳转到其他应用的时候，用户并不一定回调回来，可能关闭或者做其他事情去了，这时候我们要在应用再次被唤起的时候，把当前的状态重置。由于这里我们不知道最终结构，所以我只能作为失败来处理。

```objc
[[NSNotificationCenter defaultCenter] addObserver:self
										 selector:@selector(applicationDidBecomeActiveNotification:)
										     name:UIApplicationDidBecomeActiveNotification object:nil];

- (void)applicationDidBecomeActiveNotification:(NSNotification *)noti {
    if (_status == MZShareInterfaceStatePendingShare) {
        [self notifyFailureWithMessage:@"分享失败"];
    }
}
```
