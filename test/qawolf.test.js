const axios = require('axios')
const qawolf = require('../src/qawolf')

jest.mock('axios')

const failBuild = jest.fn()
const failPlugin = jest.fn()
const show = jest.fn()

const utils = {
  build: { failBuild, failPlugin },
  status: { show },
}

describe('runQaWolfTests', () => {
  afterEach(() => jest.clearAllMocks())

  it('handles QA Wolf tests passing onPostBuild', async () => {
    axios.post.mockResolvedValueOnce({ data: { suite_ids: ['suiteId'] } })
    axios.get.mockResolvedValueOnce({
      data: { is_complete: true, status: 'pass' },
    })

    await qawolf.runQaWolfTests('onPostBuild', utils)

    const postArgs = axios.post.mock.calls[0]
    expect(postArgs[0]).toBe('https://www.qawolf.com/api/netlify/suites')
    expect(postArgs[1]).toMatchObject({ netlify_event: 'onPostBuild' })

    const getArgs = axios.get.mock.calls[0]
    expect(getArgs[0]).toBe('https://www.qawolf.com/api/suites/suiteId')

    expect(
      failBuild.mock.calls[failBuild.mock.calls.length - 1][0],
    ).not.toMatch('tests failed')

    expect(show.mock.calls[0][0]).toEqual({ summary: 'qawolf: complete' })
  })

  it('handles QA Wolf tests failing onPostBuild', async () => {
    axios.post.mockResolvedValueOnce({ data: { suite_ids: ['suiteId'] } })
    axios.get.mockResolvedValueOnce({
      data: { is_complete: true, status: 'fail' },
    })

    await qawolf.runQaWolfTests('onPostBuild', utils)

    expect(failBuild.mock.calls[failBuild.mock.calls.length - 1][0]).toMatch(
      'qawolf: tests failed',
    )
  })

  it('handles QA Wolf tests failing onSuccess', async () => {
    axios.post.mockResolvedValueOnce({ data: { suite_ids: ['suiteId'] } })
    axios.get.mockResolvedValueOnce({
      data: { is_complete: true, status: 'fail' },
    })

    await qawolf.runQaWolfTests('onSuccess', utils)

    const postArgs = axios.post.mock.calls[0]
    expect(postArgs[1]).toMatchObject({ netlify_event: 'onSuccess' })

    expect(
      failBuild.mock.calls[failBuild.mock.calls.length - 1][0],
    ).not.toMatch('qawolf: tests failed')
  })
})
