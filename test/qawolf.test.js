const axios = require('axios')
const qawolf = require('../src/qawolf')

jest.mock('axios')

const failPlugin = jest.fn()
const show = jest.fn()

const utils = {
  build: { failPlugin },
  git: {
    commits: [
      {
        sha: 'sha',
        parents: 'parents',
        author: {
          name: 'QA Wolf',
          email: 'hello@qawolf.com',
          date: '2021-04-01 12:28:54 -0600',
        },
        committer: {
          name: 'QA Wolf',
          email: 'hello@qawolf.com',
          date: '2021-04-01 12:28:54 -0600',
        },
        message: 'Initial commit',
      },
    ],
  },
  status: { show },
}

describe('runQaWolfTests', () => {
  afterEach(() => jest.clearAllMocks())

  it('handles QA Wolf tests passing onSuccess', async () => {
    process.env.COMMIT_REF = 'sha'

    axios.post.mockResolvedValueOnce({ data: { suite_ids: ['suiteId'] } })
    axios.get.mockResolvedValueOnce({
      data: { is_complete: true, status: 'pass' },
    })

    await qawolf.runQaWolfTests(utils)

    const postArgs = axios.post.mock.calls[0]
    expect(postArgs[1]).toMatchObject({
      committed_at: '2021-04-01 12:28:54 -0600',
      message: 'Initial commit',
      sha: 'sha',
    })
    expect(postArgs[2]).toMatchObject({
      headers: { authorization: process.env.QAWOLF_API_KEY },
    })

    expect(
      failPlugin.mock.calls[failPlugin.mock.calls.length - 1][0],
    ).not.toMatch('qawolf: tests failed')
  })

  it('handles QA Wolf tests failing onSuccess', async () => {
    axios.post.mockResolvedValueOnce({ data: { suite_ids: ['suiteId'] } })
    axios.get.mockResolvedValueOnce({
      data: { is_complete: true, status: 'fail' },
    })

    await qawolf.runQaWolfTests(utils)

    const postArgs = axios.post.mock.calls[0]
    expect(postArgs[2]).toMatchObject({
      headers: { authorization: process.env.QAWOLF_API_KEY },
    })

    expect(failPlugin.mock.calls[failPlugin.mock.calls.length - 1][0]).toMatch(
      'tests failed, details at',
    )
  })

  it('allows skipping the plugin', async () => {
    process.env.QAWOLF_SKIP = 'true'

    await qawolf.runQaWolfTests(utils)

    expect(show.mock.calls).toHaveLength(1)
    expect(show.mock.calls[0][0]).toEqual({
      summary: 'skip',
      text: 'QAWOLF_SKIP=true',
    })
  })
})
