// Staging Server Entry Point
process.env.NODE_ENV = 'staging';

// On local machines, default to port 5001. On Render (or cloud hosts), use process.env.PORT (e.g. 10000)
if (!process.env.PORT && !process.env.RENDER) {
  process.env.PORT = '5001';
}

console.log('----------------------------------------------------');
console.log(`🚀 Starting thiraipedia in STAGING MODE (Port ${process.env.PORT || '10000'})...`);
console.log('----------------------------------------------------');

import './server.js';
