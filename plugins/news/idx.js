const { getIDXNews, getLatestIDXHeadline } = require('../../lib/idx');
const Subscriber = require('../../models/Subscriber');
const Setting = require('../../models/Setting');

async function sendLatestHeadline(sock) {
  const latestHeadline = await getLatestIDXHeadline();
  if (!latestHeadline) return;

  let lastHeadline = await Setting.findOne({ key: 'latestIDXHeadline' });
  if (lastHeadline && lastHeadline.value === latestHeadline) {
    // Berita sama, tidak kirim ulang
    return;
  }

  if (!lastHeadline) {
    lastHeadline = new Setting({ key: 'latestIDXHeadline', value: latestHeadline });
  } else {
    lastHeadline.value = latestHeadline;
  }
  await lastHeadline.save();

  const subs = await Subscriber.find({});
  for (const sub of subs) {
    try {
      await sock.sendMessage(sub.jid, { text: `📰 *Berita Terbaru IDX:*\n\n${latestHeadline}` });
    } catch (err) {
      console.error(`Gagal kirim ke ${sub.jid}:`, err.message);
    }
  }
}

module.exports = {
  command: 'saham',
  tags: ['news'],
  run: async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const user = await Subscriber.findOne({ jid: from });

    if (args[0] === 'on') {
      if (user) {
        await sock.sendMessage(from, { text: '⚠️ Kamu sudah mengaktifkan update berita IDX.' });
      } else {
        await new Subscriber({ jid: from }).save();
        await sock.sendMessage(from, { text: '✅ Berhasil mengaktifkan update berita IDX otomatis.' });
      }
      return;
    }

    if (args[0] === 'off') {
      if (!user) {
        await sock.sendMessage(from, { text: '⚠️ Kamu belum mengaktifkan update berita IDX.' });
      } else {
        await Subscriber.deleteOne({ jid: from });
        await sock.sendMessage(from, { text: '✅ Berhasil mematikan update berita IDX otomatis.' });
      }
      return;
    }

    // Ambil berita manual
    const limit = parseInt(args[0]) || 5;
    const berita = await getIDXNews(limit);
    if (!berita) {
      await sock.sendMessage(from, { text: '⚠️ Gagal mengambil berita saham dari IDX Channel.' });
      return;
    }
    await sock.sendMessage(from, { text: berita });
  },
  startAutoUpdate: (sock) => {
    setInterval(() => {
      sendLatestHeadline(sock).catch(console.error);
    }, 5 * 60 * 1000); // Cek tiap 5 menit
  }
};
