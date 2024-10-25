import { world, Player, GameMode } from "@minecraft/server";
import { registerModule } from "./module";
import { flag } from "../../Assets/Utils";

const config = Aegis.config.get('anti-reach');

function reach(event) {
  if (event.player.getGameMode() != GameMode.survival) return;
  const distance = Math.distanceVector3(event.player.location, event.block.location);

  if (distance > config.maxDistance) {
    flag(event.player, 'anti-reach', 'A',);
    event.cancel = true;
  }
}

registerModule('anti-reach', {
  skipAdmin: true,
  skipModerator: true
},
  {
    event: 'playerBreakBlock',
    type: 'before',
    callback: reach
  },
  {
    event: 'playerPlaceBlock',
    type: 'before',
    callback: reach
  }
);