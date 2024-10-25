import { Player } from '@minecraft/server';
import Tags from '../Data/Tags';

function converTag(tag) {
  if (!tag) return void 0;
  return tag.replace(/[^ ]/, (match) => "§" + match);
}

export default {
  has: function (player, key) {
    if (!(player instanceof Player)) throw new Error("target is not Player");
    const tag = converTag(Tags[key]);
    return tag ? player.hasTag(tag) : false;
  },
  set: function (player, key, value) {
    if (!(player instanceof Player)) throw new Error("Target is not Player");
    const tag = converTag(Tags[key]);
    player[!!value ? 'addTag' : 'removeTag']?.(tag);
  }
};