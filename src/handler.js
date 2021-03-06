module.exports = (req, context, callback) => {
  var bot_name = req.bot_name
  var event_name = req.event_name

  var options = {};
  options.req = req;

  switch (bot_name){
    case 'lunch_bot':
      const lunch_bot = require('bot/lunch_bot')

      switch (event_name){
        case 'invite':
          event = lunch_bot.event_invite;
          break;
        case 'aggregate':
          event = lunch_bot.event_aggregate;
          break;
        case 'chat':
          event = lunch_bot.event_chat;
          break;
        default:
          return callback(new Error('invalid event_name: [' + event_name + ']'));
          break;
      }

      break;

    default:
      return callback(new Error('invalid bot_name: [' + bot_name + ']'));
      break;
  }

  var log = ': [' + bot_name + '] [' + event_name + ']';
  console.log('start' + log);

  event(options, (err) => {
    console.log('end' + log);
    callback(err);
  });
};