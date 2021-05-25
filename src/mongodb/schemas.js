const { Schema, model } = require('mongoose');

const user = model('user', new Schema({
    _id: String,
    data: Object
}));

const server = model('server', new Schema({
    _id: String,
    data: Object
}));

module.exports = {
    user, server
}