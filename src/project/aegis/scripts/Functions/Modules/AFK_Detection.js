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

// const AfkTime = (Config.time || 900) * 1000;
// const ResponseWaitTime = (Config.responseWaitTime || 20) * 1000;

// function AntiAfk(player) {
//   const now = Date.now();
//   let data = PlayerData.get(player) || {
//     date: now,
//     countdown: ResponseWaitTime,
//     lastLocation: player.location,
//     startCountdown: now,
//     warn: false,
//   };

//   const { x, z } = player.location;
//   if (x !== data.lastLocation.x || z !== data.lastLocation.z || player.isMoving) {
//     Object.assign(data, {
//       date: now,
//       lastLocation: { x, z },
//       countdown: ResponseWaitTime,
//       warn: false,
//     });
//   }

//   const afkTime = now - data.date;

//   if (afkTime >= AfkTime) {
//     if (now - data.startCountdown >= 1000) {
//       data.startCountdown = now;
//       data.countdown -= 1000;
//     }

//     if (!data.warn) {
//       player.sendMessage(world.lang("afk.attention"));
//       data.warn = true;
//     }

//     player.actionBar.add(world.lang("afk.countdown").replace("<time>", Math.floor(data.countdown / 1000)), false, "65 70 75 84 73 77 69");

//     if (data.countdown <= 0) {
//       player.disconnect();
//     }
//   }

//   PlayerData.set(player, data);
// }

// system.runInterval(() => {
//   GetAllPlayers.filter(player => !(player.isAdmin || player.isSupport)).forEach(AntiAfk);
// });