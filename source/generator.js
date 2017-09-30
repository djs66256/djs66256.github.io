class Generator {
  generateStarRepos() {

  }
}

const Path = require('path')
const config = require('./config')

Generator.build = function ({ user }) {
  const { MdGenerator } = require('./generator-md')

  let projectFilePath = Path.resolve(config.projectPath, config.projectName)
  let params = { user, destinationPath: config.destinationPath, projectFilePath }
  return new MdGenerator(params)
}

module.exports = { Generator }

