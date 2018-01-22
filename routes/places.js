var express = require("express");
var router  = express.Router();
var Place = require("../models/place");
var moment = require("moment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
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
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'hiddenwonderz', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


//INDEX - show all places
router.get("/", function(req, res){
    // Get all places from DB
    Place.find({}, function(err, allPlaces){
       if(err){
           console.log(err);
       } else {
          res.render("places/index",{places:allPlaces});
       }
    });
});

//CREATE - add new place to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  geocoder.geocode(req.body.place.location, function (err, data) {
    req.body.place.lat = data.results[0].geometry.location.lat;
    req.body.place.lng = data.results[0].geometry.location.lng;
    req.body.place.location = data.results[0].formatted_address;

    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the place object under image property
      req.body.place.image = result.secure_url;
      // add author to place
      req.body.place.author = {
        id: req.user._id,
        username: req.user.username
      }
      // add time
      req.body.place.createdAtDate = moment().format("Do MMM YY");
      req.body.place.createdAtTime = moment().format("hh:mm:ss a");
      // Create a new place and save to DB
      Place.create(req.body.place, function(err, newlyCreated){
          if(err){
              req.flash("error", err.message);
              console.log(err);
          } else {
              req.flash("success", "Added a new place");
              //redirect back to places page
              console.log(newlyCreated);
              res.redirect("/places");
          }
      });
    });
  });
});

//NEW - show form to create new place
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("places/new"); 
});

// SHOW - shows more info about one place
router.get("/:id", function(req, res){
    //find the place with provided ID
    Place.findById(req.params.id).populate("comments").exec(function(err, foundPlace){
        if(err){
            console.log(err);
        } else {
            //render show template with that place
            res.render("places/show", {place: foundPlace});
        }
    });
});

// EDIT PLACE ROUTE
router.get("/:id/edit",middleware.checkPlaceOwnership, function(req, res){
    Place.findById(req.params.id, function(err, foundPlace){
        res.render("places/edit", {place: foundPlace});
    });
});

// UPDATE PLACE ROUTE
router.put("/:id",middleware.checkPlaceOwnership, function(req, res){
    // find and update the correct place
    Place.findByIdAndUpdate(req.params.id, req.body.place, function(err, updatedPlace){
       if(err){
          req.flash("error", err.message);
          res.redirect("/places");
       } else {
          //redirect somewhere(show page)
          req.flash("success", "Updated!!");
          console.log(req.body.place);
          res.redirect("/places/" + req.params.id);
       }
    });
});

// DESTROY PLACE ROUTE
router.delete("/:id",middleware.checkPlaceOwnership, function(req, res){
   Place.findByIdAndRemove(req.params.id, function(err){
      if(err){
          req.flash("error", err.message);
          res.redirect("/places");
      } else {
          req.flash("success", "Deleted the place successfully");
          res.redirect("/places");
      }
   });
});


module.exports = router;