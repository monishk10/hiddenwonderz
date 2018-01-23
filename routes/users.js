var express = require("express");
var router  = express.Router();
var User = require("../models/user");

// Get user profile
router.get("/user/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "User not found!!");
      console.log(err);
    }
    res.render("users/show", {user: foundUser});
  });
});

module.exports = router;