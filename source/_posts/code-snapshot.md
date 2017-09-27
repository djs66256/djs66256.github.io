---
title: code-snapshot
date: 2012-08-19 18:50:34
categories:
- temp
tags:
---

### Jailbroken

```
+ (BOOL)isJailBroken
{
	static const char * __jb_apps[] =
	{
		"/Application/Cydia.app",
		"/Application/limera1n.app",
		"/Application/greenpois0n.app",
		"/Application/blackra1n.app",
		"/Application/blacksn0w.app",
		"/Application/redsn0w.app",
		NULL
	};

	__jb_app = NULL;

	// method 1
    for ( int i = 0; __jb_apps[i]; ++i )
    {
        if ( [[NSFileManager defaultManager] fileExistsAtPath:[NSString stringWithUTF8String:__jb_apps[i]]] )
        {
			__jb_app = __jb_apps[i];
			return YES;
        }
    }

    // method 2
	if ( [[NSFileManager defaultManager] fileExistsAtPath:@"/private/var/lib/apt/"] )
	{
		return YES;
	}

	// method 3
	if ( 0 == system("ls") )
	{
		return YES;
	}

  return NO;
}
```

## Color darkness or lightness

[https://www.w3.org/WAI/ER/WD-AERT/#color-contrast](https://www.w3.org/WAI/ER/WD-AERT/#color-contrast)

`((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000`
Note: This algorithm is taken from a formula for converting RGB values to YIQ values. This brightness value gives a perceived brightness for a color.
