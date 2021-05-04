let mongoose = require('mongoose');

module.exports = async function(id) {
    await mongoose.connect(`mongodb+srv://${id.mongo.username}:${id.mongo.password}@cluster0.epw94.mongodb.net/${id.mongo.database}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    });
    return mongoose;
}