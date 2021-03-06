const request = require('request');

_call_slack_api = (method_name, qs, callback) => {

  var options = {
    uri: 'https://slack.com/api/' + method_name,
    method: 'GET',
    json: true,
    qs: qs
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

exports.get_channels_list = (token, callback) => {
  var method = 'channels.list';
  var qs = {
    token: token,
    exclude_archived: 1
  };
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.channels);
  });
}

exports.post_message = (token, channel_id, text, callback) => {
  var method = 'chat.postMessage';
  var qs = {
    token: token,
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

exports.get_channels_history = (token, channel_id, callback) => {
  var method = 'channels.history';
  var qs = {
    token: token,
    channel: channel_id
  };
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.messages);
  });
}

exports.add_reactions = (token, channel_id, ts, reaction_names, callback) => {
  async.each(reaction_names, (reaction_name, next) => {
    var method = 'reactions.add';
    var qs = {
      token: token,
      name: reaction_name,
      channel: channel_id,
      timestamp: ts
    };
    _call_slack_api(method, qs, next)
  }, (err) => {
    callback(err);
  });
}


exports.get_members_list = (token, callback) => {
  var method = 'users.list';
  var qs = {
    token: token
  };
  _call_slack_api(method, qs, (err, body) => {
    if(err){
      return callback(err);
    }
    return callback(null, body.members);
  });
}

exports.get_target_channel = (token, channel_name, callback) => {
  exports.get_channels_list(token, (err, channels) => {
    target_channel = _.find(channels, {name: channel_name});
    callback(null, target_channel);
  });
}

exports.get_bot_messages = (token, channel, user, callback) => {
  exports.get_channels_history(token, channel.id, (err, messages) => {
    bot_messages = _.filter(messages, {user: user});
    callback(null, bot_messages);
  });
}

exports.get_latest_bot_message = (token, channel, user, callback) => {
  exports.get_channels_history(token, channel.id, (err, messages) => {
    latest_message = _.find(messages, {user: user});
    callback(null, latest_message);
  });
}