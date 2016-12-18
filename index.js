exports.run = (req, context, callback) => {

  console.log('start lambda');
  console.log('req:' + JSON.stringify(req, undefined, 1));

  _setup();

  try {
    _validate(req, context);
    _authenticate(req);
  } catch (err) {
    console.error(err);
    return callback(err);
  }

  const handler = require('handler');
  handler(req, context, (err) => {
    if(err){
      return callback(err);
    }

    callback(null);
  });
}

_setup = () => {
  process.env['NODE_PATH'] = __dirname + '/src'
  require('module')._initPaths();
  global.async = require('async');
  global._ = require('lodash');
  global.CONFIG = require('conf/config')
}

_validate = (req, context) => {
  if(!req || !req.bot_name || !req.event_name || !req.channel_name){
    throw new Error('invalid request');
  }
}

_authenticate = (req) => {
  // api経由の場合は認証を行う
  if (req.from_api) {
    if (req.bot_name === 'lunch_bot') {
      if (req.token !== CONFIG.LUNCH_BOT.OUTGOING_TOKEN) {
        throw new Error('authentication reject');
      }
    }
  }
}