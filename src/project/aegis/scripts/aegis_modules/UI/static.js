import { world, system, GameMode, WeatherType } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "../CustomUI";
import * as Utils from '../../Assets/Utils';

const Trans = (key) => {}//Aegis.Trans;

const ChangeGameMode = ((form) => {
  form.title(Trans('ui.change_game_mode'));
  Object.keys(GameMode).forEach(gm => form.button(`gamemode.${gm}`, null, (player) => Utils.ChangeGameMode(player, gm)));
  return form;
})(new ActionFormData());

const ChangeWeather = new ModalFormData()
.title(Trans('ui.change_weather'))
.dropdown(Trans('ui.select'), Object.keys(WeatherType).map(w => Trans(`weather.${w}`)))
.textField(Trans('ui.change_weather.duration'), Trans('ui.optional'), "")


export { ChangeGameMode, ChangeWeather };