var express = require("express");
var router  = express.Router();
var passport = require("passport");
var async=  require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
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
var upload = multer({ storage: storage, fileFilter: imageFilter, limits: { fieldSize: 25 * 1024 * 1024 }});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'hiddenwonderz', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// show register form
router.get("/register", function(req, res){
  res.render("users/register"); 
});

//handle sign up logic
router.post("/register", upload.single('avatar'), function(req, res){
  //Search if username or email already exists in db
  User.find().or([{ username: req.body.username }, { email: req.body.email }]).exec(function (err, user) {
    // if exists then flash error message
    if(user.length > 0) {
      if(user[0].username == req.body.username){
        req.flash("error", "Username already exists");
      } else if(user[0].email == req.body.email){
        req.flash("error", "Email already exists");
      }
      res.redirect("/register");
    // else register
    } else {
      // if user uploaded any avatar
      if(req.body.avatarData){
        // upload on cloudinary
        cloudinary.uploader.upload(req.body.avatarData, function(result) {
          // avatar URL
          req.body.avatar = result.secure_url;
          // avatar ID for updating/deleting
          req.body.avatarId = result.public_id;
        });
      // if not uploaded then by default choose avatar
      } else {
        // for male
        if(req.body.gender == 'male'){
          req.body.avatar = "http://res.cloudinary.com/hiddenwonderz/image/upload/v1518273154/default-avatar-ginger-guy_f5ejm8.png"
        } 
        // for female
        else if(req.body.gender == 'female') {
          req.body.avatar = "http://res.cloudinary.com/hiddenwonderz/image/upload/v1518679305/default-avatar-girl_d6zrdr.jpg"
        }
      }
      // Now register user
      register_user();
    }
  });
  function register_user(){
    // wait until avatar is available for user
    if(req.body.avatar){
      var newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        avatarId: req.body.avatarId,
        email: req.body.email,
        username: req.body.username
      });
      // register user
      User.register(newUser, req.body.password, function(err, user){
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          return res.render("users/register");
        }
        // login with register
        passport.authenticate("local")(req, res, function(){
          req.flash("success", "Successfully registered as: " + newUser.username);
          res.redirect("/places"); 
        });
      });
      // waiting algo for avatar 
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
  // authenticate user
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      req.flash("error", "Something went wrong!! Try again!");
      return next(err); 
    }
    // if user doesn't exist
    if (!user) { 
      req.flash("error", "Invalid username/password. Try again!");
      return res.redirect('/login'); 
    }
    // else login
    req.logIn(user, function(err) {
      if (err) { 
        req.flash("error", "Something went wrong!! Try again!");
        return next(err); 
      }
      // passed session URL from middleware to redirect to previus page else redirect to places
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
  //execute instructions one by one
  async.waterfall([
    function(done) {
      // generate token
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      // find the user to reset password
      User.findOne({ email: req.body.email }, function(err, user) {
        // if no user
        if (!user) {
          req.flash("error", "No user with the specified email found.")
          return res.redirect('/forgot');
        }
        // else give the user token and expiry
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        //save that value to db
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      // mail user
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
    // if some other error redirect to places
    if (err) return next(err);
    res.redirect('/places');
  });
});

// reset route
router.get('/reset/:token', function(req, res) {
  // find the user with the given token and if token expiry value is greater than current time it won't find user
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash("error", "Something went wrong!! Try again!");
      return res.redirect('/forgot');
    }
    res.render('users/reset', {token: req.params.token});
  });
});
// post reset route
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      // find the user with the given token and if token expiry value is greater than current time it won't find user
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash("error", "Something went wrong!! Try again!");
          return res.redirect('back');
        }
        //check if both the value of password i.e. password and confirm password fields are same
        if(req.body.password === req.body.confirm) {
          // set password then
          user.setPassword(req.body.password, function(err) {
            // make those token values undefined
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // save user with updated password
            user.save(function(err) {
              req.logIn(user, function(err) {
                req.flash("success", "Successfully changed the password");
                done(err, user);
              });
            });
          })
        // if both the passwords are not same redirect "back" i.e to reset page
        } else {
          return res.redirect('back');
        }
      });
    },
    function(user, done) {
      // mail user about password reset successful
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

// Get user profile
router.get("/user/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if(err){
      req.flash("error", "User not found!!");
      res.redirect("/places")
    }
    var userPlaces, userComments;
    // find places posted by the user
    Place.find().where('author.id').equals(foundUser._id).exec(function(err, places){
      if(err){
        req.flash("error", "User not found!!");
        res.redirect("/places");
      }	
      userPlaces = places;
    });
    // find comments posted by the user
    Comment.find().where('author.id').equals(foundUser._id).exec(function(err, comments){
      if(err){
        req.flash("error", "User not found!!");
        res.redirect("/places");
      } 
      userComments = comments;
    });
    // wait till values are registerd to userPlaces and userComments
    setTimeout(showPage, 500);
    function showPage() {
      var userScore = {};
      // scoring values
      userScore.value = (userPlaces.length * 5) + userComments.length;
      // usertype
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
  // find user with the same username or email
  User.find().or([{ username: req.body.user.username }, { email: req.body.user.email }]).exec(function (err, user) {
    if(err){
      req.flash("error", "User not found");
      res.redirect("/places");
    } else {
      // if only one user found
      if(user.length == 1){
        // if id's of both are same, then it's the same user
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
          req.flash("error", "email/username already exists")
          res.redirect("/user/" + req.params.id + "/edit");
        } else if((user[0].email == req.body.user.email) || (user[1].email == req.body.user.email)){
          req.flash("error", "email/username already exists")
          res.redirect("/user/" + req.params.id + "/edit");
        }
      } else {
        updateUser();
      }
    }
  });
  function updateUser(){
    // Check if user has updated avatar
    if(req.body.user.avatarUpdateData){
      // Find user details
      User.findById(req.params.id, function(err, foundUser){
        if(err){
          req.flash("error", "Couldnt find the user. try again");
          res.redirect("/places");
        } else {
          // uploadAvatar() -> upload the avatar
          function uploadAvatar() {
            cloudinary.uploader.upload(req.body.user.avatarUpdateData, function(result) {
              req.body.user.avatar = result.secure_url;
              req.body.user.avatarId = result.public_id;
              // delete the base64 image data
              delete req.body.user.avatarUpdateData;
              uploading_updating();
              // Wait until the file is uploaded
              function uploading_updating() {
                if(req.body.user.avatarId){
                  Comment.find().where('author.id').equals(foundUser._id).exec(function(err, comments){
                    comments.forEach(function(comment){
                      comment.author.avatar = req.body.user.avatar;
                      comment.save();
                    });
                  });
                  // after avatar is updated, update the user details
                  updateUserData();
                } else {
                  setTimeout(uploading_updating, 200);
                }
              }
            });
          }
          // if the user had an avatar previously
          if(foundUser.avatarId){
            // destroy the previous avatar
            cloudinary.uploader.destroy(foundUser.avatarId, function(result) {
              delete_check();
              // check if it's deleted or no
              function delete_check(){
                if(result.result == 'ok'){
                  uploadAvatar();
                } else {
                  setTimeout(delete_check, 10);
                }
              }
            });
            // if the user didn't have an avatar directly upload avatar
          } else {
            uploadAvatar();
          }
        }
      });
    // if the user didn't request for updating, just update the user with any other details
    } else {
      updateUserData();
    }
    // Updating user function
    function updateUserData(){
      User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
          req.flash("error", "Couldn't update user. Please try again");
          res.redirect("/places");
        } else {
          //redirect
          Comment.find().where('author.id').equals(updatedUser._id).exec(function(err, comments){
            comments.forEach(function(comment){
              comment.author.firstName = req.body.user.firstName;
              comment.save();
            });
          });
          Place.find().where('author.id').equals(updatedUser._id).exec(function(err, places){
            places.forEach(function(place){
              place.author.firstName = req.body.user.firstName;
              place.save();
            });
          });
          req.flash("success", "Updated your profile!!");
          res.redirect("/user/" + req.params.id);
        }
      });
    }
  }
});
module.exports = router;