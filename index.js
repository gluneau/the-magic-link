const express = require('express');
const https = require('https');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const helper = require('./helper');

const options = {
  key: fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/server.crt')
};

const app = express();

// key for delegator API at https://uploadbeta.com/api/steemit/delegators must be set
if (!process.env.DELEGATORS_API_KEY) {
  console.log('Missing env var: DELEGATORS_API_KEY');
  process.exit();
}

// all the frog accounts
const accounts = ['the-magic-frog', 'der-zauberfrosch', 'grenouille', 'analyzer'];

// allow cross origin resource sharing
app.use(cors());

// get delegators for one of the frog accounts
app.get('/delegators', (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    axios.get('https://uploadbeta.com/api/steemit/delegators/?cached&hash=' + process.env.DELEGATORS_API_KEY + '&id=' + account).then((result) => {
      let delegators = result.data;
      // sort by SP
      delegators.sort((a, b) => {
        return a.sp < b.sp;
      });

      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(delegators);
    }).catch((err) => {
      console.error(err);
      next();
    });
  }
});

// get all contributors for one of the frog accounts
app.get('/contributors', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const stories = helper.getStories(allStoryPosts);
    const allCommands = helper.getAllCommands(stories);
    const contributors = helper.getContributors(allCommands);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(contributors);
  }
});

// get all contributors for one of the frog accounts
app.get('/curators', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const curators = helper.getCurators(allStoryPosts);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(curators);
  }
});

// get all stories (the last post of each story)
app.get('/stories', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const stories = helper.getStories(allStoryPosts);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(stories);
  }
});

// get all commands from current story post
app.get('/submissions', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const submissions = await helper.getSubmissions(allStoryPosts[allStoryPosts.length - 1]);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(submissions);
  }
});

// get all story posts
app.get('/storyposts', async (req, res, next) => {
  const account = req.query.account;
  let storyNumber = parseInt(req.query.storyNumber);

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    allStoryPosts.reverse();
    const stories = helper.getStories(allStoryPosts);

    if (storyNumber && storyNumber <= stories.length) {
      const storyPosts = helper.getStoryPosts(allStoryPosts, storyNumber);
      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(storyPosts);
    } else {
      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(allStoryPosts);
    }
  }
});

// get account data
app.get('/account', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const accountData = await helper.getAccount(account);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(accountData);
  }
});

// get pot size
app.get('/pot', async (req, res, next) => {
  const account = req.query.account;
  let storyNumber = parseInt(req.query.storyNumber);

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const stories = helper.getStories(allStoryPosts);

    // validate storyNumber, fallback to latest
    storyNumber = storyNumber && storyNumber <= stories.length ? storyNumber : stories.length;

    const storyPosts = helper.getStoryPosts(allStoryPosts, storyNumber);
    const pot = helper.getPot(storyPosts);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(pot);
  }
});

// get latest story post
app.get('/lateststorypost', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);

    if (allStoryPosts.length) {
      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(allStoryPosts[allStoryPosts.length - 1]);
    } else {
      next();
    }
  }
});

// has latest story ended
app.get('/hasstoryended', async (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);

    if (allStoryPosts.length) {
      const meta = JSON.parse(allStoryPosts[allStoryPosts.length - 1].json_metadata);
      if (meta.hasOwnProperty('commands') && meta.commands.length) {
        // send response
        res.setHeader('Content-Type', 'application/json');
        res.send(meta.commands[meta.commands.length - 1].type === 'end');
      } else {
        next();
      }
    } else {
      next();
    }
  }
});

// Hey! Listen! https://www.youtube.com/watch?v=95mmGO3sleE
const PORT = process.env.PORT || 3333;
const server = https.createServer(options, app).listen(PORT);
console.log("API Listening on " + server.address().address + ":" + server.address().port);
