const config = require('./config')
const {User} = require('./user')
const Parser = require('./project-parser')
const path = require('path')

let user = User.build({type: 'cache', name: 'djs66256'})
let normalReg = /-\s+\[[\w\W]+?\]\(([\w\W]+?)\)/
let strongReg = /-\s+\*+\[[\w\W]+?\]\(([\w\W]+?)\)[\s\*]+/

function detailInfoWithUrl(url) {
  let json = user.getStarReposSync()
  if (json instanceof Array) {
    return json.find((item, index) => {
      return (url == item.html_url || url == item.clone_url)
    })
  }
  return null
}

let reducer = function (line) {
  let res = line.match(normalReg)
  var resLine = ''
  if (res) {
    let repo = detailInfoWithUrl(res[1])
      // console.log(repo)
    if (repo) {
      resLine = `- [${repo.name}](${repo.clone_url}) **${repo.stargazers_count} Stars** **${repo.language}**` //*${(repo.description || '').trim()}*`
      // console.log(resLine)
    }
  }
  res = line.match(strongReg)
  if (res) {
    let repo = detailInfoWithUrl(res[1])
    if (repo) {
      resLine = `- **[${repo.name}](${repo.clone_url})** **${repo.stargazers_count} Stars** **${repo.language}**`// *${(repo.description || '').trim()}*`
      // console.log(resLine)
    }
  }
  // console.log(line)
  if (resLine) { console.log(resLine); return resLine }
  else return line
}

let parser = new Parser({
  inputPath: path.resolve(config.projectPath, config.projectName),
  outputPath: path.resolve(config.destinationPath, config.projectName),
  reducer: reducer
})

parser.parse()