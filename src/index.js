const { runQaWolfTests } = require('./qawolf')

module.exports = {
  // Runs on build success
  onSuccess: async ({ utils }) => {
    return runQaWolfTests(utils)
  },
}
