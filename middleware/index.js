var Place   = require("../models/place");
var Comment = require("../models/comment");

// all the middleare goes here
var middlewareObj = {};

middlewareObj.checkPlaceOwnership = function(req, res, next) {
  // Is the user logged in?(authenticated)
  if(req.isAuthenticated()){
    // Find the place to be altered
    Place.findById(req.params.id, function(err, foundPlace){
      if(err){
        req.flash("error", "Something went wrong!!. Try again!");
        res.redirect("back");
      } else {
        // does user own the place?
        if(foundPlace.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have the permission to do that!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You are not the owner of this post!");
    res.redirect("back");
  }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
  // Is the user logged in?(authenticated)
  if(req.isAuthenticated()){
    // Find the comment to be altered
    Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
        req.flash("error", "Something went wrong!!. Try again!");
        res.redirect("back");
      } else {
        // does user own the comment?
        if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash("error", "You don't have the permission to do that!");
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "You are not the owner of this post!");
    res.redirect("back");
  }
}

middlewareObj.isLoggedIn = function(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  req.flash("error", "You must be signed in to do that!");
  res.redirect("/login");
}

module.exports = middlewareObj;