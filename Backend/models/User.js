const mongoose = require('mongoose');
const User = require('../models/User');
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String },
  profileImage: { type: String },
  bio: { type: String },
}, {
  timestamps: true,
  collection: 'users',
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
