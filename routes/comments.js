var express = require("express");
var router  = express.Router({mergeParams: true});
var Place = require("../models/place");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments Create
router.post("/",middleware.isLoggedIn,function(req, res){
  //lookup place using ID
  Place.findById(req.params.id, function(err, place){
    if(err){
      req.flash("error", "Something went wrong!! Try again!");
      res.redirect("/places/" + req.params.id);
    } else {
      Comment.create(req.body.comment, function(err, comment){
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          res.redirect("/places/" + req.params.id);
        } else {
          //add username,id and avatar to comment
          comment.author.id = req.user._id;
          comment.author.firstName = req.user.firstName;
          comment.author.avatar = req.user.avatar;
          //save comment
          comment.save();
          place.comments.push(comment);
          place.save();
          req.flash("success", "Successfully added comment");
          res.redirect('/places/' + place._id);
        }
      });
    }
  });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
        req.flash("error", "Something went wrong!! Try again!");
        res.redirect("back");
      } else {
        console.log(updatedComment);
        req.flash("success", "Successfully updated the comment!");
        res.redirect("/places/" + req.params.id );
      }
   });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
        req.flash("error", "Something went wrong!! Try again!");
        res.redirect("back");
       } else {
        req.flash("success", "Deleted the comment!!!");
        res.redirect("/places/" + req.params.id);
       }
    });
});

module.exports = router;