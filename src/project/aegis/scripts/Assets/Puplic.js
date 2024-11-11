import { world, system } from "@minecraft/server";
import AegisTag from "../Data/Tags";

var allPlayers = world.getAllPlayers();

world.beforeEvents.playerLeave.subscribe((event) => {
  const index = allPlayers.findIndex(player => player.id === event.player.id);
  if (index !== -1) {
    allPlayers.splice(index, 1);
  }
});

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  allPlayers.push(event.player);
});

console.warn(allPlayers.length);
system.runInterval(() => {
  allPlayers.forEach(P => P.sendMessage("Hello ")
  );
});