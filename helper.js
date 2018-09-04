const steem = require('steem');

module.exports = {
  // helper for recursive post fetching
  getPosts(account, startAuthor, startPermlink) {
    return new Promise((resolve, reject) => {
      steem.api.getDiscussionsByBlog({
        tag: account,
        limit: 100,
        start_author: startAuthor,
        start_permlink: startPermlink,
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

      for (let index = 0; index < posts.length; index += 1) {
        const meta = JSON.parse(posts[index].json_metadata);
        if (posts[index].author === account && Object.prototype.hasOwnProperty.call(meta, 'storyNumber') && Object.prototype.hasOwnProperty.call(meta, 'day')) {
          storyPosts.push(posts[index]);
        }
      }
    } while (posts.length === 100);

    // remove duplicates
    storyPosts = storyPosts.filter((post, index, self) => self.findIndex(
      p => p.permlink === post.permlink,
    ) === index);
    storyPosts.reverse();

    return storyPosts;
  },
  getStoryPosts(allStoryPosts, storyNumber) {
    return allStoryPosts.filter((post) => {
      const meta = JSON.parse(post.json_metadata);
      return Object.prototype.hasOwnProperty.call(meta, 'storyNumber') && meta.storyNumber === storyNumber;
    });
  },
  getSubmissions(storyPost) {
    if (storyPost) {
      return new Promise((resolve, reject) => {
        steem.api.getContentReplies(storyPost.author, storyPost.permlink, (err, comments) => {
          if (err) {
            reject(err);
          } else {
            const submissions = [];
            comments.forEach((comment) => {
              if (Object.prototype.hasOwnProperty.call(comment, 'json_metadata') && comment.json_metadata) {
                const meta = JSON.parse(comment.json_metadata);
                if (Object.prototype.hasOwnProperty.call(meta, 'type') && ['append', 'end'].indexOf(meta.type) !== -1) {
                  submissions.push(comment);
                }
              }
            });
            submissions.sort((a, b) => b.net_votes - a.net_votes);
            resolve(submissions);
          }
        });
      });
    }
    return [];
  },
  getStories(storyPosts) {
    const stories = [];
    storyPosts.forEach((post) => {
      const meta = JSON.parse(post.json_metadata);
      stories[meta.storyNumber - 1] = post;
    });
    return stories;
  },
  getAllCommands(stories) {
    const allCommands = [];
    stories.forEach((storyPost) => {
      const meta = JSON.parse(storyPost.json_metadata);
      if (Object.prototype.hasOwnProperty.call(meta, 'commands') && meta.commands.length) {
        allCommands.push(...meta.commands);
      }
    });
    return allCommands;
  },
  // get all the curators if not the frog account
  getCurators(allStoryPosts, account, top) {
    const curators = [];
    allStoryPosts.forEach((post) => {
      if (Object.prototype.hasOwnProperty.call(post, 'active_votes') && post.active_votes) {
        post.active_votes.forEach((vote) => {
          if (Object.prototype.hasOwnProperty.call(vote, 'rshares') && vote.rshares && vote.voter !== account) {
            const index = curators.findIndex(curator => curator.voter === vote.voter);
            if (index !== -1) {
              curators[index].rshares += parseInt(vote.rshares, 10);
            } else {
              curators.push({ voter: vote.voter, rshares: parseInt(vote.rshares, 10) });
            }
          }
        });
      }
    });
    // Sorting in order of most curation happends here
    return curators.sort((a, b) => {
      if (a.rshares > b.rshares) return -1;
      if (a.rshares < b.rshares) return 1;
      return 0;
    }).slice(0, parseInt(top, 10));
  },
  getContributors(allCommands) {
    const contributors = [];
    allCommands.forEach((command) => {
      const exists = contributors.find(contributor => contributor.name === command.author);
      if (exists) {
        contributors[contributors.indexOf(exists)].contributions += 1;
      } else {
        contributors.push({ name: command.author, contributions: 1 });
      }
    });
    return contributors.sort((a, b) => {
      if (a.contributions > b.contributions) return -1;
      if (a.contributions < b.contributions) return 1;
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
  getPot(account) {
    return new Promise((resolve, reject) => {
      steem.api.getAccounts([account], (err, users) => {
        if (err || users.length === 0) {
          reject(err);
        } else {
          const pot = parseFloat(users[0].sbd_balance.replace(' SBD', ''));
          resolve({
            total: pot,
            delegators: pot * 0.25,
            curators: pot * 0.25,
            winner: pot * 0.25,
            others: pot * 0.25,
          });
        }
      });
    });
  },
};
