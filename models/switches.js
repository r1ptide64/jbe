var mongoose = require('mongoose');

var switchSchema = mongoose.Schema({
    name: String,
    state: Boolean,
    devID: String
});
var JoebSwitch = mongoose.model('JoebSwitch', switchSchema);