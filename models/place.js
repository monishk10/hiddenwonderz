var mongoose = require("mongoose");

var placeSchema = new mongoose.Schema({
   name: String,
   images: [{
      imageURL: String,
      imageID: String
   }],
   description: String,
   placeType: [
      {
         type: String
      }
   ],
   createdAtDate: String,
   createdAtTime: String,
   location: String, 
   lat: Number, 
   lng: Number,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      firstName: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Place", placeSchema);