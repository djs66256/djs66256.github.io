const URL = require('url')
const http = require('https')

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
    })
    request.on('aborted', err => {
      callback && callback(res, null, err)
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
                callback(allRepo, new Error('data format error! ' + JSON.stringify(json)))
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

module.exports = { fetchStarsByUser }
