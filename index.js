exports.run = (req, context, callback) => {

  console.log('start lambda');
  console.log('req:' + JSON.stringify(req, undefined, 1));

  errMsg = _validate(req, context);
  if(errMsg){
    console.error(errMsg);
    // console.error('req:' + JSON.stringify(req, undefined, 1));
    // console.error('context:' + JSON.stringify(context, undefined, 1));
    return callback(new Error(errMsg));
  }

  _setup();

  const handler = require('handler');
  handler(req, context, (err) => {
    if(err){
      // console.error('req:' + JSON.stringify(req, undefined, 1));
      // console.error('context:' + JSON.stringify(context, undefined, 1));
      return callback(err);
    }

    callback(null);
  });
}

_validate = (req, context) => {
  errMsg = null;
  if(!req || !req.bot_name || !req.event_name || !req.channel_name){
    errMsg = 'invalid request';
  }
  return errMsg;
}

_setup = () => {
  process.env['NODE_PATH'] = __dirname + '/src'
  require('module')._initPaths();
  global.async = require('async');
  global._ = require('lodash');
  global.CONFIG = require('conf/config')
}