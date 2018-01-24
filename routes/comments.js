var express = require("express");
var router  = express.Router({mergeParams: true});
var Place = require("../models/place");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new",middleware.isLoggedIn, function(req, res){
    // find place by id
    console.log(req.params.id);
    Place.findById(req.params.id, function(err, place){
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          res.redirect("/places/" + req.params.id);
        } else {
          res.render("comments/new", {place: place});
        }
    })
});

//Comments Create
router.post("/",middleware.isLoggedIn,function(req, res){
   //lookup place using ID
   Place.findById(req.params.id, function(err, place){
       if(err){
           console.log(err);
           req.flash("error", "Something went wrong!! Try again!");
           res.redirect("/places");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
            req.flash("error", "Something went wrong!! Try again!");
            res.redirect("/places");
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
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

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
        req.flash("error", "Something went wrong!! Try again!");
        res.redirect("back");
      } else {
        res.render("comments/edit", {place_id: req.params.id, comment: foundComment});
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