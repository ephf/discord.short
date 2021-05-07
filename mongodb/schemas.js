let mongoose = require('mongoose');

module.exports = {
    user: mongoose.model('user', mongoose.Schema({
        _id: String,
        data: Object
    })),
    server: mongoose.model('server', mongoose.Schema({
        _id: String,
        data: Object
    }))
}