import { world, system, Block, Dimension, Entity, Player, GameMode } from '@minecraft/server';
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui';

/*
 * ActionFormData
 */
if (!ActionFormData.prototype.waitShow) {
  ActionFormData.prototype.waitShow = async function (player, timeOut, msgTimeOut) {
    const endTime = Date.now() + timeOut;
    while (Date.now() <= endTime) {
      const response = await this.show(player);
      if (response.cancelationReason !== 'UserBusy') return response;
    }
    player.sendMessage(msgTimeOut);
  };
};

/*
 * ModalFormData
 */
if (!ModalFormData.prototype.waitShow) {
  ModalFormData.prototype.waitShow = async function (player, timeOut, msgTimeOut) {
    const endTime = Date.now() + timeOut;
    while (Date.now() <= endTime) {
      const response = await this.show(player);
      if (response.cancelationReason !== 'UserBusy') return response;
    }
    player.sendMessage(msgTimeOut);
  };
};

/*
 * MessageFormData
 */
if (!MessageFormData.prototype.waitShow) {
  MessageFormData.prototype.waitShow = async function (player, timeOut, msgTimeOut) {
    const endTime = Date.now() + timeOut;
    while (Date.now() <= endTime) {
      const response = await this.show(player);
      if (response.cancelationReason !== 'UserBusy') return response;
    }
    player.sendMessage(msgTimeOut);
  };
};

/*
 * Block
 */
if (!Block.prototype.hasComponent) {
  Block.prototype.hasComponent = function (component) {
    try {
      return this.getComponent(component) != null;
    } catch {
      return false;
    }
  };
}

/*
 * Player
 */
if (!Player.prototype.getGameMode) {
  Player.prototype.getGameMode = function () {
    return Object.values(GameMode).find(gamemode => world.getPlayers({ name: this.name, gameMode: gamemode }).length);
  };
}

if (!Player.prototype.setGameMode) {
  Player.prototype.setGameMode = changeGameMode;
}

if (!Player.prototype.hasGameMode) {
  Player.prototype.hasGameMode = function () {
    return this.getGameMode() == gamemode;
  };
}

if (!Player.prototype.isRiding) {
  Player.prototype.isRiding = function () {
    return this.hasTag("aegis:riding") || this.hasComponent("minecraft:riding");
  };
}