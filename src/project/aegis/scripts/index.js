
const paths = [
  'Events/System/index',
  'Events/ItemUse/index',
  //'test.js',
  'ai.js',
  'CustomCommands/index'
];

Promise.all([
  'Hadelers/Watchdog',
  'Handlers/ChatSend',
  'Handlers/Explosions'
].map(path => import(path)));