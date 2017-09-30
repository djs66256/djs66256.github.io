const path = require('path')
module.exports = {
  projectPath: path.resolve(__dirname, '..', 'source', '_posts'),
  projectName: 'project.md',
  dataPath: path.resolve(__dirname, '.repos'),
  usersDataName: 'users.json',
  destinationPath: __dirname
}