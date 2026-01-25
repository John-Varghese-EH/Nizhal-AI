const { exec } = require('child_process');

console.clear();
console.log('\x1b[32m%s\x1b[0m', `
  _  __    ___      __    ___     ___   _  _ 
 | |/ /   /   \\     \\ \\  / /     /   \\ | || |
 | ' <    | - |      \\ \\/ /      | - | | __ |
 |_|\\_\\   |_|_|       \\__/       |_|_| |_||_|
                                             
  >>> NIZHAL AI HACKATHON PROTOCOL INITIATED <<<
`);

console.log('----------------------------------------------------');
console.log('[1/4] Loading Competition Extensions...      [OK]');
console.log('[2/4] Syncing Oracle Cloud Resources...      [OK]');
console.log('[3/4] Establishing Team Secure Uplink...     [OK]');
console.log('[4/4] Activating "Cybersecurity Mentor"...   [OK]');
console.log('----------------------------------------------------');
console.log('\nReady to win? (Starting application...)');

// In a real scenario, this would set ENV vars
// process.env.NIZHAL_MODE = 'KAVACH';
// require('./scripts/start-app.js'); or exec('npm start');

// For demo, just finish gracefully or launch npm start
// exec('npm start', (err, stdout, stderr) => {
//     if (err) console.error(err);
//     console.log(stdout);
// });

console.log('\n> Run `npm start` to launch GUI.');
