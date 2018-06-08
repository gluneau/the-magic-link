# The Magic Link

This is the API for [The Magic Frog](https://github.com/mktcode/the-magic-frog) and [The Magic Story Machine](https://github.com/mktcode/the-magic-story-machine)... at least, maybe, someday it will be something like that.

### Install

```
git clone https://github.com/mktcode/the-magic-link.git
cd the-magic-link
npm i
```

The delegators endpoint also needs an API key. It must be set as an env var:

```
export DELEGATORS_API_KEY=IdOnThaV4mFkEY
```

## Endpoints:

**https://api.the-magic-frog.com**
- [`/delegators`](https://github.com/mktcode/the-magic-link/blob/master/index.js#L22): Returns all delegators, order by SP.
- [`/contributors`](https://github.com/mktcode/the-magic-link/blob/master/index.js#L46): Returns all users who have contributed to a story, together with their total number of contributions, ordered by that number.
- [`/submissions`](https://github.com/mktcode/the-magic-link/blob/master/index.js#L80): Returns all currently voteable submissions, order by votes.
- [`/stories`](https://github.com/mktcode/the-magic-link/blob/master/index.js#L64): Returns the last post for each story that exists.
- [`/storyposts`](https://github.com/mktcode/the-magic-link/blob/master/index.js#L96): Returns all posts that belong to a story.

## In a galaxy far far away...

...I am considering to set up an own database to store everything we need, in addition to storing it in the blockchain.
This API can then be the communication layer between the bots/websites and the data... something like that.