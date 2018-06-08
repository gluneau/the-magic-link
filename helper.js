const steem = require('steem');

module.exports = {
  async getStoryPosts(account) {
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
  getSubmissions(storyPost) {
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
  }
};