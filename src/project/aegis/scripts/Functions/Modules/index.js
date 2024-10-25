import { setup } from './module'

(async function(modules) {
  await Promise.all(modules.map(m => import('./' + m)));
  setup();
})([
  'Reach.js'
]);