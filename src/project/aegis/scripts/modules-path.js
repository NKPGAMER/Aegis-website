export default [
  {
    name: 'Aegis-Extension',
    whenError: {
      stop: true,
      noticab: true
    },
    modules: [
      './aegis_modules/javascript-extensions',
      './aegis_modules/minecraft-extensions',
      './aegis_modules/loadConfig'
    ]
  },
  {
    name: 'Aegis-Modules',
    whenError: {
      stop: false,
      noticab: true
    },
    modules: [
      './Functions/Modules/index',
      './Functions/CustomCommands/index',
      './Handlers/Watchdog',
      './Handlers/PlayerJoin',
      './Handlers/ChatSend'
    ]
  }
];