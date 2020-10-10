const {Storage} = require('./storage')
const process = require('process')
const fs = require('fs')

let argv = process.argv

if (argv.length < 3) {
  console.error('Use: ')
  process.exit(-1)
}

let username = argv[2]

let storage = new Storage(username)
if (storage.exists()) {
  
}
