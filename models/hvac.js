var mongoose = require('mongoose');

var HvacSchema = mongoose.Schema({
    _id: Number,
    mode: String,
    setpoint: Number,
    temperature: Number,
    humidity: Number
});

var HvacModel = mongoose.model('Hvac', HvacSchema);

module.exports = HvacModel;