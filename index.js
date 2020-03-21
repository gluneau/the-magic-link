require('dotenv').config();
const express = require('express');
const https = require('https');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const helper = require('./helper');

const app = express();

// all the frog accounts
const accounts = ['the-magic-frog', 'der-zauberfrosch', 'grenouille', 'sapo-magico', 'analyzer'];

// allow cross origin resource sharing
app.use(cors());

// get delegators for one of the frog accounts
app.get('/delegators', (req, res, next) => {
  const { account } = req.query;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    let delegators;
    switch (account) {
      case 'the-magic-frog':
        delegators = [
          {"vests": 608447, "time": "2018-07-18 18:26:36", "sp": 302.31, "delegator": "lukestokes.mhth"},
          {"vests": 203005.65, "time" :"2018-06-30 17:47:54", "sp": 100.87, "delegator": "helo"},
          {"vests": 202211.51, "time" :"2018-09-12 13:28:06", "sp": 100.47, "delegator": "mkt"}
        ];
        break;
      case 'grenouille':
        delegators = [
          {"vests": 2017792.85, "delegator": "helo", "sp": 1002.56, "time": "2018-12-08 20:05:06"},
          {"vests": 608446.69, "delegator": "lukestokes.mhth", "sp": 301.54, "time": "2018-07-18 18:40:24"},
          {"vests": 507592.36, "delegator": "pnc", "sp": 251.56, "time": "2018-06-27 20:21:45"},
          {"vests": 50762.65, "delegator": "orlandumike", "sp": 25.16, "time": "2018-06-26 13:54:33"},
          {"vests": 40284.75, "delegator": "zonguin", "sp": 20.02, "time": "2018-12-08 10:34:15"},
          {"vests": 20500, "delegator": "mkt", "sp": 10.16, "time": "2018-06-28 11:58:21"},
          {"vests": 2029.65, "delegator": "dragibusss", "sp": 1.01, "time": "2018-07-04 20:41:45"}
        ];
        break;
      case 'der-zauberfrosch':
        delegators = [
          {"time": "2018-07-13 22:41:15", "vests": 101500, "sp": 50.20547790339829, "delegator": "mkt"}
        ];
        break;
      case 'sapo-magico':
        delegators = [
          {"delegator": "leodelara", "time": "2018-10-17 02:02:00", "sp": 50.02, "vests": 100920.91},
          {"delegator": "helo", "time": "2018-08-21 13:04:15", "sp": 100.14152477164771, "vests": 202450.73},
          {"delegator": "raycoms", "time": "2018-08-21 15:43:48", "sp": 100.1409015171837, "vests": 202449.47},
          {"delegator": "mrprofessor", "time": "2018-08-23 13:10:24", "sp": 50.06535837390386, "vests": 101214.44},
          {"delegator": "juniorfrederico", "time": "2018-08-21 15:21:03", "sp": 20.02819811070714, "vests": 40489.93}
        ];
        break;
    }

    // sort by SP
    delegators.sort((a, b) => a.sp < b.sp);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(delegators);
  }
});

// get all contributors for one of the frog accounts
app.get('/contributors', async (req, res, next) => {
  const { account } = req.query;

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
  const { account } = req.query;
  const top = parseInt(req.query.top, 10);
  const storyNumber = parseInt(req.query.storyNumber, 10);

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);
    const StoryPosts = await helper.getStoryPosts(allStoryPosts, storyNumber);

    if (storyNumber > 0) {
      const curators = helper.getCurators(StoryPosts, account, top);
      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(curators);
    } else {
      const curators = helper.getCurators(allStoryPosts, account, top);
      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(curators);
    }
  }
});

// get all stories (the last post of each story)
app.get('/stories', async (req, res, next) => {
  const { account } = req.query;

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
  const { account } = req.query;

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
  const { account } = req.query;
  const storyNumber = parseInt(req.query.storyNumber, 10);

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
  const { account } = req.query;

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
  const { account } = req.query;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const pot = await helper.getPot(account);

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(pot);
  }
});

// get latest story post
app.get('/lateststorypost', async (req, res, next) => {
  const { account } = req.query;

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
  const { account } = req.query;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    const allStoryPosts = await helper.getAllStoryPosts(account);

    if (allStoryPosts.length) {
      const meta = JSON.parse(allStoryPosts[allStoryPosts.length - 1].json_metadata);
      if (Object.prototype.hasOwnProperty.call(meta, 'commands') && meta.commands.length) {
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
if (process.env.API_PROD === 'true') {
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}!`);
  });
} else {
  // Load your certificates here, look at the README.md if you need to create them
  const options = {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/server.crt'),
  };

  // Create an HTTPS service
  const server = https.createServer(options, app).listen(PORT);
  console.log(`API Listening on ${server.address().address}:${server.address().port}`);
}
