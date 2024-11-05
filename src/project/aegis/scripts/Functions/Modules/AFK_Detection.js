import { world, system, Player } from "@minecraft/server";
import { registerModule } from "./module";
import { kick, setActionBar, formatProgressBar } from "../../Assets/Utils";

const config = Aegis?.config?.get('afk-detection') || {
  "max-afk-time": 900,
  "warn-time": 30
};
const PlayerData = new WeakMap();

const MaxAfkTime = config['max-afk-time'] * 1000;
const WarnTIme = config['warn-time'] * 1000;

function AkfDetection(player) {
  if (!(player instanceof Player)) return;
  const currentTime = Date.now();
  const playerData = PlayerData.get(player) || {
    date: currentTime,
    location: player.location,
    warn: false,
    countdown: 0
  };

  const { x: posX, z: posZ } = player.location;

  if (player.isMoving || posX != playerData.lastLocation.x || posZ != playerData.lastLocation.z) {
    playerData.date = currentTime;
    playerData.lastLocation = player.location;
    playerData.warn = false;
    playerData.countdown = 0;
  }

  const afkTime = currentTime - playerData.date;

  if (afkTime > MaxAfkTime) {
    setActionBar(player, `Aegis: ${formatProgressBar(WarnTIme, afkTime - MaxAfkTime, '§7', '§c', true)}`,);

    if (afkTime - MaxAfkTime > WarnTIme) {
      kick(player);
    }
  }

  PlayerData.set(player, playerData);
}

system.runInterval(() => world.getAllPlayers().forEach(AkfDetection));

registerModule('afk-detection', {
  skipAdmin: true,
  skipModerator: true
},
  {
    event: 'interval',
    callback: () => world.getAllPlayers().forEach(AkfDetection)
  }
);