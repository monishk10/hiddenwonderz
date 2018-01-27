var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var Place = require("../models/place");

// Get user profile
router.get("/user/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "User not found!!");
      console.log(err);
    }
    Place.find().where('author.id').equals(foundUser._id).exec(function(err, places){
    if(err){
      req.flash("error", "User not found!!");
      console.log(err);
    }	
    res.render("users/show", {user: foundUser, places: places});
    })
  });
});

module.exports = router;