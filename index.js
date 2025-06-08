const { default: makeWASocket, useSingleFileAuthState } = require('@adiwajshing/baileys');
const connectDB = require('./database');
const { handleMessage } = require('./messageHandler');
const idxPlugin = require('./plugins/news/idx');
const P = require('pino');

const { state, saveState } = useSingleFileAuthState('./auth.json');

async function startBot() {
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages[0].message) return;
    await handleMessage(sock, messages[0]);
  });

  sock.ev.on('creds.update', saveState);

  // Start auto-update berita IDX
  idxPlugin.startAutoUpdate(sock);
}

connectDB().then(() => {
  startBot();
});
