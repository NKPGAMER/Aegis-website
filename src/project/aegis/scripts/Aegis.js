import { world, system, Player, Dimension, Entity } from '@minecraft/server';
import { Database } from './Assets/Database';
import { MemoryCache } from './Assets/MemoryCache';
import languages from './Data/Languages/languages';

const startTime = Date.now();

globalThis.Aegis = (() => {
  const AegisPrefix = '§7[§eAegis§7]§r ';
  const localOpId = new Set(['-4294967295', '-206158430207']);
  const aegis = {
    defaultDimension: world.getDimension('overworld'),
    config: new Database('config'),
    Trans: Translation,
    execute,
    Database,
    MemoryCache,
    ServerType: 'server'
  };

  const formatMessage = value =>
    typeof value === 'string'
      ? AegisPrefix + value
      : { rawtext: [{ text: AegisPrefix }, { rawtext: [value] }] };

  aegis.sendMessage = (value, target) => {
    const msg = formatMessage(value);
    if (!target) {
      world.sendMessage(msg);
    } else if (target instanceof Player) {
      target.sendMessage(msg);
    } else if (typeof target === 'function') {
      world.getAllPlayers().filter(target).forEach(player => player.sendMessage(msg));
    } else if (Array.isArray(target)) {
      target.forEach(p => p instanceof Player && p.sendMessage(msg));
    }
  };

  aegis.runCommand = command => aegis.defaultDimension.runCommand(command);
  aegis.runCommandAsync = command => aegis.defaultDimension.runCommandAsync(command);

  (async () => {
    aegis.ServerType = await new Promise((resolve) => {
      const checkServerType = () => {
        const players = world.getAllPlayers();
        if (players.length > 0) {
          resolve(players.some(({ id }) => localOpId.has(id)) ? 'local' : 'server');
        } else if (Date.now() - startTime < 10000) {
          system.runTimeout(checkServerType, 20);
        } else {
          resolve('server');
        }
      };
      checkServerType();
    });
  })();

  return aegis;
})();

function execute([...commands], target = Aegis.defaultDimension) {
  try {
    if (typeof target == 'string' || !(target instanceof Dimension || target instanceof Entity)) {
      target = typeof target == 'string' ? world.getDimension(target) || Aegis.defaultDimension : Aegis.defaultDimension;
    }

    return commands.map(async command => {
      if (typeof command == 'string') {
        return (await target.runCommandAsync(command)).successCount;
      } else if (typeof command == 'object' && !Array.isArray(command)) {
        const { successCount } = await target.runCommandAsync(command.run);

        if (successCount > 0) {
          if (typeof command.success === 'function') {
            command.success();
          } else {
            execute(command, target);
          }
        }
        return successCount;
      }
    });
  } catch (error) {
    console.error(error)
  }

}

const language_key = Aegis.config.get('language-key') || 'vi-VN';
const language = languages[language_key] || languages['vi-VN'];

function Translation(token) {
  if (typeof token != 'string') throw new TypeError();
  return language[token] || token;
}

console.warn(`Initialization complete...${(Date.now() - startTime).toFixed(2)}`);

(async () => {
  const loadModules = async (modules, name) => {
    try {
      await Promise.all(modules.map(module => import(module)));
      console.warn(`${name} [Ok]`);
    } catch (error) {
      error.name = name;
      throw error;
    }
  };

  try {
    await loadModules([
      './aegis_modules/javascript-extensions',
      './aegis_modules/minecraft-extensions',
      './aegis_modules/loadConfig'
    ], 'Aegis-Extension');

    await loadModules([
      './Functions/Modules/index',
      './Functions/CustomCommands/index',
      './Handlers/Watchdog',
      './Handlers/PlayerJoin',
      './Handlers/ChatSend'
    ], 'Aegis-Modules');
  } catch (error) {
    console.error(error);
  }
})();