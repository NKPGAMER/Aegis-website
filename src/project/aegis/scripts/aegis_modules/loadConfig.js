var path_custom_config = '../Data/config', custom_data = {};
var path_default_config = '../Data/default/config', default_data = {};

async function loadConfig(replace, clearData) {
  try {
    var default_data = (await import(path_default_config)).default;
    var custom_data = (await import(path_custom_config)).default;
    const data = { ...default_data, ...custom_data };
    const c = new Aegis.Database('config');

    if (clearData) {
      c.clear();
    }
    for (const [key, value] of Object.entries(data)) {
      if (replace || !c.has(key)) {
        c.set(key, value);
      }
    }
  } catch (error) {
    console.error(error?.toString() ?? error);
  }
}

loadConfig();

export default loadConfig;