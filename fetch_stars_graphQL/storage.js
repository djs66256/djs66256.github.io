const fs = require('fs')
const path = require('path')

const basedir = path.join(__dirname, 'data')
if (!fs.existsSync(basedir)) {
  fs.mkdirSync(basedir, { recursive: true })
  console.log('mkdir ' + basedir)
}

class Storage {
  constructor(username) {
    this.username = username
    this.path = path.join(basedir, `${username}.json`)
    this.data = {}
  }

  exists() {
    return fs.existsSync(this.path)
  }

  setCommentById(id, comment) {
    let repo = this.findRepoById(id)
    repo._comment = comment
  }

  findCommentById(id) {
    let repo = this.findRepoById(id)
    return repo._comment
  }

  setTagById(id, tag) {
    let repo = this.findRepoById(id)
    repo._tag = tag
  }

  findTagById(id) {
    let repo = this.findRepoById(id)
    return repo._tag
  }

  addRepos(repos) {
    for (let repo of repos) {
      this.addRepo(repo)
    }
  }

  addRepo(repo) {
    let id = repo.id
    if (id) {
      let oldRepo = this.findRepoById(id) || {}
      let newRepo = Object.assign(oldRepo, repo)
      this.data[id] = newRepo
    }
  }

  findRepoById(id) {
    return this.data[id]
  }

  loadFromLocal() {
    let data = fs.readFileSync(this.path)
    if (data) {
      console.log(data.toJSON())
      this.data = data.toJSON()
    }
  }

  saveToLocal() {
    fs.writeFileSync(this.path, JSON.stringify(this.data))
  }
}

module.exports = {Storage}