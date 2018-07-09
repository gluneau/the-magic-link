const steem = require('steem');

module.exports = {
  // helper for recursive post fetching
  getPosts(account, start_author, start_permlink) {
    return new Promise((resolve, reject) => {
      steem.api.getDiscussionsByBlog({
        tag: account,
        limit: 100,
        start_author: start_author,
        start_permlink: start_permlink
      }, (err, res) => {
        if (!err) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    });
  },
  async getAllStoryPosts(account) {
    let storyPosts = [];
    let posts;
    let lastPost;
    let startAuthor = null;
    let startPermlink = null;

    do {
      posts = await this.getPosts(account, startAuthor, startPermlink);
      lastPost = posts[posts.length - 1];
      startAuthor = lastPost.author;
      startPermlink = lastPost.permlink;

      posts.forEach((post) => {
        let meta = JSON.parse(post.json_metadata);
        if (post.author === account && meta.hasOwnProperty('storyNumber') && meta.hasOwnProperty('day')) {
          storyPosts.push(post);
        }
      });

    } while (posts.length === 100);

    // remove duplicates
    storyPosts = storyPosts.filter((post, index, self) => self.findIndex(p => p.permlink === post.permlink) === index);
    storyPosts.reverse();

    return storyPosts;
  },
  getStoryPosts(allStoryPosts, storyNumber) {
    return allStoryPosts.filter(post => {
      let meta = JSON.parse(post.json_metadata);
      return meta.hasOwnProperty('storyNumber') && meta.storyNumber === storyNumber;
    });
  },
  getSubmissions(storyPost) {
    if (storyPost) {
      return new Promise((resolve, reject) => {
        steem.api.getContentReplies(storyPost.author, storyPost.permlink, function(err, comments) {
          if (err) {
            reject(err);
          } else {
            let submissions = [];
            comments.forEach(comment => {
              if (comment.hasOwnProperty('json_metadata') && comment.json_metadata) {
                let meta = JSON.parse(comment.json_metadata);
                if (meta.hasOwnProperty('type') && ['append', 'end'].indexOf(meta.type) !== -1) {
                  submissions.push(comment);
                }
              }
            });
            submissions.sort((a, b) => {
              return b.net_votes - a.net_votes;
            });
            resolve(submissions);
          }
        });
      });
    }
    return [];
  },
  getStories(storyPosts) {
    let stories = [];
    storyPosts.forEach(post => {
      let meta = JSON.parse(post.json_metadata);
      stories[meta.storyNumber - 1] = post;
    });
    return stories;
  },
  getAllCommands(stories) {
    let allCommands = [];
    stories.forEach(storyPost => {
      let meta = JSON.parse(storyPost.json_metadata);
      if (meta.hasOwnProperty('commands') && meta.commands.length) {
        allCommands.push(...meta.commands);
      }
    });
    return allCommands;
  },
  getCurators(allStoryPosts) {
    let curators = []
    allStoryPosts.forEach(post => {
      //  Add each curators contributed amounts of every votes.
      if (post.hasOwnProperty('active_votes') && post.active_votes) {
        let active_votes = JSON.parse(post.active_votes);
        if (active_votes.hasOwnProperty('rshares') && active_votes.rshares) {
          curators.push(post);
        }
      }
    });
    return curators.sort((a, b) => {
      if (a.curations > b.curations)
        return -1;
      if (a.curations < b.curations)
        return 1;
      return 0;
    });
  },
  getContributors(allCommands) {
    let contributors = [];
    allCommands.forEach(command => {
      let exists = contributors.find(contributor => contributor.name === command.author);
      if (exists) {
        contributors[contributors.indexOf(exists)].contributions += 1;
      } else {
        contributors.push({name: command.author, contributions: 1});
      }
    });
    return contributors.sort((a, b) => {
      if (a.contributions > b.contributions)
        return -1;
      if (a.contributions < b.contributions)
        return 1;
      return 0;
    });
  },
  getAccount(account) {
    return new Promise((resolve, reject) => {
      steem.api.getAccounts([account], (err, users) => {
        if (err || users.length === 0) {
          reject(err);
        } else {
          resolve(users[0]);
        }
      });
    });
  },
  getPot(storyPosts) {
    let pot = 0;
    for (let i = 0; i < storyPosts.length; i++) {
      let post = storyPosts[i];
      if (post.last_payout === '1970-01-01T00:00:00') {
        pot += parseFloat(post.pending_payout_value.replace(' SBD', '')) * 0.75 / 2;
      } else {
        pot += (parseFloat(post.total_payout_value.replace(' SBD', '')) / 2);
      }
    }

    pot *= 0.95; // 5 % goes to beneficiaries

    return {
      total: pot,
      delegators: pot * 0.2,
      winner: pot * 0.4,
      others: pot * 0.4
    }
  }
};
