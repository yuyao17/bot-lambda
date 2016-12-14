const request = require('request');
const async = require('async');
const _ = require('lodash');

const CONFIG = require('../conf/config')

_call_slack_api = (method_name, qs, callback) => {
  _qs = _.extend({
    token: CONFIG.TOKEN
  }, qs);

  options = {
    uri: 'https://slack.com/api/' + method_name,
    method: 'GET',
    json: true,
    qs: _qs
  };

  request(options, (err, response, body) => {
    if(err){
      return callback(err);
    } else if (!body.ok) {
      return callback(new Error('cannot call slack api'));
    }
    return callback(null, body);
  });
}

exports.get_channels_list = (callback) => {
  method = 'channels.list';
  qs = {
    exclude_archived: 1
  };
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.channels);
  });
}

exports.post_message = (channel_id, text, callback) => {
  method = 'chat.postMessage';
  qs = {
    channel: channel_id,
    text: text,
    parse: 'full',
    as_user: true
  };
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.message);
  });
}

exports.get_channels_history = (channel_id, callback) => {
  method = 'channels.history';
  qs = {
    channel: channel_id
  };
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.messages);
  });
}

exports.add_reactions = (channel_id, ts, reaction_names, callback) => {
  async.each(reaction_names, (reaction_name, next) => {
    method = 'reactions.add';
    qs = {
      name: reaction_name,
      channel: channel_id,
      timestamp: ts
    };
    _call_slack_api(method, qs, next)
  }, (err) => {
    callback(err);
  });
}


exports.get_members_list = (callback) => {
  method = 'users.list';
  qs = {};
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.members);
  });
}

exports.get_target_channel = (channel_name, callback) => {
  exports.get_channels_list( (err, channels) => {
    target_channel = _.find(channels, {name: channel_name});
    callback(null, target_channel);
  });
}

exports.get_latest_message = (channel, user, callback) => {
  exports.get_channels_history(channel.id, (err, messages) => {
    latest_message = _.find(messages, {user: user});
    callback(null, latest_message);
  });
}