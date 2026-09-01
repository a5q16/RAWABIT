const localtunnel = require('localtunnel');

(async () => {
  const port = 8000;
  const subdomain = 'rawabit-api';

  console.log(`Starting tunnel to localhost:${port}...`);

  const tunnel = await localtunnel({ port, subdomain });

  console.log(`\n========================================`);
  console.log(`  Rawabit API is publicly available at:`);
  console.log(`  ${tunnel.url}/docs`);
  console.log(`========================================\n`);

  tunnel.on('close', () => {
    console.log('Tunnel closed');
    process.exit(0);
  });

  tunnel.on('error', (err) => {
    console.error('Tunnel error:', err.message);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\nClosing tunnel...');
    tunnel.close();
  });
})();
