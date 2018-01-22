var express = require("express");
var router  = express.Router();
var passport = require("passport");
var async=  require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
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
            req.flash("error", "Something went wrong!! Try again!");
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
          console.log(user);
          req.flash("error", "Successfully registered as: " + newUser.username);
          res.redirect("/places"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

//handling login logic
router.post("/login", function (req, res, next) {
  passport.authenticate("local", 
    {
        successRedirect: "/places",
        successFlash: 'Welcome back, ' + req.body.username + '!',
        failureRedirect: "/login",
        failureFlash: "Please try again"
    })(req, res);
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Successfully logged you out!!")
   res.redirect("/places");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'contact.hiddenwonderz@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'contact.hiddenwonderz@gmail.com',
        subject: 'Hidden Wonderz: Password Reset',
        text: 'You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n\n\n' + 
          'From:\n' + 'Team Hidden Wonderz.'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash("success", "Sent a password reset mail to: " + user.email);
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash("error", "Something went wrong!! Try again!");
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                req.flash("success", "Successfully changed the password");
                done(err, user);
              });
            });
          })
        } else {
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'contact.hiddenwonderz@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'contact.hiddenwonderz@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello ' + user.firstName +',\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/places');
  });
});

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