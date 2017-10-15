const { UserConfig } = require('./user-config')

let userConfigs = new UserConfig()

let _userConstructors = {}

class User {
  constructor({name}) {
    this.name = name
  }

  // return: Promise
  getStarRepos() {}
  getStarReposSync() {}

  static register(type, cls) {
    _userConstructors[type] = cls
  }
  static build({type, name}) {
    userConfigs.setUserConfigWithName(name, {})
    if (!type || type === 'cache') {
      return new _userConstructors['cache']({type, name})
    }
    else {
      let user = new _userConstructors[type]({type, name})
      let cache = new _userConstructors['cache']({type, name})
      return new CompositeUser({user, cache, type, name})
    }
  }
}

class CompositeUser extends User {
  constructor({user, cache, name}) {
    super({name})
    this.user = user
    this.cache = cache
  }

  getStarRepos() {
    return this.user.getStarRepos().then(repos => {
      this.cache.setStarRepos(repos).catch(e => console.error('[Error] ' + e.message))
      return repos
    })
  }
}

module.exports = { User, userConfigs }

User.register('github', require('./user-github'))
User.register('cache', require('./user-cache'))

function testFetch(name) {
  console.log('[TEST] testFetch')
  let user = User.build({
    type: 'github',
    name
  })
  user.getStarRepos().then(repos => {
    console.log(`Fetch ${repos.length} repos!`)
  }).catch(e => {
    console.error(`Error ${e.message}`)
  }).then(() => {
    // cache
    let cache = User.build({
      type: 'cache',
      name: 'djs66256'
    })
    cache.getStarRepos().then(repos => {
      console.log(`Fetch ${repos.length} repos!`)
    }).catch(e => {
      console.error(`Error ${e.message}`)
    })
  })
}

function testCache(name) {
  console.log('[TEST] testCache')
  let cache = User.build({
    type: 'cache',
    name
  })
  cache.getStarRepos().then(repos => {
    console.log(`Fetch ${repos.length} repos!`)
  }).catch(e => {
    console.error(`Error ${e.message}`)
  })
}

// testFetch('djs66256')
// testCache('djs66256')

// console.log(User.build({type: 'github', name: 'test'}))
// console.log(User.build({type: 'cache', name: 'test'}))
