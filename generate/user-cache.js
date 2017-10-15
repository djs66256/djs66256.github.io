const Path = require('path')

const config = require('./config')
const { User } = require('./user')
const { RepoCache } = require('./repo-cache')

class CachedUser extends User {
  constructor(params) {
    super(params)
    this.repoCache = new RepoCache({
      path: Path.resolve(config.dataPath, params.name), 
      name: params.name
    })
    this.repos = []
  }

  getStarRepos() {
    return new Promise((resolve, reject) => {
      try {
        this.repos = this.repoCache.loadRepos() || []
        resolve(this.repos)
      }
      catch(e) {
        reject(e)
      }
    })
  }

  getStarReposSync() {
    return this.repoCache.loadRepos() || []
  }

  setStarRepos(repos) {
    return new Promise((resolve, reject) => {
      try {
        this.repos = repos
        this.repoCache.saveRepos(repos)
        resolve()
      }
      catch(e) {
        reject(e)
      }
    })
  }
}

module.exports = CachedUser
