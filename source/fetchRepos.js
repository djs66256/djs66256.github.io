const http = require('https')
const fs = require('fs')
const URL = require('url')

// link: '<https://api.github.com/user/2426762/starred?page=2>; rel="next", <https://api.github.com/user/2426762/starred?page=28>; rel="last"'
function getNextUrlFromLinkHeader(link) {
  let url = null
  link.split(',').forEach(item => {
    let components = item.split(';')
    if (components.length >= 2) {
      if (components[1].match('rel="next"')) {
        url = components[0].trim().replace('<', '').replace('>', '')
      }
    }
  })
  return url
}

// function callback(res, json, error)
function request(urlStr, callback) {
  console.log(`[Request] ${urlStr}`)
  let url = URL.parse(urlStr)
  let request = http.request({
      hostname: url.hostname,
      path: url.path,
      headers: {
        'user-agent': 'Test'
      }
    }, (res) => {
      var buffer = ''
      res.on('data', (data) => {
        buffer += data.toString()
      });
      res.on('end', () => {
        // console.log(`[END] Fetch stars of ${username}!`, res.headers)
        // resolve(JSON.parse(buffer))
        callback && callback(res, JSON.parse(buffer))
      })
      res.on('error', err => {
        callback && callback(res, null, err)
      })
    })
    request.end()
}

function fetchStarsByUser(username) {
  return new Promise((resolve, reject) => {
    request(`https://api.github.com/users/${username}/starred`, (res, json, err) => {
      if (err) reject(err)
      else if (json instanceof Array) {
        let allRepo = json
        // function callback(json, error)
        function fetchNext(res, callback) {
          let url = getNextUrlFromLinkHeader(res.headers['link'])
          if (url) {
            request(url, (res, json, err) => {
              if (err) callback(allRepo, err)
              else if (json instanceof Array) {
                if (json.length > 0) {
                  allRepo = allRepo.concat(json)
                  fetchNext(res, callback)
                }
                else {
                  callback(allRepo, null)
                }
              }
              else {
                callback(allRepo, new Error('data format error!' + JSON.stringify(json)))
              }
            })
          }
          else {
            callback(allRepo, new Error('Null url!'))
          }
        }

        fetchNext(res, (json, err) => {
          console.log(`[Finish] total ${json.length}, error: ${err}`)
          if (json.length == 0 && err) reject(err)
          else resolve(json)
        })
      }
      else {
        reject(new Error('data format error! ' + JSON.stringify(json)))
      }
    })
  })
}

function generateUnpackStarsByUser(username, projectFilePath, destinationPath) {
  fetchStarsByUser(username).then(json => {
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
    let projectStr = fs.readFileSync(projectFilePath).toString()
    let unloadRepos = repos.filter(repo => {
      return !projectStr.match(repo.html) && !projectStr.match(repo.git)
    })
    return unloadRepos
  }).then(repos => {
    let file = fs.openSync(destinationPath, 'w')
    let offset = 0

    repos.forEach(repo => {
      let repoStr = `- [${repo.name}](${repo.html}) **${repo.starCount} Stars** *${repo.language}* \n${repo.desc || ''}\n\n`
      offset += fs.writeSync(file, repoStr, offset)
    })

    fs.closeSync(file)
    console.log('[SUCCESS]!')
  }).catch(e => {
    console.error(`[ERROR] ${e.message}`)
  })
}

module.exports = { generateUnpackStarsByUser, fetchStarsByUser}