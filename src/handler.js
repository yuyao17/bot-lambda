const lunch_bot = require('./lunch_bot')

module.exports = (event, context, callback) => {
  options = {};
  options.channel_name = event.channel_name;

  if(event.event_name === 'invite'){
    _event = lunch_bot.event_invite;
  }
  else if(event.event_name === 'aggregate'){
    _event = lunch_bot.event_aggregate;
  }
  else if(event.event_name === 'chat'){
    _event = lunch_bot.event_chat;
  }

  _event(options, callback);
};