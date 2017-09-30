const fetchRepos = require('./fetchRepos')

let username = 'djs66256'
let projectFilePath = '_posts/project.md'
let destinationPath = `${username}.md`

fetchRepos.generateUnpackStarsByUser(username, projectFilePath, destinationPath)
