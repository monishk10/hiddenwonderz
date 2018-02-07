var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var Place = require("../models/place");
var Comment = require("../models/comment");

// Get user profile
router.get("/user/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "User not found!!");
      console.log(err);
    }
    var userPlaces, userComments;
    Place.find().where('author.id').equals(foundUser._id).exec(function(err, places){
      if(err){
        req.flash("error", "User not found!!");
        res.redirect("/places");
      }	
      userPlaces = places;
    });
    Comment.find().where('author.id').equals(foundUser._id).exec(function(err, comments){
      if(err){
        req.flash("error", "User not found!!");
        res.redirect("/places");
      } 
      userComments = comments;
    });
    setTimeout(showPage, 500);
    function showPage() {
      var userScore = {};
      userScore.value = (userPlaces.length * 5) + userComments.length;
      if(userScore.value >= 0 && userScore.value < 5){
        userScore.level = "Newbie";
        userScore.levelColor = "grey";
        userScore.vehicle = "bicycle";
        userScore.dataTotal = 5;
        userScore.dataValue = userScore.value;
        userScore.left = (userScore.dataTotal - userScore.dataValue) + " left";
      } else if(userScore.value >= 5 && userScore.value < 15){
        userScore.level = "Beginner";
        userScore.levelColor = "brown";
        userScore.vehicle = "motorcycle";
        userScore.dataTotal = 10;
        userScore.dataValue = userScore.value - 5;
        userScore.left = (userScore.dataTotal - userScore.dataValue) + " left";
      } else if(userScore.value >= 15 && userScore.value < 30){
        userScore.level = "Casual Traveller";
        userScore.levelColor = "teal";
        userScore.vehicle = "car";
        userScore.dataTotal = 15;
        userScore.dataValue = userScore.value - 15;
        userScore.left = (userScore.dataTotal - userScore.dataValue) + " left";
      } else if(userScore.value >= 30 && userScore.value < 50){
        userScore.level = "Avid Traveller";
        userScore.levelColor = "yellow";
        userScore.vehicle = "plane";
        userScore.dataTotal = 20
        userScore.dataValue = userScore.value - 30;
        userScore.left = (userScore.dataTotal - userScore.dataValue) + " left";
      } else if(userScore.value >= 50){
        userScore.level = "Traveller for life";
        userScore.levelColor = "red";
        userScore.vehicle = "rocket";
        userScore.dataTotal = 10;
        userScore.dataValue = 9;
        userScore.left = "infinty"
      }
      res.render("users/show", {user: foundUser, places: userPlaces, comments: userComments, userScore: userScore});
    }
  });
});

module.exports = router;