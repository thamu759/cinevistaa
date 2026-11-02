// Staging Server Entry Point
process.env.NODE_ENV = 'staging';

console.log('----------------------------------------------------');
console.log('🚀 Starting thiraipedia in STAGING MODE (Port 5001)...');
console.log('----------------------------------------------------');

import './server.js';

