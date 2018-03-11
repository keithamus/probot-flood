/* eslint-disable no-labels */
const minuteCreatedAt = obj => Math.round(Date.parse(obj['created_at']) / 60000) * 60000
const incKey = (obj, key) => {
  obj[key] = (obj[key] || 0) + 1
  return obj[key]
}

async function hasTheReactionFloodBegun (context, {id}, reactionsPerMinute) {
  const minuteMap = {}
  let flooding = false
  await context.github.paginate(await context.github.reactions.getForIssueComment(context.repo({ id })), async ({ data: reactions }, done) => {
    flooding = reactions.some(reaction => incKey(minuteMap, minuteCreatedAt(reaction)) >= reactionsPerMinute)
    if (flooding) return done()
  })
  return flooding
}

async function hasTheCommentFloodBegun (context, commentsPerMinute, reactionsPerMinute) {
  const minuteMap = {}
  let flooding = false
  await context.github.paginate(context.github.issues.getComments(), async ({ data: comments }, done) => {
    flooding = comments.some(comment => incKey(minuteMap, minuteCreatedAt(comment)) >= commentsPerMinute)
    if (!flooding && reactionsPerMinute) {
      flooding = (await Promise.all(comments.map(comment => hasTheReactionFloodBegun(context, comment, reactionsPerMinute))))
        .some(Boolean)
    }
    if (flooding) return done()
  })
  return flooding
}

module.exports = (robot) => {
  robot.on(['issue_comment', 'issues'], async context => {
    const {commentsPerMinute, reactionsPerMinute, issueLockMessage} = await context.config('probot-flood.yml', {
      commentsPerMinute: 10,
      reactionsPerMinute: 0,
      issueLockMessage: 'This issue is seeing a lot of traffic, so we\'re going to lock it for now to just collobarators'
    })

    if ((commentsPerMinute || reactionsPerMinute) && await hasTheCommentFloodBegun(context, commentsPerMinute, reactionsPerMinute)) {
      await context.github.issues.createComment(context.issue({body: issueLockMessage}))
      await context.github.issues.lock(context.issue())
    }
  })
}
