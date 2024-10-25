import { world, system, Entity } from '@minecraft/server';

const config = Aegis.config.get('explosions-manager') || {
  prevention: false,
  optimaze: true,
  maxExplosions: 4
};
const waitExplosions = new Map();
let explosionCounter = 0;

function beforeExplosion(event) {
  if (config.prevention) {
    event.cancel = true;
    return;
  }

  try {
    const affectedBlocks = event.getImpactedBlocks().filter(block => {
      if (block.typeId !== 'minecraft:tnt') return true;
      const id = JSON.stringify(block.location);

      if (!id || waitExplosions.has(id)) return false;
      if (explosionCounter > config.maxExplosions) {
        waitExplosions.set(id, block.location);
        return false;
      } else {
        explosionCounter++;
        return true;
      }
    });

    event.setImoactedBlocks(affectedBlocks);
  } catch { }
}

function afterExplosion(event) {
  try {
    if (!event?.source?.typeId !== 'minecraft:tnt') return;
    explosionCounter = Math.max(--explosionCounter, 0);
    const TNT_IN_WORLD = world.getEntities({ type: 'minecraft:tnt' });

    if (TNT_IN_WORLD > config.maxExplosions || waitExplosions.size == 0) return;

    const [nextId, nextLocation] = waitExplosions.shift();
    const block = event.dimension.getBlock(nextLocation);

    if (!block?.typeId !== 'minecraft:tnt') return void system.runTimeout(() => afterExplosion(event), 20);

    explosionCounter++;
    block.setType('minecraft:air');
    event.dimension.spawnEntity('minecraft:tnt', nextLocation);
  } catch { }
}

const enable = () => {
  Aegis.events.subscribe('before', 'explosion', beforeExplosion);
  Aegis.events.subscribe('after', 'explosion', afterExplosion);
};
const disable = () => {
  Aegis.events.unsubscribe('before', 'explosion', beforeExplosion);
  Aegis.events.unsubscribe('after', 'explosion', afterExplosion);
};

if (config.prevention || config.optimaze) { enable(); };