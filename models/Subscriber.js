const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
