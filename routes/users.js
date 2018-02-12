var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var Place = require("../models/place");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, 
                      fileFilter: imageFilter, 
                      limits: { fieldSize: 25 * 1024 * 1024 }
            });

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'hiddenwonderz', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Editing user
router.get("/user/:id/edit",middleware.checkUserOwnership, function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "User not found");
      res.redirect("/places");
    } else {
      res.render("users/edit", {user: foundUser});
    }
  });
});

//Update user
router.put("/user/:id",middleware.checkUserOwnership, upload.single('avatar'), function(req, res){
  User.find().or([{ username: req.body.user.username }, { email: req.body.user.email }]).exec(function (err, user) {
    if(err){
      req.flash("error", "User not found");
      res.redirect("/places");
    } else {
      if(user.length == 1){
        if(user[0]._id == req.params.id){
          updateUser();
        } else if(user[0].username == req.body.user.username){
          req.flash("error", "username already exists");
          res.redirect("/user/" + req.params.id + "/edit");
        } else if(user[0].email == req.body.user.email){
          req.flash("error", "email already exists")
          res.redirect("/user/" + req.params.id + "/edit");
        }
      } else if(user.length == 2){
          if((user[0].username == req.body.user.username) || (user[1].username == req.body.user.username)){
          req.flash("error", "username already exists")
          res.redirect("/user/" + req.params.id + "/edit");
        } else if((user[0].email == req.body.user.email) || (user[1].email == req.body.user.email)){
          req.flash("error", "email already exists")
          res.redirect("/user/" + req.params.id + "/edit");
        }
      } else {
        updateUser();
      }
    }
  });
  function updateUser(){
    if(req.body.user.avatarUpdateData){
      User.findById(req.params.id, function(err, foundUser){
        if(err){
          req.flash("error", "Couldnt find the user. try again");
          res.redirect("/places");
        } else {
          function uploadAvatar() {
            cloudinary.uploader.upload(req.body.user.avatarUpdateData, function(result) {
              req.body.user.avatar = result.secure_url;
              req.body.user.avatarId = result.public_id;
              delete req.body.user.avatarUpdateData;
              setTimeout(updateUser, 2000);
            });
          }
          if(foundUser.avatarId){
            cloudinary.uploader.destroy(foundUser.avatarId, function(result) {
              console.log(result);
            });
            setTimeout(uploadAvatar, 300);
          } else {
            uploadAvatar();
          }
        }
      })
    } else {
      updatedUser();
    }
    function updateUser(){
      User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
          req.flash("error", "Couldn't update user. Please try again");
          res.redirect("/places");
        } else {
          //redirect
          req.flash("success", "Updated your profile!!");
          res.redirect("/user/" + req.params.id);
        }
      });
    }
  }
});
module.exports = router;