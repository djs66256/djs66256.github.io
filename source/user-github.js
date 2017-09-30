const { fetchStarsByUser } = require('./user-github-helper')
const { User } = require('./user')

class GithubUser extends User {
  getStarRepos() {
    return fetchStarsByUser(this.name)
  }
}

module.exports = GithubUser