import { world, GameMode } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "../../aegis_modules/CustomUI";
import { ChangeGameMode as setGameMode } from '../../Assets/Utils';

const dimensions = [ 'overworld', 'nether', 'the_end' ]
// Function
const ChangeGameMode = new ModalFormData()
  .title(Aegis.Trans('ui.change_gamemode'))
  .dropdown(Aegis.Trans('ui.change_gamemode.select'), Object.keys(GameMode).map(m => Aegis.Trans(`aegis.gamemode.${m}`)))
  .submitButton(Aegis.Trans('ui.change_gamemode.submit'))

const runCommand = new ModalFormData()
  .title(Aegis.Trans('ui.runCommand'))
  .dropdown(Aegis.Trans('ui.runCommand.selectDimension'), [ ...dimensions, 'all' ])
  .textField(Aegis.Trans('ui.runCommmand.command'), '')
  
  
const worldTools = new ActionFormData()
  .title(Aegis.Trans('ui.worldTools'))
  .button(Aegis.Trans('ui.changeWeather'))
  .button(Aegis.Trans('ui.changeTime'))
  .button(Aegis.Trans('ui.runCommand'))

// Menu
const memberMenu = new ActionFormData()
  .title(Aegis.Trans('ui.member'))

const moderatorMenu = new ActionFormData()
  .title(Aegis.Trans('ui.moderator'))

const adminMenu = new ActionFormData()
  .title(Aegis.Trans('ui.admin'))

  const findPlayer = new ModalFormData()
  .title(Aegis.Trans('ui.findPlayer.title'))
  .dropdown(Aegis.Trans('ui.findPlayer.dimension'), [
    Aegis.Trans('$All'),
    'overworld',
    'nether',
    'the_end'
  ])
  .dropdown(Aegis.Trans('ui.findPlayer.findMode'), [
    Aegis.Trans('ui.findPlayer.mode.Words'),
    Aegis.Trans('ui.findPlayer.mode.Regex')
  ], 1)
  .textField(Aegis.Trans('ui.findPlayer.input'), '')
  .toggle(Aegis.Trans('ui.findPlayer.MatchCase'), true);

export { ChangeGameMode, findPlayer }