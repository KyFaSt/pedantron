// Our Twitter library
var Twit = require('twit');
var _ = require('underscore');

require('string').extendPrototype();

// We need to include our configuration file
var config = require('./config.js');
var T = new Twit(config);

var queries = ['you could try ', 'you should try ', 'why don\'t you try '];

var pedantries = ['I guess. Or try', 'Personally, I\'d try', 'IMHO, try', 'UGH, no. instead try', 'I disagree. You should try'];

var template = "@{{name}} {{pedantry}} {{original}}";

var getPedantic = function(tweet, match) {
  var text = tweet.text;
  var regex = new RegExp(match, 'i');
  var matchStartIndex = text.search(regex);
  var matchEndIndex = matchStartIndex + match.length;

  var original = text.substr(matchEndIndex);

  var pedanticTweet = template.template({name: tweet.user.screen_name,
                                         pedantry: _.sample(pedantries),
                                         original: original});

  T.post('statuses/update', { status: pedanticTweet, in_reply_to_status_id: tweet.id }, function(e, d) {
    if (e) {
      console.log(e);
    } else {
      console.log(d.text);
    }
  });
};


var userStream = T.stream('user');

userStream.on('follow', function(event) {
  if (event.source.screen_name == config.screen_name) { return; }

  T.post('friendships/create', { user_id: event.source.id }, function(e, d) {
    if (e) {
      console.log(e);
    } else {
      console.log("Now following " + d.screen_name);
    }
  });
});

var unfollow = function(user) {
  T.post('friendships/destroy', { user_id: user.id }, function(e, d) {
    if (e) {
      console.log(e);
    } else {
      console.log("politely unfollowed " + d.screen_name);
    }
  });
};

var ensureFollowing = function(user, onFollowing) {
  if (user.screen_name == config.screen_name) { return; }

  T.get('friendships/show', { source_screen_name: config.screen_name, target_id: user.id }, function(e, d) {
    if (e) {
      console.log(e);
    } else {
      if (d.relationship.target.following) {
        onFollowing(user);
      } else {
        unfollow(user);
      }
    }
  });
};


userStream.on('tweet', function(tweet) {
  ensureFollowing(tweet.user, function() {
    var text = tweet.text.toLowerCase();
    var match = _.find(queries, function(query) {
      return text.contains(query);
    });

    if (match) {
      getPedantic(tweet, match);
    }
  });
});


// // Try to retweet something as soon as we run the program...
// getPedantic();
// // ...and then every hour after that. Time here is in milliseconds, so
// // 1000 ms = 1 second, 1 sec * 60 = 1 min, 1 min * 60 = 1 hour --> 1000 * 60 * 60
// setInterval(getPedantic, 1000 * 60 * 60);
