var dotenv = require("dotenv");
dotenv.load();
// Put your own Twitter App keys here. See README.md for more detail.
module.exports = {
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_TOKEN_SECRET,
  screen_name: 'pedantron'
}