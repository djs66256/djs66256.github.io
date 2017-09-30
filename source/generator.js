class Generator {
  generateStarRepos() {

  }
}

const Path = require('path')

Generator.build = function ({ user }) {
  const { MdGenerator } = require('./generator-md')

  let projectFilePath = Path.resolve(__dirname, '_posts', 'project.md')
  let params = { user, destinationPath: __dirname, projectFilePath }
  return new MdGenerator(params)
}

module.exports = { Generator }

