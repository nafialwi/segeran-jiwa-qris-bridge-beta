import { installSc03Runtime } from './app/bootstrap.js';
import { installSc04Runtime } from './app/sc04-bootstrap.js';
import { installRef01Runtime } from './app/ref01-bootstrap.js';
const sc03=installSc03Runtime(globalThis);
const sc04=installSc04Runtime(globalThis,{sc03});
const ref01=installRef01Runtime(globalThis,{sc03,sc04,observe:true});
sc04.ready.finally(()=>{try{ref01.enhance()}catch(_){}});
