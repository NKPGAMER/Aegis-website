import { Player, world } from '@minecraft/server';
import { registerModule } from '../Functions/Modules/module';
import { prefix, commands } from '../Functions/CustomCommands/handler';
import Tags from '../Data/Tags';
const PlayersData = new WeakMap();

const config = {
  "enable": true,
  "chatRank": {
    "enable": true,
    "join": "§r§7] [§r",
    "start": "§7[",
    "end": "§r§7]"
  },
  "max-length": 350,
  "max-consecutive-message": 3,
  "message-cooldown": 3000
}; //Aegis.config.get('chat-manager');
const TransKey = 'handler.chat.';

function isMute(player) {
  if (!(player instanceof Player)) return;

  if (player.hasTag(Tags.disable.sendMessage)) {
    Aegis.sendMessage(Aegis.Trans(TransKey + 'isMute'));
    return true;
  }

  const data = player.getDynamicProperty('data-mute');
  if (!data) return false;

  const endTime = data.endTime;

  if (typeof endTime == 'number' && endTime < Date.now()) {
    Aegis.sendMessage(Aegis.Trans(TransKey + 'isMuteDate').replace('<endTime>', new Date(endTime).toLocaleString(Aegis.config.get('region')?.area)), player);
    return true;
  }


  return false;
}

function handler(eventData) {
  const { sender: player, message } = eventData;
  eventData.cancel = true;

  if (message.startsWith(prefix)) {
    const args = parseArgs(message.slice(prefix.length));
    const commandName = args?.shift()?.toLowerCase() || "";

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      if (hasPermission(player, command.permission)) {
        command.func(player, args);
      } else {
        player.sendMessage('§c' + Aegis.Trans('handler.chat.command.unpremission'));
      }
    } else {
      Aegis.sendMessage('§c' + Aegis.Trans('handler.chat.command.unknown')
        .replace('<command>', commandName)
        .replace('<help>', prefix + 'help'), player
      );
    }
    return;
  }

  if (message.length > config['max-length']) {
    Aegis.sendMessage(Aegis.Trans(TransKey + 'maxLength'), player);
    return;
  }

  if (isMute(player)) return;
  const currentTime = Date.now();
  const playerData = PlayersData.get(player) ?? {};

  if (currentTime - playerData.lastSend < config['message-cooldown']) {
    playerData.consecutiveMessage++;

    if (playerData.consecutiveMessage > 3) {
      Aegis.sendMessage(Aegis.Trans('handler.chat.fastChat'));
    }
  }
}

function updateData(eventData) {
  const playerData = PlayersData.get(eventData.sender) ?? {};
  playerData.lastMessage = eventData.message;
  playerData.lastSend = Date.now();
  PlayersData.set(eventData.sender);
}

registerModule('chat-manager', {},
  {
    event: 'chatSend',
    type: 'before',
    callback: handler
  },
  {
    event: 'chatSend',
    type: 'after',
    callback: updateData
  }
);