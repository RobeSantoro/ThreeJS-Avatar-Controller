
import { World } from './modules/World';

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new World();
  console.log(_APP);
});
