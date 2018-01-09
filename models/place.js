var mongoose = require("mongoose");

var placeSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   createdAtDate: String,
   createdAtTime: String,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   }
});

module.exports = mongoose.model("Place", placeSchema);