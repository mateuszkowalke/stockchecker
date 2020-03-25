const mongoose = require('mongoose');

const likesSchema = new mongoose.Schema({
    stock: String,
    likes: Number,
    IPs: [String]
});

module.exports = mongoose.model('Likes', likesSchema);