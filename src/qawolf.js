const axios = require('axios')

const qaWolfUrl = process.env.QAWOLF_URL || 'https://www.qawolf.com'

const retryFn = async (fn) => {
  let attempts = 0

  while (attempts < 4) {
    try {
      const result = await fn()
      return result
    } catch (e) {
      attempts++
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  return fn()
}

const createQaWolfSuites = async (netlify_event) => {
  const deployment_environment = process.env.CONTEXT
  const deployment_url = process.env.DEPLOY_PRIME_URL
  const unique_deployment_url = process.env.DEPLOY_URL

  return retryFn(async () => {
    const { data } = await axios.post(
      `${qaWolfUrl}/api/netlify/suites`,
      {
        deployment_environment,
        deployment_url,
        netlify_event,
        unique_deployment_url,
      },
      { headers: { authorization: process.env.QAWOLF_API_KEY } },
    )
    console.log('DATA', data)

    return data.suite_ids
  })
}

const getQaWolfSuite = async (suiteId) => {
  return retryFn(async () => {
    const { data } = await axios.get(
      `${qaWolfUrl}/api/suites/${suiteId}`,
      {
        deployment_environment,
        deployment_url,
        netlify_event,
        unique_deployment_url,
      },
      { headers: { authorization: process.env.QAWOLF_API_KEY } },
    )
    console.log('DATA', data)

    return data.suite_ids
  })
}

const runQaWolfTests = async (netlify_event, buildUtils) => {
  if (!process.env.CONTEXT) {
    buildUtils.failBuild('No context')
  } else if (!process.env.QAWOLF_API_KEY) {
    buildUtils.failBuild('Must set QAWOLF_API_KEY environment variable')
    //   } else if (!process.env.DEPLOY_PRIME_URL) {
    //     buildUtils.failBuild('No deployment URL')
    //   }
  }

  const suiteIds = await createQaWolfSuites(netlify_event)
}

module.exports = { runQaWolfTests }
