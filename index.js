const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// key for delegator API at https://uploadbeta.com/api/steemit/delegators must be set
if (!process.env.DELEGATORS_API_KEY) {
  console.log('Missing env var: DELEGATORS_API_KEY');
  process.exit();
}

// all the frog accounts
const accounts = ['the-magic-frog', 'der-zauberfrosch', 'grenouille'];

// allow cross origin resource sharing
app.use(cors());

// get delegators for one of the frog accounts
app.get('/delegators', (req, res, next) => {
  const account = req.query.account;

  if (accounts.indexOf(account) === -1) {
    next();
  } else {
    axios.get('https://uploadbeta.com/api/steemit/delegators/?cached&hash=' + process.env.DELEGATORS_API_KEY + '&id=' + account).then((result) => {
      // send response
      res.setHeader('Content-Type', 'application/json');
      res.send(result.data);
    }).catch((err) => {
      console.error(err);
      next();
    });
  }
});

// Hey! Listen! https://www.youtube.com/watch?v=95mmGO3sleE
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log('API listening on port ' + PORT + '!');
});