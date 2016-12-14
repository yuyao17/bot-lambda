const async = require('async');
const _ = require('lodash');
const slack = require('./lib/slack');

const CONFIG = require('./conf/config')
const BOT_ID = CONFIG.BOT_ID
const CHANNEL_NAME = CONFIG.CHANNEL_NAME

exports.event_send = (options, callback) => {
  async.waterfall([
    (next) => {
      slack.get_target_channel(CHANNEL_NAME, next);
    },

    (channel, next) => {
      text = '@here 一緒にランチに行く人募集ー！';
      slack.post_message(channel.id, text, (err, message) => {
        next(err, channel, message);
      });
    },

    (channel, message, next) => {
      reaction_names = ['hand', 'meat_on_bone', 'sushi', 'chikuwa'];
      slack.add_reactions(channel.id, message.ts, reaction_names, next);
    }
  ], (err) => {
    return callback(err)
  });
}

exports.event_aggregate = (options, callback) => {
  async.waterfall([
    (next) => {
      slack.get_target_channel(CHANNEL_NAME, next);
    },

    (channel, next) => {
      slack.get_latest_message(channel, BOT_ID, (err, message) => {
        next(err, channel, message);
      });
    },

    (channel, message, next) => {
      reacted_members = _get_reacted_members(message);

      if(reacted_members.length === 0){
        text = '誰も行かないんですね・・・。残念です。';
        return slack.post_message(channel.id, text, (err, message) => {
          console.log('no one goes');
          return callback(err);
        });
      } else {
        return next(null, channel, message, reacted_members);
      }
    },

    (channel, message, reacted_members, next) => {
      slack.get_members_list( (err, members) => {
        next(err, channel, message, reacted_members, members);
      });
    },

    (channel, message, reacted_members, members, next) => {
      reacted_member_names = _convert_to_name(reacted_members, members);
      groups = _make_groups(reacted_member_names);
      text = _generate_result_text(groups);

      slack.post_message(channel.id, text, (err, message) => {
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
  text = 'ランチの組み合わせが決まったよ！';

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