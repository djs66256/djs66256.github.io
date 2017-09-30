
const { User, userConfigs } = require('./user')
const { Generator } = require('./generator')

let username = 'djs66256'

let user = null
if (userConfigs.getUserConfigWithName(username)) {
  user = User.build({ type: 'cache', name: username })
}
else {
  user = User.build({ type: 'github', name: username })
}

Generator.build({ user }).generateStarRepos().catch(e => {
  console.error(`[ERROR] ${e.message}`)
})