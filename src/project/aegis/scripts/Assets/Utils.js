import { world, system, ItemStack, Player } from '@minecraft/server';

const PlayersData = new WeakMap();
const BanData = new Aegis.Database('data-ban');

async function ChangeGameMode(player, mode) {
  player['isChangeGameMode'] = true;
  const { successCount } = await player.runCommandAsync(`gamemode ${mode}`);
  player['isChangeGameMode'] = false;

  if (successCount == 0) {
    console.error(`Changing the game mode of ${player.name} failed!`);
  }
}

const isAdmin = (player) => !!player.getDynamicProperty('isAdmin');

const isModerator = (player) => !!player?.getDynamicProperty('isModerator');

const setActionBar = (player, msg, options = {}) => {
  if (typeof msg !== "string") return;

  const { id = null, prioritize = false } = options;
  const currentTime = Date.now();
  const expiryTime = currentTime + 1000; // Message will expire after 1s

  const data = (PlayersData.get(player) || []).filter(t => t.expiryTime >= currentTime);
  const newItem = { text: msg, prioritize, id, expiryTime };

  if (id) {
    const existingIndex = data.findIndex(t => t.id === id);
    existingIndex !== -1 ? data[existingIndex] = newItem : data.push(newItem);
  } else {
    newItem.id = data.length + 1;
    data.push(newItem);
  }

  const actionBarText = data
    .sort((a, b) => b.prioritize - a.prioritize || a.id - b.id)
    .map(i => i.text)
    .join("§r\n");

  player.onScreenDisplay.setActionBar(actionBarText);
  PlayersData.set(player, data);
};

async function kick(player, reason) {
  if (!(player instanceof Player)) throw new TypeError();

  const name = player.name;

  const { successCount } = await Aegis.defaultDimension.runCommandAsync(`kick ${JSON.stringify(name)} ${reason || ""}`);

  if (successCount == 0) {
    player.triggerEvent('aegis:disconnect');

    await system.waitTicks(20);

    if (world.getPlayers({ name: name }).length == 0) return;
    throw new Error(`Tried to kick player "${name}" but failed!"`);
  }
}

function ban(player, time, reason) {
  if (typeof time != 'number' || !(player instanceof Player)) throw new TypeError();
  const currentTime = Date.now();
  const playerData = BanData.get(player.id) || { status: {}, history: [] };

  playerData.history.push({ type: 'ban', atTime: currentTime, time: time, reason: reason });
  playerData.status = { type: 'ban', until: time, reason: reason };
  playerData.info = { name: player.name, id: player.id };

  kick(player, reason);
}

function unban(id, clearData = false) {
  const data = BanData.get(id) || { status: {}, history: [] };
  if (!data) return;

  data.status = {};
  if (clearData) {
    data.history = [];
  }

  BanData.set(id, data);
}

function formatProgressBar(maxTime, currentTime, emptyColor = '§f', filledColor = '§9', reverse = false) {
  currentTime = Math.min(currentTime, maxTime);
  const filledChar = Math.round((currentTime / maxTime) * 10);
  const filledString = '█'.repeat(filledChar);
  const emptyString = '█'.repeat(10 - filledChar);

  return reverse ? `§r${emptyColor}${emptyString}${filledColor}${filledString}§r` : `§r${filledColor}${filledString}${emptyColor}${emptyString}§r`;
}

const flag_config = Aegis.config.get('flag');
const flag_data = new Aegis.Database('data-flag');
const SEPERATOR = "§r§l§e--------------------";
const flag = (player, module, type, detail, maxVl = 5, punishment = 'kick') => {
  const currentTime = Date.now();
  if (flag_config.mode != 'silent') {
    let message = SEPERATOR
      + `\n§r§e${Aegis.Trans('flag.player').replace('<player>', player.name)}`
      + `\n§r§e${Aegis.Trans('flag.source').replace('<module>', module).replace('<type>', type)}`
      + `\n§r§e${Aegis.Trans('flag.detailed').replace('<detail>', detail)}`
      + `\n§r§e${Aegis.Trans('flag.time').replace('<time>', currentTime.toLocaleString(Aegis.config.get('region').area || 'en-US'))}`;
    + `\n${SEPERATOR}`;

    if (flag_config.mode == 'admin') {
      world.getAllPlayers().filter(isAdmin).forEach(player => player.sendMessage(message));
    } else {
      world.getAllPlayers().filter(player => isAdmin(player) || isModerator(player)).forEach(player => player.sendMessage(message));
    }

    const flags = flag_data.get(player.id) ?? [];
    flags.push({
      date: currentTime,
      name: player.name,
      id: player.id,
      module: module,
      type: type,
      detailed: detail
    });
    flag_data.set(player.id, flags);

    if (flags.filter(i => i.module == module).length >= maxVl) {
      if (punishment == 'kick') {
        kick(player);
      }
    }
  }
};

function getAllItemStack(player) {
  return new Promise((resolve) => {
    const container = player.getComponent("inventory").container;

    const itemList = Array.from({ length: container.size })
      .map((_, i) => ({ itemStack: container.getItem(i), slot: i }))
      .filter(item => item.itemStack != null);

    resolve(itemList);
  });
}

function ItemStackToJSON(itemStack) {
  if (!(itemStack instanceof ItemStack)) {
    throw new Error("The parameter must be an instance of ItemStack");
  }

  const newData = {
    name: itemStack.nameTag,
    amount: itemStack.amount,
    typeId: itemStack.typeId,
    lores: itemStack.getLore(),
    enchantments: []
  };

  if (itemStack.hasComponent('minecraft:enchantable')) {
    newData.enchantments = itemStack.getComponent('minecraft:enchantable').getEnchantments();
  }

  return JSON.stringify(newData);
}

function JsonToItemStack(value) {
  try {
    const data = JSON.parse(value);
    const itemStack = new ItemStack(data.typeId, data.amount);

    itemStack.nameTag = data.name;
    itemStack.setLore(data.lores);

    if (itemStack.hasComponent('minecraft:enchantable')) {
      itemStack.getComponent('minecraft:enchantable').addEnchantments(data.enchantments);
    }

    return itemStack;
  } catch (error) {
    console.error(`Error converting JSON to ItemStack: ${error.message}`);
    return null;
  }
}

async function clearChat(target) {
  if (target instanceof Player) {
    try {
      const { successCount } = await target.runCommandAsync('function aegis/tools/clearChat');
      return successCount > 0 ? 'success' : 'fail';
    } catch (error) {
      console.error('Error clearing chat:', error);
      return 'fail';
    }
  }

  if (Array.isArray(target)) {
    const results = await Promise.all(
      target
        .filter(player => player instanceof Player)
        .map(clearChat)
    );

    return results;
  }

  throw new Error('Invalid target: Must be Player or Array of Players');
}

export {
  formatProgressBar,
  ChangeGameMode,
  isAdmin,
  isModerator,
  setActionBar,
  flag,
  kick,
  ban,
  unban,
  getAllItemStack,
  ItemStackToJSON,
  JsonToItemStack,
  clearChat
};