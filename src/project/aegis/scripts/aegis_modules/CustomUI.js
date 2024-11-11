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

class ActionFormData {
  #buttons;
  #form;
  #functions;
  #locked;
  #cancel;

  constructor(data = {}) {
    this.#buttons = [];
    this.#functions = [];
    this.#form = new MinecraftUI.ActionFormData();
    this.#locked = false;
    this.#cancel = typeof data.onCancel === 'function' ? data.onCancel : void 0;
  }

  #checkLock(methodName) {
    if (this.#locked) {
      const error = new Error(`Cannot call ${methodName} after form is locked`);
      error.class = this.constructor.name;
      error.function = methodName;
      throw error;
    }
  }

  #handleError(error, methodName) {
    error.class = this.constructor.name;
    error.function = methodName;
    console.error(error?.toString() ?? error);
  }

  parseJSON(json) {
    this.#checkLock('parseJSON');
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      const { title, body, buttons } = data;

      title?.toString() && (this.#form.title = title);
      body?.toString() && (this.#form.body = body);
      Array.isArray(buttons) && (this.#buttons.push(...buttons));
    } catch (error) {
      this.#handleError(error, 'parseJSON');
    }
  }

  back(callback) {
    this.#checkLock('back');
    this.#buttons.unshift({
      label: Aegis.Trans('ui.back_label'),
      icon: 'textures/ui/icon_import',
      callback: typeof callback === 'function' ? callback : Function.Empty,
      show: true
    });
    return this;
  }

  button(label, icon, callback, show = true) {
    this.#checkLock('button');
    if (!show) return this;

    this.#form.button(label, icon);
    this.#functions.push(callback);
    return this;
  }

  title(value) {
    this.#checkLock('title');
    if (value && (typeof value === 'string' || (typeof value === 'object' && !Array.isArray(value)))) {
      this.#form.title(value);
    }
    return this;
  }

  body(...values) {
    this.#checkLock('body');
    if (values.some(value => typeof value === 'object')) {
      const formattedValues = values.map(value => ({
        rawtext: [
          typeof value === 'object' ? value :
            typeof value === 'string' ? { text: value } :
              { text: "" },
          { text: "\n" }
        ]
      }));
      this.#form.body({ rawtext: formattedValues });
    } else {
      this.#form.body(values.join('\n'));
    }
    return this;
  }

  lock() {
    this.#locked = true;
    return this;
  }

  get lockStatus() {
    return this.#locked ? 'Locked' : 'Unlocked';
  }

  show(player) {
    try {
      return this.#form.show(player).then(res => {
        if (!res.canceled) {
          this.#functions?.[res.selection]?.(player);
        }
        return res;
      });
    } catch (error) {
      this.#handleError(error, 'show');
    }
  }

  async waitShow(player, waitTime = Infinity, messageTimeout) {
    const endTime = system.currentTick + waitTime;

    while (system.currentTick <= endTime) {
      try {
        const response = await this.#form.show(player);
        if (response.cancelationReason !== 'UserBusy') {
          return response;
        }
        await system.waitTicks(20);
      } catch (error) {
        this.#handleError(error, 'waitShow');
      }
    }

    const timeout = new Error(messageTimeout ?? "Wait time exceeded");
    this.#handleError(timeout, 'waitShow');
    throw timeout;
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