// Dev script: start ngrok on port 5000 and boot server with PUBLIC_BASE_URL
const { spawn } = require('child_process');

async function start() {
  let publicUrl = '';
  try {
    const ngrok = require('ngrok');
    publicUrl = await ngrok.connect({ addr: 5000 });
    console.log('✓ ngrok tunnel:', publicUrl);
  } catch (err) {
    console.warn('ngrok not available, continuing without tunnel. Set PUBLIC_BASE_URL manually if placing real calls.');
  }

  const env = { ...process.env };
  if (publicUrl) env.PUBLIC_BASE_URL = publicUrl;

  const child = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env,
  });

  child.on('exit', (code) => {
    console.log('Server exited with code', code);
  });
}

start();
