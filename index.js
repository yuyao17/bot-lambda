exports.run = (event, context, callback) => {
  if(!event || !event.event_name || !event.channel_name || !event.bot_name){
    return callback(new Error('invalid request'));
  }

  process.env['NODE_PATH'] = __dirname + '/src'
  require('module')._initPaths();
  global.CONFIG = require('conf/config')

  log = ': [' + event.bot_name + '] [' + event.event_name + ']';
  console.log('start' + log);

  const handler = require('handler');
  handler(event, context, (err) => {
    if(err){
      return callback(err);
    }

    console.log('end' + log);
    callback(null);
  });
}