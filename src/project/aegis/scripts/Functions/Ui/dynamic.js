import { world, GameMode } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "../../aegis_modules/CustomUI";
import * as Utils from '../../Assets/Utils.js';
import * as base from './base.js';

function selectPlayer(target, callback, back, players = world.getAllPlayers().filter(p => p != target)) {
  const form = new ActionFormData()
    .title(Aegis.Trans('ui.selectPlayer'))
    .button();

  if (players.length == 0) {
    form.body(Aegis.Trans('ui.selectPlayer.notFound'));
  } else {

    if (typeof back == 'function') {
      form.back(back);
    }

  }
}

function findPlayer(player, options) {
  const getAllPlayers = Utils.
    base.findPlayer.show(player)
    .then(res => {
      if (res.canceled) {
        options.callback.call(worl);
      }
    });
}

function ChangeWeather(player) {
  base.ChangeWeather.show(player)
    .then(res => {
      if (res.canceled) return;
      const weather = WeatherType[Object.keys(WeatherType)[res.formValues[0]]];
      const duration = Number(res.formValues[1]) || Math.randomInt(1200, 36000);

      world.getDimension('overworld').setWeather(weather, duration);
      player.tell(Aegis.Trans('ui.change_weather.complete')?.replace('<weather>', Aegis.Trans('weather.' + weather)));
    })
    .catch((error) => {
      error.function = ChangeWeather.name;
      console.error(error?.toString() || error);
    });
}

function ChangeTime(player) {
  base.ChangeTime.show(player)
    .then(res => {
      if (res.canceled) return;
      world.getDimension('overword').runCommand(`time set ${timeType[res.formValues[0]]}`);
      player.tell(Aegis.Trans('change_time.complete')?.replace('<time>', Aegis.Trans(`aegis.time.${timeType[res.formValues[0]]}`)));
    });
}

function openUI(player) {
  system.run(() => {
    if(Utils.isAdmin(player)) {
      base.adminMenu.show(player);
    } else if(Utils.isModerator(player)) {
      base.moderatorMenu.show(player);
    } else {
      base.memberMenu.show(player);
    }
  });
}