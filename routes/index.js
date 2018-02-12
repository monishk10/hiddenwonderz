var express = require("express");
var router  = express.Router();
var passport = require("passport");
var async=  require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var User = require("../models/user");
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

//root route
router.get("/", function(req, res){
    res.render("home");
});

//root route
router.get("/aboutMe", function(req, res){
    res.render("aboutme");
});

// show register form
router.get("/register", function(req, res){
   res.render("users/register"); 
});

//handle sign up logic
router.post("/register", upload.single('avatar'), function(req, res){
  //eval(require('locus'));
  User.find().or([{ username: req.body.username }, { email: req.body.email }]).exec(function (err, user) {
    if(user.length > 0) {
      if(user[0].username == req.body.username){
        req.flash("error", "Username already exists");
      } else if(user[0].email == req.body.email){
        req.flash("error", "Email already exists");
      }
      res.redirect("/register");
    } else {
      if(req.body.avatarData){
        cloudinary.uploader.upload(req.body.avatarData, function(result) {
          req.body.avatar = result.secure_url;
          req.body.avatarId = result.public_id;
        });
      } else {
        req.body.avatar = "http://res.cloudinary.com/hiddenwonderz/image/upload/v1518273154/default-avatar-ginger-guy_f5ejm8.png"
      }
      register_user();
    }
  });
  function register_user(){
    if(req.body.avatar){
      var newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        avatarId: req.body.avatarId,
        email: req.body.email,
        username: req.body.username
      });
      User.register(newUser, req.body.password, function(err, user){
          if(err){
            req.flash("error", "Something went wrong!! Try again!");
            return res.render("users/register");
          }
          passport.authenticate("local")(req, res, function(){
            req.flash("success", "Successfully registered as: " + newUser.username);
            res.redirect("/places"); 
          });
      });
    } else {
      setTimeout(register_user, 500);
    }
  }
});

//show login form
router.get("/login", function(req, res){
   res.render("users/login"); 
});

//handling login logic
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      req.flash("error", "Something went wrong!! Try again!");
      return next(err); 
    }
    if (!user) { 
      req.flash("error", "Invalid username/password. Try again!");
      return res.redirect('/login'); 
    }
    req.logIn(user, function(err) {
      if (err) { 
        req.flash("error", "Something went wrong!! Try again!");
        return next(err); 
      }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/places';
      delete req.session.redirectTo;
      req.flash("success", "Welcome back, " + req.body.username + "!");
      res.redirect(redirectTo);
    });
  })(req, res, next);
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Successfully logged you out!!")
   res.redirect("/places");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('users/forgot');
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
          req.flash("error", "No user with the specified email found.")
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
        html: '<link href="https://fonts.googleapis.com/css?family=Mukta+Mahee" rel="stylesheet"><style>body{font-family: "Mukta Mahee", sans-serif;color: #303030;}</style><div style="border: 5px solid #0e1d28; border-radius: 5px; padding: 7% 14%; background: #0e1d28;"><div style="background: white; padding: 7%;"><div style="border-bottom: 1px solid rgba(211,211,211,0.4); padding: 10px;"><img src="https://i.imgur.com/A23M1TR.png" style="max-height: 40px;"></div><div><p> Hi ' + user.firstName + ',</p><p>You are receiving this because you (or someone else) has requested the reset of the password for your account.</p><p>Please click on the following link</p><a style="cursor: pointer;display: inline-block;min-height: 1em;outline: none;border: none;background-color: #0e1d28;color: #FFFFFF;margin: 0em 0.25em 0em 0em;padding: 0.78571429em 1.5em 0.78571429em;line-height: 1em;text-decoration: none;text-align: center;border-radius: 0.28571429rem;" href="' + 'http://' + req.headers.host + '/reset/' + token + '">Click</a><p>If you did not request this, please ignore this email and your password will remain unchanged</p><p>From:</p><p>Team Hidden Wonderz</p></div></div></div>'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "Sent a password reset mail to: " + user.email);
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('places');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash("error", "Something went wrong!! Try again!");
      return res.redirect('/forgot');
    }
    res.render('users/reset', {token: req.params.token});
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
        html: '<link href="https://fonts.googleapis.com/css?family=Mukta+Mahee" rel="stylesheet"><style>body{font-family: "Mukta Mahee", sans-serif;color: #303030;}</style><div style="border: 5px solid #0e1d28; border-radius: 5px; padding: 7% 14%; background: #0e1d28;"><div style="background: white; padding: 7%;"><div style="border-bottom: 1px solid rgba(211,211,211,0.4); padding: 10px;"><img src="https://i.imgur.com/A23M1TR.png" style="max-height: 40px;"></div><div><p> Hi ' + user.firstName + ',</p><p>This is a confirmation that the password for your account ' + user.email + ' has just been changed.</p><p>From:</p><p>Team Hidden Wonderz</p></div></div></div>'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/places');
  });
});

module.exports = router;