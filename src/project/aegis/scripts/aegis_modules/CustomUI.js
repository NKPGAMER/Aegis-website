import { system, Player } from '@minecraft/server';
import * as MinecraftUI from '@minecraft/server-ui';

class ActionFormData {
  #buttons;
  #form;
  #functions;
  constructor(jsonData) {
    this.#buttons = [];
    this.#functions = [];
    this.#form = new MinecraftUI.ActionFormData();

    if (jsonData) {
      this.parseJSON(jsonData);
    }
  }

  parseJSON(json) {
    try {
      const data = JSON.parse(json);
      if (typeof data.title == 'string') {
        this.#form.title = data.title;
      }
      if (typeof data.body == 'string') {
        this.#form.body = data.body;
      }
      if (Array.isArray(data.buttons)) {
        this.#buttons = [...this.#buttons, ...data.button];
      }
    } catch (error) {
      console.error(error?.toString() ?? error);
    }
  }

  back(callback) {
    this.#buttons.unshift({
      label: Aegis.Trans('ui.back_label'),
      icon: 'textures/ui/icon_import',
      callback: typeof callback == 'function' ? callback : Function.Empty,
      show: true
    })
    return this;
  }

  button(label, icon, callback, show = true) {
    if(!show) return;
    this.#form.button(label, icon);
    this.#functions.push(callback);
    // this.#buttons.push({
      // label: typeof label == 'string' ? label : "",
      // icon: typeof icon == 'string' ? icon : void 0,
      // callback: typeof callback == 'function' ? callback : Function.Empty,
      // show: typeof show == 'boolean' ? show : true
    // });
    return this;
  }

  title(value) {
    this.#form.title((typeof value == 'string' || (typeof value == 'object' && !Array.isArray(value))) ? value : void 0);
    return this;
  }

  body(...values) {
    if(values.some(value => typeof value === 'object')) {
      values = values.map(value => ({ rawtext: [ typeof value === 'object' ? value : typeof value === 'string' ? { text: value } : "", { text: "\n" } ]}))
      this.#form.body({ rawtext: values });
    } else {
      this.#form.body(values.join('\n'))
    }
    return this;
  }

  show(player) {
    try {
      this.#form.show(player).then(res => {
        if (res.canceled) return;
        this.#functions?.[res.selection](player);
      });
    } catch (error) {
      error.class = this.constructor.name;
      error.function = this.show.name;
      console.error(error?.toString() ?? error);
    }
  }

  async waitShow(player, waitTime = Infinity, messageTimeout) {
    const endTime = system.currentTick + waitTime;
    while (system.currentTick <= endTime) {
      try {
        const response = await this.#form.show(player);
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

export { ActionFormData, ModalFormData, MessageFormData }