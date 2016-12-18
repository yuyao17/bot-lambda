const slack = require('lib/slack');

const BOT_ID = CONFIG.LUNCH_BOT.BOT_ID
const TOKEN = CONFIG.LUNCH_BOT.TOKEN

const inviteText = '一緒にランチに行く人募集ー！:kuma-yolo:'

exports.event_invite = (options, callback) => {
  channel_name = options.req.channel_name

  async.waterfall([
    (next) => {
      slack.get_target_channel(TOKEN, channel_name, next);
    },

    (channel, next) => {
      var text = '@here ' + inviteText;
      slack.post_message(TOKEN, channel.id, text, (err, message) => {
        next(err, channel, message);
      });
    },

    (channel, message, next) => {
      var reaction_names = ['hand', 'meat_on_bone', 'sushi', 'chikuwa'];
      slack.add_reactions(TOKEN, channel.id, message.ts, reaction_names, next);
    }
  ], (err) => {
    return callback(err)
  });
}

exports.event_aggregate = (options, callback) => {
  var channel_name = options.req.channel_name

  async.waterfall([
    (next) => {
      slack.get_target_channel(TOKEN, channel_name, next);
    },

    (channel, next) => {
      slack.get_bot_messages(TOKEN, channel, BOT_ID, (err, bot_messages) => {
        console.log(bot_messages);
        inviteMessage = _.find(bot_messages, (message) => {
          return message.text.match(inviteText);
        });
        next(err, channel, inviteMessage);
      });
    },

    (channel, message, next) => {
      reacted_members = _get_reacted_members(message);

      if (reacted_members.length <= 2) {
        if (reacted_members.length === 0) {
          var text = '誰も行かないんですね・・・。洗濯しよ。:kuma_nakami:';
        } else {
          var text = '人数が集まらなかったので中止です・・・。洗濯しよ。:kuma_nakami:';
        }
        return slack.post_message(TOKEN, channel.id, text, (err, message) => {
          return callback(err);
        });
      } else {
        return next(null, channel, message, reacted_members);
      }
    },

    (channel, message, reacted_members, next) => {
      slack.get_members_list(TOKEN, (err, members) => {
        next(err, channel, message, reacted_members, members);
      });
    },

    (channel, message, reacted_members, members, next) => {
      var reacted_member_names = _convert_to_name(reacted_members, members);
      var groups = _make_groups(reacted_member_names);
      var text = _generate_result_text(groups);

      slack.post_message(TOKEN, channel.id, text, (err, message) => {
        return callback(err);
      });
    }
  ], (err) => {
    if(err){
      return callback(err);
    }
    return callback(null);
  });
}

exports.event_chat = (options, callback) => {
  var channel_id = options.req.channel_id
  var from_user_name = options.req.user_name
  var text = options.req.text
  var trigger_word = options.req.trigger_word

  var reply = _generate_reply(from_user_name, text, trigger_word);

  slack.post_message(TOKEN, channel_id, reply, (err, message) => {
    callback(err);
  });
}


_get_reacted_members = (message) => {
  var res = []
  _.forEach(message.reactions, (reaction) => {
    res = res.concat(reaction.users);
  });
  return _.pull(_.uniq(res), BOT_ID);
}

_convert_to_name = (reacted_members, members) => {
  return _.map(reacted_members, (member_id) => {
    return _.find(members, {id: member_id}).name;
  });
}

_make_groups = (reacted_members) => {
  var groups = [];

  if (reacted_members.length >= 12) {
    var group_num = Math.floor(reacted_members.length / 4);
  } else if (reacted_members.length >= 7) {
    var group_num = 2;
  } else {
    var group_num = 1;
  }

  for (var i=0 ; i<group_num ; i++){
    groups.push([]);
  }

  reacted_members = _.shuffle(reacted_members);

  var counter = 0;
  _.forEach(reacted_members, (member) => {
    groups[counter].push(member);
    counter++;
    if(counter >= group_num){
      counter = 0;
    }
  });

  return groups;
}

_generate_result_text = (groups) => {
  var text = 'ランチの組み合わせが決まったよ！:rikakkuma_turn:';

  var counter = 0;
  _.forEach(groups, (group) => {
    counter++;
    var line = '\n' + counter + 'グループ:';
    _.forEach(group, (name) => {
      line = line + ' @' + name;
    });
    text = text + line;
  });

  return text;
}

_generate_reply = (from_user_name, text, trigger_word) => {
  // text = _.replace(text, trigger_word, '');
  text = decodeURI(text);
  var reply = '';

  if (text.match("(おすすめ|オススメ|店|どこ)")) {
    if (_.random(0, 4) === 0) {
      reply = 'んー？今日は `アトレ` でいいんじゃないー？'
    } else {
      restaurant = _select_restaurant();
      emoji = typeof restaurant.emoji !== "undefined" ? restaurant.emoji : '';
      // reply = 'オススメはここくま！' + emoji + '\n';
      // reply = reply + restaurant.name + '\n';
      reply = 'オススメは `' + restaurant.name + '` くま！' + emoji + '\n';
      reply = reply + restaurant.tabelog;
    }
  }

  if (!reply) {
    var rand = _.random(0, 2);
    if (rand == 0) {
      reply = "こんにちは！";
    } else if (rand == 1) {
      reply = "そういうのは大吉さんが得意くま。";
    } else {
      reply = "お腹すいたくま！";
    }
  }

  return reply;
}

_select_restaurant = () => {
  const restaurant_list = require('./restaurant_list');

  var rand = _.random(0, restaurant_list.length - 1);
  return restaurant_list[rand];
}
