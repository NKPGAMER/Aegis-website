import { world, GameMode } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "../../aegis_modules/CustomUI";
import * as Utils from '../../Assets/Utils.js'
import * as base from './base.js'

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

function findPlayer(player, callback) {
  const form = new ModalFormData();

  //callback.call({ players: [] }, player, )
}



function findPlayer(player, options) {
  const getAllPlayers = Utils.
  base.findPlayer.show(player)
  .then(res => {
    if(res.canceled) {
      options.callback.call(worl)
    }
  })
}