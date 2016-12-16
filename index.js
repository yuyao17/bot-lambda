const handler = require('./src/handler');

exports.run = (event, context, callback) => {
  if(!event || !event.event_name || !event.channel_name){
    return callback(new Error('invalid request'));
  }

  start_msg = 'start: [' + event.event_name + ']';
  console.log(start_msg);

  handler(event, context, (err) => {
    if(err){
      return callback(err);
    }

    end_msg = 'end: [' + event.event_name + ']';
    console.log(end_msg);
    callback(null);
  });
}