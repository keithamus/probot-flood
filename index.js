/* eslint-disable no-labels */
async function hasTheCommentFloodBegun (context, commentsPerMinute, reactionsPerMinute) {
  let commentMinutes = {}
  let reactionMinutes = {}
  let page = -1
  while (true) {
    const {data: comments} = await context.github.issues.getComments(context.issue({ page: page += 1, per_page: 100 }))
    for (const comment of comments) {
      const minute = new Date(Math.round(Date.parse(comment['created_at']) / 60000) * 60000)
      commentMinutes[minute] = (commentMinutes[minute] || 0) + 1
      if (commentMinutes[minute] > commentsPerMinute) return true
      if (reactionsPerMinute) {
        const id = comment.id
        doReactions: while (true) {
          const {data: reactions} = await context.github.reactions.getForIssueComment(context.repo({ id }))
          for (const reaction of reactions) {
            const minute = new Date(Math.round(Date.parse(reaction['created_at']) / 60000) * 60000)
            reactionMinutes[minute] = (reactionMinutes[minute] || 0) + 1
            if (reactionMinutes[minute] > reactionsPerMinute) return true
          }
          if (reactions.length < 100) break doReactions
        }
      }
    }
    if (comments.length < 100) break
  }
  return false
}

module.exports = (robot) => {
  robot.on(['issue_comment', 'issues'], async context => {
    const {commentsPerMinute, reactionsPerMinute, issueLockMessage} = await context.config('probot-flood.yml', {
      commentsPerMinute: 10,
      reactionsPerMinute: 0,
      issueLockMessage: 'This issue is seeing a lot of traffic, so we\'re going to lock it for now to just collobarators'
    })

    if ((commentsPerMinute || reactionsPerMinute) && hasTheCommentFloodBegun(context, commentsPerMinute, reactionsPerMinute)) {
      await context.github.issues.createComment(context.issue({body: issueLockMessage}))
      await context.github.issues.lock(context.issue())
    }
  })
}
