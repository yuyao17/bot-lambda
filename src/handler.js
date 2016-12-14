const lunch_bot = require('./lunch_bot')

module.exports = (event, context, callback) => {
  if(event.event_name === 'send'){
    _event = lunch_bot.event_send;
  }
  else if(event.event_name === 'aggregate'){
    _event = lunch_bot.event_aggregate;
  }

  options = {};
  _event(options, callback);
};