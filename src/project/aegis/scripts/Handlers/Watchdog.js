import { system } from '@minecraft/server';
import { registerModule } from '../Functions/Modules/module';

const config = Aegis.config.get('watchdog');

function watchdogTerminate(event) {
  event.cancel = config.cancel;

  if (config.warn) {
    config.warn(Aegis.Trans('event.Handlers.Watchdog')?.replace('<reason>', event.terminateReason));
  }
}

//system.beforeEvents.watchdogTerminate.subscribe(watchdogTerminate);

registerModule('watchdog', {},
  { event: 'watchdogTerminate', type: 'before', isSystemEvent: true, callback: watchdogTerminate }
);