import { world, system, GameMode, WeatherType, Player, EntityHealthComponent } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "../CustomUI";
import { UIManager } from '@minecraft/server-ui'
import * as Utils from '../../Assets/Utils';
import * as Static from './static';

const Trans = Aegis.Trans;

function ChangeWeather(player) {
  if (!(player instanceof Player)) return;
  Static.ChangeWeather.show(player).then(res => {
    if (res.canceled) return;
    player.dimension.setWeather(Object.keys(WeatherType)[res.formValues[0]], Number(res.formValues[1]) || void 0);
  });
}

function PlayerManagementHub(player, list = world.getAllPlayers()) {
  const form = new ActionFormData().title(Trans('ui.player_management'))

  list.forEach(p => {
    form.button(p.name != p.nameTag ? `${p.nameTag}[${p.name}]` : p.name, null, () => PlayerManager(player, p));
  })
}

function PlayerManager(player, target) {
  if(!(player instanceof Player) || !(target instanceof Player)) return;

  const healthComponent = target.getComponent(EntityHealthComponent.componentId);
  const form = new ActionFormData().title(Trans('ui.player_management'))
  .body(
    Trans('player.name').replace('<name>', target.name),
    Trans('player.nameTag').replace('<name>', target.nameTag),
    Trans('player.location').replace('<x>', target.location.x).replace('<y>', target.location.y).replace('<z>', target.location.z),
    Trans('player.health').replace('<currentHealth>', healthComponent.currentValue).replace('<maxHealth>', healthComponent.effectiveMax),
    Trans('player.velocity').replace('')
  )
}