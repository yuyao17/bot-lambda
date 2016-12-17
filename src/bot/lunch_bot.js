const async = require('async');
const _ = require('lodash');
const slack = require('lib/slack');

const BOT_ID = CONFIG.LUNCH_BOT.BOT_ID
const TOKEN = CONFIG.LUNCH_BOT.TOKEN

exports.event_invite = (options, callback) => {
  channel_name = options.channel_name

  async.waterfall([
    (next) => {
      slack.get_target_channel(TOKEN, channel_name, next);
    },

    (channel, next) => {
      text = '@here 一緒にランチに行く人募集ー！:kuma-yolo:';
      slack.post_message(TOKEN, channel.id, text, (err, message) => {
        next(err, channel, message);
      });
    },

    (channel, message, next) => {
      reaction_names = ['hand', 'meat_on_bone', 'sushi', 'chikuwa'];
      slack.add_reactions(TOKEN, channel.id, message.ts, reaction_names, next);
    }
  ], (err) => {
    return callback(err)
  });
}

exports.event_aggregate = (options, callback) => {
  channel_name = options.channel_name

  async.waterfall([
    (next) => {
      slack.get_target_channel(TOKEN, channel_name, next);
    },

    (channel, next) => {
      slack.get_latest_message(TOKEN, channel, BOT_ID, (err, message) => {
        next(err, channel, message);
      });
    },

    (channel, message, next) => {
      reacted_members = _get_reacted_members(message);

      if(reacted_members.length === 0){
        text = '誰も行かないんですね・・・。洗濯しよ。:kuma_nakami:';
        return slack.post_message(TOKEN, channel.id, text, (err, message) => {
          console.log('no one goes');
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
      reacted_member_names = _convert_to_name(reacted_members, members);
      groups = _make_groups(reacted_member_names);
      text = _generate_result_text(groups);

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
  channel_name = options.channel_name

  async.waterfall([
    (next) => {
      slack.get_target_channel(TOKEN, channel_name, next);
    },

    (channel, next) => {
      text = 'こんにちは！';
      slack.post_message(TOKEN, channel.id, text, (err, message) => {
        next(err, channel, message);
      });
    }
  ], (err) => {
    return callback(err)
  });
}


_get_reacted_members = (message) => {
  res = []
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
  groups = [];

  if (reacted_members.length >= 12) {
    group_num = Math.floor(reacted_members.length / 4);
  } else if (reacted_members.length >= 7) {
    group_num = 2;
  } else {
    group_num = 1;
  }

  for (var i=0 ; i<group_num ; i++){
    groups.push([]);
  }

  reacted_members = _.shuffle(reacted_members);

  counter = 0;
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
  text = 'ランチの組み合わせが決まったよ！:rikakkuma_turn:';

  counter = 0;
  _.forEach(groups, (group) => {
    counter++;
    line = '\n' + counter + 'グループ:';
    _.forEach(group, (name) => {
      line = line + ' @' + name;
    });
    text = text + line;
  });

  return text;
}