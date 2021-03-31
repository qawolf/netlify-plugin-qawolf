const retry = require('async-retry')
const axios = require('axios')

const qawolfTitle = '🐺 qawolf'
const qaWolfUrl = process.env.QAWOLF_URL || 'https://www.qawolf.com'

const buildSuiteUrl = (suiteId) => {
  return `${qaWolfUrl}/suites/${suiteId}`
}

const createQaWolfSuites = async () => {
  return retry(async (_, attempt) => {
    console.log(`${qawolfTitle}: create suites attempt`, attempt)

    const {
      data: { suite_ids },
    } = await axios.post(
      `${qaWolfUrl}/api/netlify/suites`,
      {
        deployment_environment: process.env.CONTEXT,
        deployment_url: process.env.DEPLOY_PRIME_URL,
        git_branch: process.env.HEAD,
        is_pull_request: process.env.PULL_REQUEST,
        pull_request_id: process.env.REVIEW_ID,
        repo_url: process.env.REPOSITORY_URL,
        sha: process.env.COMMIT_REF,
        unique_deployment_url: process.env.DEPLOY_URL,
      },
      { headers: { authorization: process.env.QAWOLF_API_KEY } },
    )

    console.log(
      `${qawolfTitle}: created ${suite_ids.length} suites for url ${process.env.DEPLOY_PRIME_URL}`,
    )

    return suite_ids
  })
}

const waitForQaWolfSuite = async (suiteId) => {
  const timeoutMs = 30 * 60 * 1000 // 30 minutes
  let timeout = false

  console.log(
    `${qawolfTitle}: wait for suite to run, details at ${buildSuiteUrl(
      suiteId,
    )}`,
  )

  const requestPromise = retry(
    async () => {
      if (timeout) return

      const { data } = await axios.get(`${qaWolfUrl}/api/suites/${suiteId}`, {
        headers: { authorization: process.env.QAWOLF_API_KEY },
      })

      if (!data.is_complete) {
        throw new Error('suite not complete')
      }

      console.log(`${qawolfTitle}: suite ${data.status}ed`)

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

const runQaWolfTests = async (utils) => {
  const skip = process.env.QAWOLF_SKIP
  if (skip && ['1', 'true', 't'].includes(skip.toLowerCase())) {
    utils.status.show({ summary: 'skip', text: `QAWOLF_SKIP=${skip}` })
    return
  }

  const buildUtils = utils.build

  if (!process.env.CONTEXT) {
    buildUtils.failPlugin(`${qawolfTitle} no context`)
  } else if (!process.env.QAWOLF_API_KEY) {
    buildUtils.failPlugin(
      `${qawolfTitle} must set QAWOLF_API_KEY environment variable`,
    )
  } else if (!process.env.DEPLOY_PRIME_URL || !process.env.DEPLOY_URL) {
    buildUtils.failPlugin(`${qawolfTitle} no deployment URL`)
  }

  try {
    const suiteIds = await createQaWolfSuites()

    const suites = await Promise.all(
      suiteIds.map((suiteId) => waitForQaWolfSuite(suiteId)),
    )

    const failingSuite = suites.find((s) => s.status === 'fail')

    const summary = failingSuite
      ? `tests failed, details at ${buildSuiteUrl(failingSuite.id)}`
      : 'tests passed'
    const text = suiteIds.map((suiteId) => buildSuiteUrl(suiteId)).join('\n')

    if (failingSuite) {
      buildUtils.failPlugin(summary)
    } else {
      utils.status.show({ summary, text })
    }

    utils.status.show({ summary: 'complete', text: '🐺' })
    console.log(`${qawolfTitle}: complete`)
  } catch (error) {
    const message = `${qawolfTitle}: failed with message ${error.message}`

    buildUtils.failPlugin(message)
  }
}

module.exports = { createQaWolfSuites, runQaWolfTests, waitForQaWolfSuite }
