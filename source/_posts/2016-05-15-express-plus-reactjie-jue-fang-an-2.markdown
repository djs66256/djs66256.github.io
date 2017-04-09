---
layout: post
title: "express+react解决方案 （二）"
date: 2016-05-15 00:51:38 +0800
comments: true
categories:
- 技术
tags:
- node
- express
- ES6
- mysql
- redis
- sequelize
- 服务器
- 架构
---

这里来谈谈rest api服务构建。

<!--more-->

## Express

Express是node做http服务最有名的一个框架了，具体如何安装使用我不做介绍了，大家可以参考[官方网站](https://nodejs.org)。

## ES6

由于ES6的新特性实在是太棒了，所以我选择使用ES6。可是node目前版本v6.0.0对ES6的支持还不够好。还好有babel这个开源库。[ES6 语法可以参考阮一峰的这本书 >>](http://es6.ruanyifeng.com/)

可以直接全局安装 `npm install -g babel-cli` ，启动时候把node替换为babel-node，就可以完全支持ES6了。

我为了调试方便，所以在代码中启用支持。

首先安装babel依赖库。

```json
"dependencies": {
    "babel-core": "~6.5.2",
    "babel-polyfill": "~6.0.0",
    "babel-preset-es2015": "~6.0.0",
}
```

然后在app启动的时候导入 ES6 运行环境。

```javascript
require("babel-core");
require('babel-core/register')({
    presets: ["es2015"],
    ignore: ["node_modules/", "app.js"],
    extensions: [".js"],
    cache: true
});
require('babel-polyfill');
```

启动参数可以加上方法缓存 `BABEL_CACHE_PATH=./xxx`。

好了我们的项目已经支持 ES6 了，只是启动的时候会有点慢，如果node能直接支持就好了，不过我相信很快就可以了。

## MySql

支持 ES6 以后，我们需要添加数据库层，首先安装依赖组件。

```json
"mysql": "~2.10.2",
"sequelize": "~3.0",
```

这里我经过比较采用了 [`sequelize`](http://docs.sequelizejs.com/en/latest/) 这个ORM。

在添加配置文件 `./bin/config.js`。最好的做法需要配置正式、开发等多套环境，这里我只做一套配置。

```javascript
const mysql = {
        host: "localhost",
        port: 3306,
        database: "db",
        user: "root",
        password: ""
    },

export default mysql;
```

配置 `sequelize`

```js
import Sequelize from 'sequelize';
import {mysql as config} from '../bin/config';

var sequelize = new Sequelize(config.database, config.user, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'mysql',
    freezeTableName: true,

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

export default sequelize;
```

好了，我们的数据库服务配置完成。

## Redis

同样，首先需要配置文件。这里我配置了2个分别作为数据缓存和 http 缓存使用。

```json
redisCache = {
    host: "localhost",
    port: 6379,
    user: "",
    password: "",
    db: 2,
    prefix: "redis",
    expire: 60*60
},
httpCache = {
    host: "localhost",
    port: 6379,
    user: "",
    password: "",
    db: 3,
    prefix: "redis",
    expire: 60*60
};


export {redisCache, httpCache};
```

对数据缓存做一个简单的封装。使其支持`key-value`和`key-hashtable`这两种格式就够用了。在设置完后需要设置缓存时间`expire`。用于缓存token和验证码等服务。

```js
class Redis {

    constructor(config) {
        this._client = redis.createClient(config);
        this._expire = config.expire || 60;
    }

    expire(key, expire = this._expire) {
        let _client = this._client;
        return new Promise((resolve, reject) => {
            _client.expire(key, expire, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    // set a hash table
    hset(key, value = {}, {expire=this._expire}) {
        let _client = this._client;
        let _expire = this.expire;
        return new Promise((resolve, reject) => {
            let arr = [];
            for (let [k, v] of value) {
                arr.push(k, v);
            }
            if (arr.length == 0) {
                reject(new Error("value is empty"));
            }
            _client.hset(key, arr, (err) => {
                if (err) reject(err);
                else _expire(key, expire).then(resolve).catch(reject)
            });
        });
    }

    // get a hash table
    hget(key) {
        let _client = this._client;
        return new Promise((resolve, reject) => {
            _client.hgetall(key, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            })
        })
    }

    set(key, value, {expire=this.expire}) {
        let _client = this._client;
        let _expire = this.expire;
        return new Promise((resolve, reject) => {
            _client.set(key, value, (err) => {
                if (err) reject(err);
                else  _expire(key, expire).then(resolve).catch(reject)
            })
        })
    }

    get(key) {
        let _client = this._client;
        return new Promise((resolve, reject) => {
            _client.get(key, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }
}

export default Redis;
```

使用时只要创建一个具体对象就可以了。

另外，再创建一个http缓存的中间件，用来缓存一些接口变化比较缓慢，实时性要求不高，但需要大量计算的数据。

```js
export default function({
    expire=config.expire,
    getKey=(req)=>{ req.originalUrl }
} = {}) {
    return function (req, res, next) {
        let key = getKey(req);
        new Promise((resolve, reject) => {
            redis.hget(key).then((data) => {
                if (data && data.length > 0) {
                    // TODO: set header 'Content-Type' ect.
                    //res.setHeader()
                    res.setHeader('Content-Length', data.body.length);
                    res.send(data.body);
                    resolve();
                }
                else {
                    reject();
                }
            }).catch(reject);
        }).catch(() => {
            // there is no cache
            next();

            if (res.statusCode == 200 && res.body.length > 0) {
                // add body to cache
                // TODO: validate res.body
                redis.hset(key, {
                    'Content-Type': res.getHeader('Content-Type'),
                    body: res.body
                });
            }
        });
    }
}
```

这是一个比较简单的实现，`key`默认使用url。当然也可以自定义。使用场景：

```js
router.get('/:id', httpCache({
    expire:60,
    getKey(req) {
        return "POST:" + req.path;
    }
    }), (req, res, next) => {
    ......
});
```

这样，我们的数据层都已经配置完毕，接下来需要开始进入实践。

## 结构

目录结构：

```
|\
| \model   // 数据结构相关
|\
| \controller  // 真正的业务处理层，像Spring里的service层
|\
| \routes  // 路由控制，缓存以及行为控制
```

这里我为了简化，只把服务分为这些，来减少复杂度，同时又相对解耦。

首先看看model层，这里定义了整个表的结构和数据模型

```js
let User = sequelize.define('user', {
   // name: Sequelize.STRING,
    password: {
        type: Sequelize.STRING
    },
    salt: {
        type: Sequelize.STRING(16)
    },
    nickName: {
        type: Sequelize.STRING,
        field: 'nick_name'
    },
    email: {
        type: Sequelize.STRING,
        validate: {
            isEmail: true
        }
    },
    birthday: Sequelize.DATE,
    gender: Sequelize.INTEGER(8),
    createTime: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW(),
        field: 'nick_name'
    },
    updateTime: {
        type: Sequelize.DATE,
        field: 'update_time'
    },
    loginTime: {
        type: Sequelize.DATE,
        field: 'login_time'
    }
}, {
    timestamps: false,
    freezeTableName: true,
    defaultScope: {
        attributes: ['nickName','email','birthday','gender','createTime','updateTime']
    }
});

// 这里提供给外部可以编辑的属性配置
User.editableAttribute = ['nickName', 'birthday', 'gender'];

// 这里我们可以选择让 sequelize 来建表
if (process.env.SYNC_DATABASE) {
    User.sync();
}

export default User;
```

controller定义所有的逻辑操作，提供包括验证的，但是独立的功能服务。

```js
let Controller = {

    create({email=null, password=null} = {}) {
        return new Promise((resolve, reject) => {
            if (email && password) {
                validatePassword(password).then(() => {
                    User.findOne({email: email}).then((user) => {
                        if (user) return reject("您已经注册,请直接登录");
                        else {
                            let salt = salt(email);
                            let encryptPassword = encryptPassword(password, salt);
                            User.create({
                                email: email,
                                password:encryptPassword,
                                salt: salt
                            }).then(resolve).catch(reject(err));
                        }
                    }).catch(reject);

                }).catch(reject);
            }
            else {
                reject(new Error("用户名或密码为空"));
            }
        });
    },

    update(user) {
        return new Promise((resolve, reject) => {
            if (user.id) {
                return reject(new Error("用户ID为空"));
            }
            if (user.password && user.salt) {
                return reject(new Error("参数非法"));
            }

            User.update(filterValidateKey(user, User.editableAttribute), {
                where: {
                    id: user.id
                }
            }).then(resolve).catch(reject);
        })
    },

    findByIds(ids = []) {
        return new Promise((resolve, reject) => {
            User.findAll({
                where: { id: { $in: ids } },
                include: {
                    model: Tag,
                    as: 'tags'
                }
            }).then(resolve).catch(reject)
        })
    },

    addTags(tagIds = []) {

    }
}

export default Controller;
```

最后，路由来组合其中不同的业务逻辑。

```js
router.get('/:id', (req, res, next) => {
    let id = req.params.id;
    if (id) {
        UserController.findByIds([id]).then((users) => {
            if (users.length > 0) {
                res.send(Success(users[0]));
            }
            else {
                res.send(Fail('用户不存在'));
            }
        }).catch((err) => {
            res.send(Fail(err.message));
        })
    }
    else {
        res.send(Fail("参数错误"));
    }
});
```

## 其他

很多场景，我们需要判断用户登录情况以及一些其他情况，如果在每个请求里面去做判断会是一种非常麻烦的事情，而且也会导致代码冗余和复杂性，这些功能可以做成中间件形式，使用时也会方便很多。

```js
// NeedLogin 伪代码
function NeedLogin() {
    return function(req, res, next) {
    	if (req.isLogin()) {
           next();
       }
       else {
           res.send(Fail('need login');
       }
    };
};

router.get('/:id', NeedLogin(), (req, res, next) => {
    ......
})
```

## 测试

等待加入该模块

----

下一篇，我们来看看react来构建web应用的框架。
