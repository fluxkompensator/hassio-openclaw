import express from 'express';
import QRCode from 'qrcode';
import { spawn, execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const app = express();
const PORT = 18790;

const SIGNAL_DATA_DIR = '/data/openclaw/.signal-cli';
const CONFIG_FILE = '/data/options.json';

// State for linking process
let linkingState = {
  active: false,
  uri: null,
  qrDataUrl: null,
  error: null,
  linked: false
};

function getConfig() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    return {
      phone: config.signal_phone || '',
      enabled: config.signal_enabled || false
    };
  } catch {
    return { phone: '', enabled: false };
  }
}

function checkLinked() {
  const config = getConfig();
  if (!config.phone) return false;

  try {
    // Check if account data exists
    const result = execSync(
      `signal-cli --config "${SIGNAL_DATA_DIR}" -a "${config.phone}" listAccounts 2>&1`,
      { encoding: 'utf8', timeout: 10000 }
    );
    return result.includes(config.phone);
  } catch {
    return false;
  }
}

// Serve the setup UI
app.get('/', (req, res) => {
  const config = getConfig();
  const isLinked = checkLinked();

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>OpenClaw Signal Setup</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
    }
    h1 { color: #4cc9f0; margin-bottom: 10px; }
    .status {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .status.success { background: #1b4332; border: 1px solid #2d6a4f; }
    .status.warning { background: #3d2914; border: 1px solid #6b4423; }
    .status.error { background: #3d1414; border: 1px solid #6b2323; }
    .status.info { background: #14243d; border: 1px solid #234a6b; }
    button {
      background: #4cc9f0;
      color: #1a1a2e;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover { background: #7dd8f5; }
    button:disabled { background: #555; color: #888; cursor: not-allowed; }
    #qr-container {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 12px;
      display: none;
    }
    #qr-container img { max-width: 280px; }
    .instructions {
      background: #252541;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .instructions ol { margin: 10px 0; padding-left: 20px; }
    .instructions li { margin: 8px 0; }
    .phone { font-family: monospace; color: #4cc9f0; }
    #status-text { margin: 15px 0; }
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #4cc9f0;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 10px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <h1>Signal Setup</h1>
  <p>Link your Signal account to OpenClaw for voice message support.</p>

  ${!config.enabled ? `
    <div class="status warning">
      <strong>Signal not enabled</strong><br>
      Enable Signal in the addon configuration first.
    </div>
  ` : !config.phone ? `
    <div class="status warning">
      <strong>Phone number not set</strong><br>
      Set your Signal phone number in the addon configuration.
    </div>
  ` : isLinked ? `
    <div class="status success">
      <strong>Signal Linked</strong><br>
      Account <span class="phone">${config.phone}</span> is connected.
    </div>
    <button onclick="startLink()">Re-link Account</button>
  ` : `
    <div class="status info">
      <strong>Ready to Link</strong><br>
      Phone: <span class="phone">${config.phone}</span>
    </div>
    <button id="link-btn" onclick="startLink()">Generate QR Code</button>
  `}

  <div id="qr-container">
    <img id="qr-img" src="" alt="Signal Link QR Code">
  </div>

  <div id="status-text"></div>

  <div class="instructions" id="instructions" style="display: none;">
    <strong>To complete linking:</strong>
    <ol>
      <li>Open Signal on your phone</li>
      <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong></li>
      <li>Tap <strong>Link New Device</strong></li>
      <li>Scan the QR code above</li>
    </ol>
  </div>

  <script>
    async function startLink() {
      const btn = document.getElementById('link-btn');
      const status = document.getElementById('status-text');
      const qrContainer = document.getElementById('qr-container');
      const instructions = document.getElementById('instructions');

      if (btn) btn.disabled = true;
      status.innerHTML = '<span class="spinner"></span> Starting link process...';
      qrContainer.style.display = 'none';

      try {
        const res = await fetch('/api/link', { method: 'POST' });
        const data = await res.json();

        if (data.error) {
          status.innerHTML = '<div class="status error">' + data.error + '</div>';
          if (btn) btn.disabled = false;
          return;
        }

        if (data.qrDataUrl) {
          document.getElementById('qr-img').src = data.qrDataUrl;
          qrContainer.style.display = 'block';
          instructions.style.display = 'block';
          status.innerHTML = '<div class="status info">Scan this QR code with your Signal app. Waiting for confirmation...</div>';

          // Poll for completion
          pollStatus();
        }
      } catch (err) {
        status.innerHTML = '<div class="status error">Error: ' + err.message + '</div>';
        if (btn) btn.disabled = false;
      }
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();

        if (data.linked) {
          document.getElementById('status-text').innerHTML =
            '<div class="status success"><strong>Success!</strong> Signal account linked. You can close this page.</div>';
          document.getElementById('qr-container').style.display = 'none';
          document.getElementById('instructions').style.display = 'none';
          return;
        }

        if (data.error) {
          document.getElementById('status-text').innerHTML =
            '<div class="status error">' + data.error + '</div>';
          return;
        }

        if (data.active) {
          setTimeout(pollStatus, 2000);
        }
      } catch (err) {
        setTimeout(pollStatus, 3000);
      }
    }
  </script>
</body>
</html>`);
});

// Start linking process
app.post('/api/link', async (req, res) => {
  const config = getConfig();

  if (!config.enabled || !config.phone) {
    return res.json({ error: 'Signal not configured. Set phone number in addon settings.' });
  }

  if (linkingState.active) {
    return res.json({ error: 'Link process already in progress' });
  }

  linkingState = { active: true, uri: null, qrDataUrl: null, error: null, linked: false };

  try {
    // Run signal-cli link with URI output
    const proc = spawn('signal-cli', [
      '--config', SIGNAL_DATA_DIR,
      'link',
      '--name', 'OpenClaw-HA'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      // Look for the sgnl:// URI
      const match = output.match(/(sgnl:\/\/linkdevice\?[^\s]+)/);
      if (match && !linkingState.uri) {
        linkingState.uri = match[1];
        // Generate QR code
        QRCode.toDataURL(linkingState.uri, { width: 280, margin: 2 })
          .then(url => { linkingState.qrDataUrl = url; })
          .catch(err => { linkingState.error = err.message; });
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      // signal-cli outputs the link URI to stderr
      const match = text.match(/(sgnl:\/\/linkdevice\?[^\s]+)/);
      if (match && !linkingState.uri) {
        linkingState.uri = match[1];
        QRCode.toDataURL(linkingState.uri, { width: 280, margin: 2 })
          .then(url => { linkingState.qrDataUrl = url; })
          .catch(err => { linkingState.error = err.message; });
      }
    });

    proc.on('close', (code) => {
      linkingState.active = false;
      if (code === 0) {
        linkingState.linked = true;
      } else if (!linkingState.error) {
        linkingState.error = `Link process exited with code ${code}`;
      }
    });

    proc.on('error', (err) => {
      linkingState.active = false;
      linkingState.error = err.message;
    });

    // Wait for QR code to be generated
    let attempts = 0;
    while (!linkingState.qrDataUrl && !linkingState.error && attempts < 30) {
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    if (linkingState.error) {
      return res.json({ error: linkingState.error });
    }

    if (!linkingState.qrDataUrl) {
      return res.json({ error: 'Timeout waiting for QR code. Check signal-cli installation.' });
    }

    res.json({ qrDataUrl: linkingState.qrDataUrl });

  } catch (err) {
    linkingState.active = false;
    linkingState.error = err.message;
    res.json({ error: err.message });
  }
});

// Get current status
app.get('/api/status', (req, res) => {
  res.json({
    active: linkingState.active,
    linked: linkingState.linked || checkLinked(),
    error: linkingState.error
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Signal setup web UI running on port ${PORT}`);
});
