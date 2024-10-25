import { world } from "@minecraft/server";
import { MessageFormData } from "../aegis_modules/CustomUI";
import { kick, ban, unban } from "../Assets/Utils";
const BanData = new Aegis.Database('data-ban');

world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
  if(!initialSpawn || BanData.has(player.id)) return;

  const playerData = BanData.get(player.id);
  if(playerData.status != 'ban') return;

  const currentTime = Date.now();
  
  if(typeof playerData.status.until != 'number') {
    
  } else if(playerData.status.until >= currentTime) {
    unban(player);
    playerData.history.push({ type: 'unban', atTime: currentTime, reason: 'timeout' });
  } else {
    kick(player, playerData.status.reason);
    playerData.history.push({ type: 'kick', atTime: currentTime, reason: "still-banned" })
  }
});