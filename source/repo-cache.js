const fs = require('fs')
const Path = require('path')
const mkdirp = require('mkdirp')

class RepoCacheOptions {
  constructor({path}) {
    this.path = Path.resolve(path, 'cache_options.json')
    this.isOptionsLoaded = false
    this.options = {}
  }

  _decodeOptions(optionStr) {
    if (!optionStr) return {}
    return JSON.parse(optionStr)
  }
  _encodeOptions(options) {
    return JSON.stringify(options, null, 4)
  }
  _loadOptionsIfNeeded() {
    if (!this.isOptionsLoaded) {
      try {
        let data = fs.readFileSync(this.path)
        this.options = this._decodeOptions(data.toString())
      }
      catch(e) {
        this.options = {}
      }
      this.isOptionsLoaded = true
    }
  }
  _saveOptions() {
    if (this.options) {
      fs.writeFileSync(this.path, this._encodeOptions(this.options))
    }
  }

  getOptions(name) {
    this._loadOptionsIfNeeded()
    return this.options[name]
  }

  getOption(name, key) {
    return (this.getOptions(name) || {})[key]
  }

  setOptions(name, options) {
    this._loadOptionsIfNeeded()
    this.options[name] = options
    this._saveOptions()
  }

  setOption(name, key, value) {
    this._loadOptionsIfNeeded()
    let options = this.options[name]
    if (!options) {
      options = this.options[name] = {}
    }
    options[key] = value
    this._saveOptions()
  }
}

class RepoCache {
  constructor({path = Path.resovle(__dirname, '.repos/cache'), name='default'}) {
    this.path = path
    this.name = name
    this.options = new RepoCacheOptions({path})
    this.repos = []
    this.isReposLoaded = false
    mkdirp.sync(this.path)
  }

  _nameWithVersion(version) {
    return `${this.name}.${version}`
  }
  _filePathWithVersion(version) {
    return Path.resolve(this.path, this._nameWithVersion(version) + '.json')
  }
  _getLatestVersion() {
    return this.options.getOption(this.name, 'version') || 0
  }
  _increaseLatestVersion() {
    let newVersion = this._getLatestVersion() + 1
    this.options.setOption(this.name, 'version', newVersion)
    return newVersion
  }
  _saveReposOfVersion(version, repos) {
    let data = JSON.stringify(repos, null, 4)
    fs.writeFileSync(this._filePathWithVersion(version), data)
  }
  _loadReposOfVersion(version) {
    try {
      let data = fs.readFileSync(this._filePathWithVersion(version))
      return JSON.parse(data.toString()) || []
    }
    catch(e) {
      return []
    }
  }
  _loadReposIfNeeded() {
    if (!this.isReposLoaded) {
      this.repos = this._loadReposOfVersion(this._getLatestVersion()) || []
      this.isReposLoaded = true
    }
  }

  saveRepos(repos) {
    if (repos instanceof Array) {
      let version = this._increaseLatestVersion()
      this.repos = repos
      this._saveReposOfVersion(version, repos)
    }
    else {
      console.error('[Error] Repos is not Array!')
    }
  }

  loadRepos({version} = {}) {
    if (version) {
      return this._loadReposOfVersion(version)
    }
    else {
      this._loadReposIfNeeded()
      return this.repos
    }
  }
}

function test() {
  let cache = new RepoCache({
    path: Path.resolve(__dirname, '.test'), 
    name: 'test'
  })
  console.log(JSON.stringify(cache.loadRepos()))
  cache.saveRepos([{id: "1234"}])
  console.log(JSON.stringify(cache.loadRepos()))
}

// test()

module.exports = {RepoCache}
