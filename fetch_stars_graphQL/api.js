const fetch = require("node-fetch")
const {Base64} = require('js-base64')
// import "fetch"

const fetchStarsQuery = `
query fetchStars($login: String!, $cursor: String) {
  user(login:$login) {
    name
    login
    url
    starredRepositories(
      first: 100, 
      after:$cursor, 
      orderBy: { field: STARRED_AT, direction: DESC }, 
      ownedByViewer: false) {
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      nodes {
        id
        name
        url
        description
        primaryLanguage {
          id
          name
        }
        stargazers {
          totalCount
        }
        forks {
          totalCount
        }
      }
    }
  }
}
`


class User {
  constructor({ username, password }) {
    this.username = username
    this.password = password
  }

  login() {
    return fetch('https://api.github.com', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': this.getAuthHeader()
      }
    })
      .then(r => {
        console.log(r.headers)
        return r.json()
      })
  }

  getAuthHeader() {
    if (this.token) {
      return 'token ' + this.token
    }
    else {
      return 'Basic ' + Base64.encode(this.username + ':' + this.password);
    }
  }

  /**
   * Fetch starred repos of user.
   * @param {json} variables `{
    "login": "djs66256",
    "cursor": "Y3Vyc29yOnYyOpK5MjAxOS0xMi0xNFQxNzowODo0NSswODowMM4L1qZW"
  }`
  * @returns {Promise} `{
    "data": {
      "user": {
        "name": "Daniel",
        "login": "djs66256",
        "url": "https://github.com/djs66256",
        "starredRepositories": {
          "totalCount": 1155,
          "pageInfo": {
            "endCursor": "Y3Vyc29yOnYyOpK5MjAxOS0xMC0yMlQxMDo1Mjo1NSswODowMM4LaGz2",
            "hasNextPage": true,
            "hasPreviousPage": true,
            "startCursor": "Y3Vyc29yOnYyOpK5MjAxOS0xMi0xMlQyMzo1NzoxMiswODowMM4L02p6"
          },
          "nodes": [
            {
              "id": "MDEwOlJlcG9zaXRvcnkyMDg5Nzg1MTA=",
              "name": "TWVM",
              "url": "https://github.com/Becavalier/TWVM",
              "description": "A tiny, lightweight and efficient WebAssembly virtual machine.",
              "primaryLanguage": {
                "id": "MDg6TGFuZ3VhZ2UxNDI=",
                "name": "C++"
              },
              "forks": {
                "totalCount": 1
              },
              "stargazers": {
                "totalCount": 41
              }
            },
            {
              "id": "MDEwOlJlcG9zaXRvcnkxMTA0NDY4NDQ=",
              "name": "marktext",
              "url": "https://github.com/marktext/marktext",
              "description": "📝A simple and elegant markdown editor, available for Linux, macOS and Windows.",
              "primaryLanguage": {
                "id": "MDg6TGFuZ3VhZ2UxNDA=",
                "name": "JavaScript"
              },
              "forks": {
                "totalCount": 974
              },
              "stargazers": {
                "totalCount": 14610
              }
            },
          ]
        }
      }
    }
  }
  `
  */
  fetchStars(variables) {
    return fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': this.getAuthHeader()
      },
      body: JSON.stringify({
        query: fetchStarsQuery,
        variables
      })
    })
      .then(r => r.json())
  }

  fetchAllStars({login}) {
    let list = []
    return this._fetchStarsSlice(list, {login})
  }

  _fetchStarsSlice(list, variables) {
    return this.fetchStars(variables).then(data => {
      // console.log('DATA: ', data)
      let repos = data.data.user.starredRepositories;
      // console.log('REPO: ', repos)
      if (repos) {
        list.push(...repos.nodes)
        if (repos.pageInfo.hasNextPage) {
          return this._fetchStarsSlice(list, { 
            login: variables.login,
            cursor: repos.pageInfo.endCursor
          })
        }
        else {
          return list
        }
      }
    })
  }
}

module.exports = { User }