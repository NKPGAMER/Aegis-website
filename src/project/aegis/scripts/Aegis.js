import { world, system, Player, Dimension, Entity } from '@minecraft/server';
import { Database } from './Assets/Database';
import { MemoryCache } from './Assets/MemoryCache';
import languages from './Data/Languages/languages';

const CONFIG = {
  PREFIX: '§7[§eAegis§7]§r ',
  LOCAL_OP_IDS: new Set(['-4294967295', '-206158430207']),
  DEFAULT_LANG: 'vi-VN',
  TIMEOUT: 10000,
  CHECK_INTERVAL: 20
};

class Aegis {
  constructor() {
    this.startTime = Date.now();
    this.defaultDimension = world.getDimension('overworld');
    this.config = new Database('config');
    this.Trans = this.Translation.bind(this);
    this.ServerType = 'server';
    this.language = this.initializeLanguage();
    this.Database = Database;
    this.MemoryCache = MemoryCache;
    
    this.initializeServerType();
  }

  formatMessage(value) {
    return typeof value === 'string'
      ? CONFIG.PREFIX + value
      : { rawtext: [{ text: CONFIG.PREFIX }, { rawtext: [value] }] };
  }

  sendMessage(value, target) {
    const msg = this.formatMessage(value);
    
    if (!target) {
      world.sendMessage(msg);
      return;
    }

    if (target instanceof Player) {
      target.sendMessage(msg);
      return;
    }

    const players = world.getAllPlayers();
    
    if (typeof target === 'function') {
      players.filter(target).forEach(player => player.sendMessage(msg));
      return;
    }

    if (Array.isArray(target)) {
      target.forEach(p => p instanceof Player && p.sendMessage(msg));
    }
  }

  runCommand(command) {
    return this.defaultDimension.runCommand(command);
  }

  runCommandAsync(command) {
    return this.defaultDimension.runCommandAsync(command);
  }

  async initializeServerType() {
    const checkServerType = () => {
      const players = world.getAllPlayers();
      
      if (players.length > 0) {
        return players.some(({ id }) => CONFIG.LOCAL_OP_IDS.has(id)) ? 'local' : 'server';
      }
      
      if (Date.now() - this.startTime < CONFIG.TIMEOUT) {
        return new Promise(resolve => 
          system.runTimeout(() => resolve(checkServerType()), CONFIG.CHECK_INTERVAL)
        );
      }
      
      return 'server';
    };

    this.ServerType = await checkServerType();
  }

  initializeLanguage() {
    const languageKey = this.config.get('language-key') || CONFIG.DEFAULT_LANG;
    return languages[languageKey] || languages[CONFIG.DEFAULT_LANG];
  }

  Translation(token) {
    if (typeof token !== 'string') throw new TypeError('Translation token must be a string');
    return this.language[token] || token;
  }

  async execute(commands, target = this.defaultDimension) {
    try {
      if (!(target instanceof Dimension || target instanceof Entity)) {
        target = typeof target === 'string' 
          ? world.getDimension(target) || this.defaultDimension 
          : this.defaultDimension;
      }

      return Promise.all(commands.map(async command => {
        if (typeof command === 'string') {
          return (await target.runCommandAsync(command)).successCount;
        }
        
        if (typeof command === 'object' && !Array.isArray(command)) {
          const { successCount } = await target.runCommandAsync(command.run);
          
          if (successCount > 0) {
            if (typeof command.success === 'function') {
              command.success();
            } else {
              this.execute(command, target);
            }
          }
          return successCount;
        }
      }));
    } catch (error) {
      console.error('Execute error:', error);
      return [];
    }
  }
}

// Initialize Aegis
globalThis.Aegis = new Aegis();

const handleError = (error, name, shouldNotify) => {
  if (shouldNotify) {
    console.error(`[Import Modules]-[${name}]`, error);
  }
  return 'error';
};

const importModule = async (modulePath) => {
  try {
    return await import(modulePath);
  } catch (error) {
    throw error;
  }
};

async function loadModules({ modules = [], name = '', whenError = {} }) {
  if (!modules.length) return 'success';

  try {
    if (whenError.stop) {
      await Promise.all(modules.map(importModule));
    } else {
      const results = await Promise.allSettled(modules.map(importModule));
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(m => m.reason);
      
      if (errors.length) {
        console.error('[Modules Error]:', ...errors);
      }
    }
    return 'success';
  } catch (error) {
    return handleError(error, name, whenError.niticab);
  }
}

(async () => {
  try {
    const { default: modules } = await import('./modules-path.js');
    
    for (const data of modules) {
      const result = await loadModules(data);
      if (data.whenError.stop && result === 'error') break;
    }
  } catch (error) {
    console.error('[Module Loader Error]:', error);
  }
})();

console.warn(`Initialization complete...${(Date.now() - globalThis.Aegis.startTime).toFixed(2)}ms`);