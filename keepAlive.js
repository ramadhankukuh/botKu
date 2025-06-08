const express = require('express');
const app = express();

app.get('/', (_, res) => res.send('Bot is running'));

function keepAlive() {
  app.listen(process.env.PORT || 3000, () => {
    console.log('✅ Express server running');
  });
}

module.exports = keepAlive;
