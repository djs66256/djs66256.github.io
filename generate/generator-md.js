const Path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const { Generator } = require('./generator')
const config = require('./config')

class MdGenerator extends Generator {
  constructor({ user, destinationPath = config.destinationPath, projectFilePath }) {
    super()
    this.user = user
    this.projectFilePath = projectFilePath
    this.path = destinationPath
    this.mdPath = Path.resolve(this.path, this.user.name + '.md')
    mkdirp(this.path)
  }

  generateStarRepos() {
    return this.user.getStarRepos().then(json => {
      if (json instanceof Array) {
        let repos = json.map(item => {
          let name = item.name
          let git = item.clone_url
          let desc = item.description
          let html = item.html_url
          let starCount = item.stargazers_count
          let language = item.language
          let repo = { name, git, desc, html, starCount, language }
          return repo
        })
        console.log(`[REPOS] total ${json.length}`)
        return repos
      }
      else {
        throw new Error(json.toString())
      }
    }).then(repos => {
      let projectStr = fs.readFileSync(this.projectFilePath).toString()
      let unloadRepos = repos.filter(repo => {
        return !projectStr.match(repo.html) && !projectStr.match(repo.git)
      })
      return unloadRepos
    }).then(repos => {
      let file = fs.openSync(this.mdPath, 'w')
      let offset = 0

      repos.forEach(repo => {
        let repoStr = `- [${repo.name}](${repo.html}) **${repo.starCount} Stars** **${repo.language}** ${repo.desc || ''}\n\n`
        offset += fs.writeSync(file, repoStr, offset)
      })

      fs.closeSync(file)
      console.log('[SUCCESS]!')
    })
  }
}

module.exports = { MdGenerator }
