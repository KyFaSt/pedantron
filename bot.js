// Our Twitter library
var Twit = require('twit');
var _ = require('underscore');

require('string').extendPrototype();

// We need to include our configuration file
var config = require('./config.js');
var T = new Twit(config);

var queries = ['you could try ', 'you should try ', 'why don\'t you try ',
  'I\'d try ', 'have you tried ', 'did you try ', 'you might try '];

var pedantries = ['I guess. Or try', 'Personally, I\'d try', 'IMHO, try', 'UGH, no. instead try', 'I disagree. You should try'];

var template = "{{names}} {{pedantry}} {{original}}";

var getPedantic = function(tweet, match) {
  var text = tweet.text;
  console.log(tweet.user.screen_name + ": " + text);

  var regex = new RegExp(match, 'i');
  var matchStartIndex = text.search(regex);
  var matchEndIndex = matchStartIndex + match.length;

  var original = text.substr(matchEndIndex);

  var names = ["@" + tweet.user.screen_name].concat(text.match(/@[\w]+/g));
  names = _.without(names, "@" + config.screen_name);
  names = _.uniq(names);

  var pedanticTweet = template.template({names: names.join(" "),
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


var userStream = T.stream('user', { replies: 'all' });

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
      console.log("relationship:", d.relationship.source.screen_name, d.relationship.target.screen_name);
      console.log("following", d.relationship.target.following);
      console.log("followed_by", d.relationship.target.followed_by);
      if (d.relationship.target.following) {
        onFollowing(user);
      } else {
        unfollow(user);
      }
    }
  });
};

var isRetweetOfMe = function(tweet) {
  var retweet = tweet.retweeted_status;
  return retweet && retweet.user.screen_name == config.screen_name;
};

userStream.on('tweet', function(tweet) {
  ensureFollowing(tweet.user, function() {
    if (isRetweetOfMe(tweet)) { return; }

    var text = tweet.text.toLowerCase();
    var match = _.find(queries, function(query) {
      return text.contains(query);
    });

    if (match) {
      getPedantic(tweet, match);
    }
  });
});


var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
