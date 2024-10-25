(config => {
  /* Store confidential information */
  config['confidential'] = {
    'owner': "", /* Account Name */
    'passworld': "" /* Password to access Admin rights - (If left blank, Admin rights will be automatically granted to the owner) */
  };

  /* Contains information about language and region  */
  config['region'] = {
    'area': "vi-VN", /* Your region's time format */
    'language': "vi-VN" /* Your language id - (If not supported, default will be Vietnamese) */
  };

  config['customCommand'] = {
    'enable': true, /* Allow the world to use custom commands */
    'prefix': ".", /* Prefix to launch command */
  };

  return config;
})({});