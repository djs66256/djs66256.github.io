const {User} = require('./api')
const {Storage} = require('./storage')
const progress = require('process')

let argv = process.argv

console.log(argv)

if (argv.length < 2 + 2) {
  console.log('Use: npm run fetch ${username} ${password} ${usernameToFetch}')
  progress.exit(-1)
}


let username = argv[2]
let password = argv[3]
let usernameToFetch = (() => {
  if (argv.length > 4) return argv[4]
  else return username
})()

let storage = new Storage(usernameToFetch)

let user = new User({username, password})
user.fetchAllStars({login: usernameToFetch}).then(repos => {
  console.log('REPOS: \n', repos)
  storage.addRepos(repos)
  storage.saveToLocal()
}).catch(e => {
  console.error(e)
})