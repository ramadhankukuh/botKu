const fs = require('fs');
const path = require('path');

const plugins = fs.readdirSync(path.join(__dirname, 'plugins'))
  .filter(file => file.endsWith('.js') || fs.lstatSync(path.join(__dirname, 'plugins', file)).isDirectory())
  .map(file => {
    if (file.endsWith('.js')) return require(`./plugins/${file}`);
    // For nested folders like news/
    const folderPath = path.join(__dirname, 'plugins', file);
    return fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.js'))
      .map(f => require(`./plugins/${file}/${f}`));
  })
  .flat();

const prefix = '/';

async function handleMessage(sock, msg) {
  const from = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

  if (!text.startsWith(prefix)) return;

  const [cmd, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  const plugin = plugins.find(p => p.command === cmd.toLowerCase());

  if (plugin) {
    try {
      await plugin.run(sock, msg, args);
    } catch (err) {
      console.error(`❌ Error running command ${cmd}:`, err);
      await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat menjalankan perintah.' });
    }
  }
}

module.exports = { handleMessage };
