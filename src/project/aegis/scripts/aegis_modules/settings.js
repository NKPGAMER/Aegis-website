import { world } from '@minecraft/server';

const settings = {};

const defaultUi = new M

export default {
  add: function(uiData, id, enable = Function.Empty, disable = Function.Empty, activate) {
    try {
      if(id == null) {
        console.error("To add new setting. Id is required!");
        return;
      }
      const { langId, label, callback } = uiData;
      
      if(typeof enable != 'function' || typeof disable != 'function') {
        console.error("'enable' or 'disable' must be function")
        return;
      }
    } catch(error) {
      console.error(error?.toString() || error);
    }
  }
}