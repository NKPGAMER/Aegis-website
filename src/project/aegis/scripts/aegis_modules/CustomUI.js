import { system, Player } from '@minecraft/server';
import * as MinecraftUI from '@minecraft/server-ui';

class ActionFormData extends MinecraftUI.ActionFormData {
  #locked = false;
  #functions = [];
  #cancel;

  constructor(options) {
    super();
    this.#cancel = options.onCancel?.bind(this);
  }

  lock() {
    this.#locked = true;
    return this;
  }

  unlock() {
    this.#locked = false;
    return this;
  }

  #checkLock(methodName) {
    if (this.#locked) {
      const error = new Error(`Cannot call ${methodName} after form is locked`);
      error.class = this.constructor.name;
      error.function = methodName;
      throw error;
    }
  }

  title(titleText) {
    this.#checkLock('title');
    super.title(titleText);
    return this;
  }

  button(text, iconPath, callback) {
    this.#checkLock('button');
    if (typeof callback !== 'function') {
      throw new Error("callback must be a function");
    }
    this.#functions.push(callback);
    super.button(text, iconPath);
    return this;
  }

  async show(target) {
    return super.show(target).then(responses => {
      if (responses.canceled) {
        this.#cancel?.(target);
        return { cancelationReason: responses.cancelationReason };
      }
      this.#functions[responses.selection](target);
    });
  }
}

class ModalFormData extends MinecraftUI.ModalFormData {
  #bodyText;
  constructor(jsonData) {
    super();
    this.#bodyText;

    if (jsonData) {
      this.parseJSON(jsonData);
    }
  }

  body(value) {
    this.#bodyText = typeof value == 'string' ? value : void 0;
    return this;
  }

  parseJSON(json) {
    try {
      const data = JSON.parse(json);
      if ((typeof data.title == 'string' || (typeof data.title == 'object' && !Array.isArray(data.title)))) {
        this.title(data.title);
      }
      if ((typeof data.body == 'string' || (typeof data.body == 'object' && !Array.isArray(data.body)))) {
        this.#bodyText = data.body;
      }
    } catch (error) {
      error.class = this.constructor.name;
      error.function = this.parseJSON.name;
      console.error(error.toString());
    }
  }

  async waitShow(player, waitTime = Infinity, messageTimeout) {
    if (!(player instanceof Player)) throw new Error("");
    const endTime = system.currentTick + waitTime;

    while (system.currentTick <= endTime) {
      try {
        const response = await this.show(player);
        if (response.cancelationReason != 'UserBusy') {
          return response;
        };
      } catch (error) {
        error.class = this.constructor.name;
        error.function = this.waitShow.name;
        console.error(error?.toString() ?? error);
      }
      await system.waitTicks(20);
    }

    const timeout = new Error(messageTimeout ?? "Wait time exceeded");
    timeout.class = this.constructor.name;
    timeout.function = this.waitShow.name;
    throw timeout;
  }
}

class MessageFormData extends MinecraftUI.MessageFormData {
  constructor(jsonData) {
    super();

    if (jsonData) {
      this.parseJSON(jsonData);
    }
  }

  async waitShow(player, waitTime = Infinity, messageTimeout) {
    if (!(player instanceof Player)) throw new Error("");
    const endTime = system.currentTick + waitTime;

    while (system.currentTick <= endTime) {
      try {
        const response = await this.show(player);
        if (response.cancelationReason != 'UserBusy') {
          return response;
        };
      } catch (error) {
        error.class = this.constructor.name;
        error.function = this.waitShow.name;
        console.error(error?.toString() ?? error);
      }
      await system.waitTicks(20);
    }

    const timeout = new Error(messageTimeout ?? "Wait time exceeded");
    timeout.class = this.constructor.name;
    timeout.function = this.waitShow.name;
    throw timeout;
  }

  parseJSON(json) {
    try {
      const data = JSON.parse(json);
      if (typeof data.title == 'string' || (typeof data.title && !Array.isArray(data.title))) {
        this.title(data.title);
      }
    } catch (error) {
      error.class = this.constructor.name;
      error.function = this.parseJSON.name;
      console.error(error?.toString());
    }
  }
}

export { ActionFormData, ModalFormData, MessageFormData };