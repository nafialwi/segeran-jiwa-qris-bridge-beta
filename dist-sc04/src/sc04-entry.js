import { installSc03Runtime } from './app/bootstrap.js';
import { installSc04Runtime } from './app/sc04-bootstrap.js';

const sc03=installSc03Runtime(globalThis);
const sc04=installSc04Runtime(globalThis,{sc03});
sc04.ready.catch(()=>{});
