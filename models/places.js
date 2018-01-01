var mongoose = require("mongoose");

var placeSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String
});

module.exports = mongoose.model("Place", placeSchema);