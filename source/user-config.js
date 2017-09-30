const fs = require('fs')
const Path = require('path')
const mkdirp = require('mkdirp')

class UserConfig {

  constructor({path = Path.resolve(__dirname, '.repos'), name = 'users.json'}={}) {
    this.userContainer = null
    this.userContainerPath = Path.resolve(path, name)
    mkdirp(path)
  }

  getUserConfigs() {
    if (!this.userContainer) {
      try {
        let data = fs.readFileSync(this.userContainerPath)
        this.userContainer = JSON.parse(data.toString()) || {}
      }
      catch(e) {
        this.userContainer = {}
      }
    }
    return this.userContainer
  }

  getUserConfigWithName(name) {
    return this.getUserConfigs()[name]
  }

  setUserConfigWithName(name, config) {
    this.userContainer[name] = config
    try {
      fs.writeFileSync(this.userContainerPath, JSON.stringify(this.userContainer, null, 4))
    }
    catch(e) {
      console.error('[Error] ' + e.message)
    }
  }
}

module.exports = { UserConfig }