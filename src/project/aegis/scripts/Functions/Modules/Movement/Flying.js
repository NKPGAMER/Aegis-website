import { world, GameMode, Player } from "@minecraft/server";
import { registerModule } from "../module";
import { flag, isAdmin, isModerator } from "../../../Assets/Utils";

const getPlayerOption = {
  excludeGameModes: [ GameMode.creative, GameMode.survival ]
};
const c = Aegis.config.get('anti-flying');
const PlayersData = new WeakMap();

function AntiFlying(player) {
  if(!(player instanceof Player)) return;
  const currentTime = Date.now();
  const location = player.location;
  const velocity = player.getVelocity();
  const playerData = /*PlayersData.get(player) ||*/ {
    time: currentTime,
    lastLocation: location,
    lastVelocity: velocity,
    velocities_y: [],
    largestVelocity: { x: 0, y: 0, z: 0 }
  };

  playerData.velocities_y.push(velocity.y);
  if(player.isOnGround || player.isInWater) {
    playerData.lastLocation = location;
  };


  if(currentTime - playerData.time >= 1000) {
    playerData.time = currentTime;
    playerData.largestVelocity = { x: 0, y: 0, z: 0 };
    playerData.velocities_y = []
  }

  if(velocity.y > playerData.largestVelocity.y) {
    playerData.largestVelocity.y = velocity.y;
  }

  //
  if(player.isFlying) {
    flag
  } 
}

registerModule('anti-flying', {},
  {
    event: 'interval',
    callback: () => world.getPlayers(getPlayerOption).filter(p => isAdmin(p) || isModerator(p)).forEach(AntiFlying),
    interval: 5
  }
)