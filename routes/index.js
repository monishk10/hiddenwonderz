var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");

//root route
router.get("/", function(req, res){
    res.render("home");
});

//root route
router.get("/aboutme", function(req, res){
    res.render("aboutme");
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      avatar: req.body.avatar,
      email: req.body.email,
      username: req.body.username
    });
    /*eval(require('locus'));*/
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
          console.log(user);
          res.redirect("/places"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/places",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   res.redirect("/places");
});

router.get("/user/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      console.log(err);
    }
    res.render("users/show", {user: foundUser});
  });
});



module.exports = router;