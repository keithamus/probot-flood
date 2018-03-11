/* eslint-disable no-unused-expressions */
const {describe, beforeEach, it} = require('mocha')
const chai = require('chai')
chai.use(require('chai-spies'))
const {spy, expect} = chai

const {createRobot} = require('probot')
const app = require('./')

describe('probot-flood', () => {
  let robot
  let github
  let payload

  beforeEach(() => {
    robot = createRobot()
    app(robot)
    github = {
      paginate: (res, cb) => cb(res, () => {}),
      repos: {
        getContent: () => Promise.resolve({data: {content: Buffer.from('---\nreactionsPerMinute: 10').toString('base64')}})
      },
      issues: {
        createComment: spy(() => Promise.resolve('createComment')),
        lock: spy(() => Promise.resolve('lock'))
      },
      reactions: {
        getForIssueComment: () => ({
          data: [
            { 'created_at': '2018-01-01T01:01:00Z' },
            { 'created_at': '2018-01-01T01:01:02Z' }
          ]
        })
      }
    }
    payload = {
      event: 'issue_comment',
      payload: {
        installation: { id: 1 },
        repository: {
          name: 'foo',
          owner: { login: 'bar' }
        },
        issue: {
          number: 1
        }
      }
    }
    robot.auth = () => Promise.resolve(github)
  })

  describe('when flooded with issue comments', () => {
    beforeEach(() => {
      spy.on(github.issues, 'getComments', () => ({
        data: [
          { 'created_at': '2018-01-01T01:01:00Z' },
          { 'created_at': '2018-01-01T01:01:02Z' },
          { 'created_at': '2018-01-01T01:01:04Z' },
          { 'created_at': '2018-01-01T01:01:06Z' },
          { 'created_at': '2018-01-01T01:01:08Z' },
          { 'created_at': '2018-01-01T01:01:12Z' },
          { 'created_at': '2018-01-01T01:01:14Z' },
          { 'created_at': '2018-01-01T01:01:16Z' },
          { 'created_at': '2018-01-01T01:01:18Z' },
          { 'created_at': '2018-01-01T01:01:20Z' }
        ]
      }))
    })

    it('comments on the the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.createComment).to.have.been.called.with.exactly({
        owner: 'bar',
        repo: 'foo',
        number: 1,
        body: 'This issue is seeing a lot of traffic, so we\'re going to lock it for now to just collobarators'
      })
    })

    it('locks the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.lock).to.have.been.called.with.exactly({
        owner: 'bar',
        repo: 'foo',
        number: 1
      })
    })
  })

  describe('when flooded with reactions', () => {
    beforeEach(() => {
      spy.on(github.issues, 'getComments', () => ({
        data: [
          { 'created_at': '2018-01-01T01:01:00Z' }
        ]
      }))
      spy.on(github.reactions, 'getForIssueComment', () => ({
        data: [
          { 'created_at': '2018-01-01T01:01:00Z' },
          { 'created_at': '2018-01-01T01:01:02Z' },
          { 'created_at': '2018-01-01T01:01:04Z' },
          { 'created_at': '2018-01-01T01:01:06Z' },
          { 'created_at': '2018-01-01T01:01:08Z' },
          { 'created_at': '2018-01-01T01:01:12Z' },
          { 'created_at': '2018-01-01T01:01:14Z' },
          { 'created_at': '2018-01-01T01:01:16Z' },
          { 'created_at': '2018-01-01T01:01:18Z' },
          { 'created_at': '2018-01-01T01:01:20Z' }
        ]
      }))
    })

    it('comments on the the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.createComment).to.have.been.called.with.exactly({
        owner: 'bar',
        repo: 'foo',
        number: 1,
        body: 'This issue is seeing a lot of traffic, so we\'re going to lock it for now to just collobarators'
      })
    })

    it('locks the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.lock).to.have.been.called.with.exactly({
        owner: 'bar',
        repo: 'foo',
        number: 1
      })
    })
  })

  describe('when not flooded with issue comments', () => {
    beforeEach(() => {
      spy.on(github.issues, 'getComments', () => ({
        data: [
          { 'created_at': '2018-01-01T01:01:00Z' },
          { 'created_at': '2018-01-01T01:02:02Z' },
          { 'created_at': '2018-01-01T01:03:04Z' },
          { 'created_at': '2018-01-01T01:04:06Z' },
          { 'created_at': '2018-01-01T01:05:08Z' },
          { 'created_at': '2018-01-01T01:06:12Z' },
          { 'created_at': '2018-01-01T01:07:14Z' },
          { 'created_at': '2018-01-01T01:08:16Z' },
          { 'created_at': '2018-01-01T01:09:18Z' },
          { 'created_at': '2018-01-01T01:09:20Z' }
        ]
      }))
    })

    it('does not comment on the the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.createComment).to.not.have.been.called()
    })

    it('does not lock the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.lock).to.not.have.been.called()
    })
  })

  describe('when not flooded with reactions', () => {
    beforeEach(() => {
      spy.on(github.issues, 'getComments', () => ({
        data: [
          { 'created_at': '2018-01-01T01:01:00Z' }
        ]
      }))
      spy.on(github.reactions, 'getForIssueComment', () => ({
        data: [
          { 'created_at': '2018-01-01T01:01:00Z' },
          { 'created_at': '2018-01-01T02:01:02Z' },
          { 'created_at': '2018-01-01T03:01:04Z' },
          { 'created_at': '2018-01-01T04:01:06Z' },
          { 'created_at': '2018-01-01T05:01:08Z' },
          { 'created_at': '2018-01-01T06:01:12Z' },
          { 'created_at': '2018-01-01T07:01:14Z' },
          { 'created_at': '2018-01-01T08:01:16Z' },
          { 'created_at': '2018-01-01T09:01:18Z' },
          { 'created_at': '2018-01-01T09:01:20Z' }
        ]
      }))
    })

    it('does not comment on the the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.createComment).to.not.have.been.called()
    })

    it('does not lock the issue', async () => {
      await robot.receive(payload)
      expect(github.issues.lock).to.not.have.been.called()
    })
  })
})
