# probot-flood

Are you a maintainer of a popular GitHub repository?

Do hoardes of thirsty randos clog up your issue tracker?

Not any more with new probot-flood! Wash away your troubles with this new handy-dandy probot that automatically locks issues that cross a threshold of comments/reactions per minute!

Fully configurable by you, yes you! Don't wait, this can be yours today for the low low price of $0!


### Configuration

You don't need any configuration for this to work in your project but you can customize a few things to fit your needs. You can create a .github/probot-flood.yml file:

```yaml
#probot-flood.yml

# How many comments per minute are allowed before probot-flood locks the issue (0 to disable)
commentsPerMinute: 10, 
# How many reactions per minute are allowed before probot-flood locks the issue (0 to disable)
reactionsPerMinute: 0, 
# The message the bot will post before it locks the issue
issueLockMessage: This issue is seeing a lot of traffic, so we're going to lock it for now to just collobarators
```
