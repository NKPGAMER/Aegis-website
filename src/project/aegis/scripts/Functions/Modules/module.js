import { world, system } from "@minecraft/server";
import { isAdmin, isModerator } from "../../Assets/Utils";

const Modules = new Map();
const ActiveHandlers = new Map();

const registerModule = (id, options = {}, ...events) => {
  try {
    if (typeof id !== 'string' || !id) throw new Error("Invalid id");
    if (Modules.has(id)) throw new Error("Id already exists");

    Modules.set(id, {
      id,
      skipAdmin: options.skipAdmin ?? false,
      skipModerator: options.skipModerator ?? false,
      showError: options.showError ?? true,
      breakOnError: options.breakOnError ?? false,
      events: events.map(e => ({
        ...e,
        eventType: e.event === 'interval' ? 'runInterval' : (e.isSystemEvent ? 'system' : 'world')
      }))
    });
  } catch (error) {
    console.error('registerModule:', error);
  }
};

const setup = () => {
  for (const [id] of Modules) {
    try {
      updateModule(id);
    } catch (error) {
      console.error(`Failed to setup module ${id}:`, error);
    }
  }
};

const updateModule = (id) => {
  const module = Modules.get(id);
  if (!module) throw new Error(`Module ${id} not found`);

  const config = Aegis.config.get(id);
  if (!config) throw new Error(`Configuration for module ${id} not found`);

  ActiveHandlers.get(id)?.forEach(handler => handler());
  ActiveHandlers.set(id, []);

  const newHandlers = module.events.map(event => {
    const setupFunctions = {
      'runInterval': setupInterval,
      'world': setupWorldEvent,
      'system': setupSystemEvent
    };
    const setup = setupFunctions[event.eventType];
    if (!setup) throw new Error(`Unknown event type: ${event.eventType}`);
    return setup(module, event, config);
  });

  ActiveHandlers.set(id, newHandlers);
};

const setupInterval = (module, event) => {
  const intervalId = system.runInterval(() => {
    try {
      event.callback();
    } catch (error) {
      handleError(module, error);
    }
  }, event.interval);

  return () => system.clearRun(intervalId);
};

const setupEvent = (module, event, config, eventSource) => {
  const eventType = `${event.type === 'before' ? 'before' : 'after'}Events`;
  const targetEvent = eventSource[eventType]?.[event.event];

  if (!targetEvent) throw new Error(`Event ${event.event} does not exist`);

  const handler = eventData => {
    if (shouldSkipEvent(module, eventData)) return;
    try {
      event.callback(eventData);
    } catch (error) {
      handleError(module, error);
    }
  };

  if (config.enable) {
    targetEvent.subscribe(handler);
    return () => targetEvent.unsubscribe(handler);
  }
  return () => {};
};

const setupWorldEvent = (module, event, config) => setupEvent(module, event, config, world);
const setupSystemEvent = (module, event, config) => setupEvent(module, event, config, system);

const handleError = (module, error) => {
  if (module.showError) console.error(`Error in module ${module.id}:`, error);
  if (module.breakOnError) throw error;
};

const shouldSkipEvent = (module, eventData) => {
  const player = eventData.player ?? eventData.source;
  return (module.skipAdmin && isAdmin(player)) || (module.skipModerator && isModerator(player));
};

export { Modules, registerModule, setup, updateModule };