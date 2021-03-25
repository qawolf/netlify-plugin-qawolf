const { runQaWolfTests } = require('./qawolf')

module.exports = {
  // Runs after Build commands are executed
  onPostBuild: async ({ utils }) => {
    return runQaWolfTests('onPostBuild', utils)
  },
  // Runs on build success
  onSuccess: async ({ utils }) => {
    return runQaWolfTests('onSuccess', utils)
  },
}
