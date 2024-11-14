import { world, system, Player, GameMode, WeatherType } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "../../aegis_modules/CustomUI";
import { isAdmin, isModerator, setActionBar, getAllItemStack, ItemStackToJSON, JsonToItemStack } from '../../Assets/Utils';
import * as base from './base'

const profile = new ActionFormData()
  .back(openUI)
  .button(Aegis.Trans('ui.infraction_history'));

const main = {
  member: new ActionFormData()
    .title(Aegis.Trans('ui.main.member'))
    .button(Aegis.Trans('ui.profile'), 'textures/ui/sidebar_icons/profile_screen_icon', profile.show),

  moderator: new ActionFormData()
  .title("")
  .button(Aegis.Trans('ui.profile'), 'textures/ui/sidebar_icons/profile_screen_icon', profile.show),

  admin: (player) => {
    const form = new ActionFormData()
    .title("")
    .button(Aegis.Trans('ui.profile'), 'textures/ui/sidebar_icons/profile_screen_icon', profile.show);

  }
};

function openUI(player) {
  system.run(() => {
    if (isAdmin(player)) {
      main.admin.show(player);
    } else if (isModerator(player)) {
      main.moderator.show(player);
    } else {
      main.member.show(player);
    }
  });
}


function changeGameMode(player) {
  base.ChangeGameMode.show(player).then((res) => {
    if(res.canceled) return;

    const gamemode = Object.keys(GameMode)[res.formValues[0]];
    setGameMode(player, gamemode)
    Aegis.sendMessage(Aegis.Trans('ui.change_gamemode.complete'), player)
  })
}









const worldTool = new ActionFormData()
  .title(Aegis.Trans('ui.world_tool'))
  .back(openUI)
  .button(Aegis.Trans('ui.change_gamemode'), null, ChangeGameMode.show)
  .button(Aegis.Trans('ui.change_weather'), null, ChangeWeather)
  .button(Aegis.Trans('ui.change_time'), null, ChangeTime);

const Tools = new ActionFormData()
  .title(Aegis.Trans('ui.tools'))
  .button(Aegis.Trans('ui.floating_text'));

// const FloatingText = {
  // options: {
    // type: 'minecraft:egg',
    // families: ['aegis', 'floating_text']
  // },

  // main: new ActionFormData()
    // .title(Aegis.Trans('ui.floating_text'))
    // .back(Tools)
    // .button(Aegis.Trans('ui.floating_text.add'), null, this.add.show)
    // .button(Aegis.Trans('ui.floating_text.list'), null, this.list),

  // list: function (player) {
    // const form = new ActionFormData()
      // .title(Aegis.Trans('ui.floating_text.list'))
      // .back(FloatingText.main);

    // player.dimension.getEntities(FloatingText.options).forEach((entity) => {
      // form.button(`${entity.nameTag || 'Anonymous'}\n${Math.floor(entity.location.x)} ${Math.floor(entity.location.y)} ${Math.floor(entity.location.z)}`, null, () => FloatingText.edit(player, entity));
    // });
  // },

  // add: new ModalFormData(),

  // edit: function(player, target) {
    // const { nameTag = 'Anonymous', location = {} } = target;
    // new ModalFormData()
    // .title(Aegis.Trans('ui.floating_text.edit'))
    // .textField(Aegis.Trans('ui.floating_text.edit.name'), `${nameTag}`, `${nameTag}`)
    // .textField(Aegis.Trans('ui.floating_text.edit.location'), `${location.x} ${location.y} ${location.z}`)
    // .submitButton(Aegis.Trans('ui.floating_text.submit'))
    // .show(player).then(res => {
      // if(res.canceled) return;

      // const name = res.formValues[0];
      // const location = res.formValues[1].split(' ', 3).map(pos => Number(pos));

      // if(!location.some(l => !l)) return player.sendMessage()
    // })
  // }
// };


export { openUI };