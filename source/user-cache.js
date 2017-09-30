const Path = require('path')

const { User } = require('./user')
const { RepoCache } = require('./repo-cache')

class CachedUser extends User {
  constructor(params) {
    super(params)
    this.repoCache = new RepoCache({
      path: Path.resolve(__dirname, '.repos', params.name), 
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
