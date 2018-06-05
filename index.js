const express = require('express');
const axios = require('axios');
const app = express();

// key for delegator API at https://uploadbeta.com/api/steemit/delegators must be set
if (!process.env.DELEGATORS_API_KEY) {
  console.log('Missing env var: DELEGATORS_API_KEY');
  process.exit();
}

// all the frog accounts
const accounts = ['the-magic-frog', 'der-zauberfrosch', 'grenouille'];

// gets all delegators for all frog accounts (AND NO OTHERS!)
app.get('/delegators', (req, res, next) => {
  // loop through accounts an create some promises
  let promises = [];
  accounts.forEach((account) => {
    promises.push(new Promise((resolve, reject) => {
      axios.get('https://uploadbeta.com/api/steemit/delegators/?cached&hash=' + process.env.DELEGATORS_API_KEY + '&id=' + account).then((result) => {
        resolve(result.data);
      }).catch((err) => {
        reject(err);
      });
    }));
  });

  // now get the data
  let delegators = {};
  Promise.all(promises).then(values => {
    values.forEach((value, i) => {
      delegators[accounts[i]] = value;
    });

    // send response
    res.setHeader('Content-Type', 'application/json');
    res.send(delegators);
  }).catch((err) => {
    console.log(err);
    next();
  });
});

// Hey! Listen! https://www.youtube.com/watch?v=95mmGO3sleE
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log('API listening on port ' + PORT + '!');
});