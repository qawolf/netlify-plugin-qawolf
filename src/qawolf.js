const retry = require('async-retry')
const axios = require('axios')

const qaWolfUrl = process.env.QAWOLF_URL || 'https://www.qawolf.com'

const createQaWolfSuites = async (netlifyEvent, statusUtils) => {
  return retry(async (_, attempt) => {
    statusUtils.show('qawolf: create suite attempt', attempt)

    const {
      data: { suite_ids },
    } = await axios.post(
      `${qaWolfUrl}/api/netlify/suites`,
      {
        deployment_environment: process.env.CONTEXT,
        deployment_url: process.env.DEPLOY_PRIME_URL,
        git_branch: process.env.HEAD,
        netlify_event: netlifyEvent,
        pull_request_id: process.env.REVIEW_ID,
        repo_url: process.env.REPOSITORY_URL,
        sha: process.env.COMMIT_REF,
        unique_deployment_url: process.env.DEPLOY_URL,
      },
      { headers: { authorization: process.env.QAWOLF_API_KEY } },
    )

    statusUtils.show(`qawolf: created ${suite_ids.length} suites`)

    return suite_ids
  })
}

const waitForQaWolfSuite = async (suiteId, statusUtils) => {
  const timeoutMs = 30 * 60 * 1000 // 30 minutes
  let timeout = false

  statusUtils.show(`qawolf: wait for suite ${suiteId} to run`)

  const requestPromise = retry(
    async () => {
      if (timeout) return

      const { data } = await axios.get(`${qaWolfUrl}/api/suites/${suiteId}`, {
        headers: { authorization: process.env.QAWOLF_API_KEY },
      })

      if (!data.is_complete) {
        throw new Error('suite not complete')
      }

      statusUtils.show(`qawolf: suite ${suiteId} ${data.status}ed`)

      return data
    },
    {
      factor: 1,
      maxTimeout: 5000,
      minTimeout: 5000,
      retries: Math.round(timeoutMs / 5000),
    },
  )

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      timeout = true
      reject(new Error(`Suite ${suiteId} did not complete before timeout`))
    }, timeoutMs)
  })

  return Promise.race([requestPromise, timeoutPromise])
}

const runQaWolfTests = async (netlifyEvent, utils) => {
  const buildUtils = utils.build
  const statusUtils = utils.status

  if (!process.env.CONTEXT) {
    buildUtils.failBuild('qawolf: no context')
  } else if (!process.env.QAWOLF_API_KEY) {
    buildUtils.failBuild('qawolf: must set QAWOLF_API_KEY environment variable')
  } else if (!process.env.DEPLOY_PRIME_URL || !process.env.DEPLOY_URL) {
    buildUtils.failBuild('qawolf: no deployment URL')
  }

  try {
    const suiteIds = await createQaWolfSuites(netlifyEvent, statusUtils)

    const suites = await Promise.all(
      suiteIds.map((suiteId) => waitForQaWolfSuite(suiteId, statusUtils)),
    )

    const failingSuite = suites.find((s) => s.status === 'fail')

    if (failingSuite && netlifyEvent === 'onPostBuild') {
      buildUtils.failBuild(
        `qawolf: tests failed, details at ${qaWolfUrl}/suites/${failingSuite.id}`,
      )
    }

    statusUtils.show('qawolf: complete')
  } catch (error) {
    const message = `qawolf: failed with error ${error.message}`

    if (netlifyEvent === 'onPostBuild') {
      buildUtils.failBuild(message)
    } else {
      buildUtils.failPlugin(message)
    }
  }
}

module.exports = { runQaWolfTests }
