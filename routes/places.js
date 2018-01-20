var express = require("express");
var router  = express.Router();
var Place = require("../models/place");
var moment = require("moment");
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
    req.body.place.createdAtTime = moment().format("hh:mm:ss a (Z)");
    // Create a new place and save to DB
    Place.create(req.body.place, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to places page
            console.log(newlyCreated);
            res.redirect("/places");
        }
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
    Place.findById(req.params.id, function(err, foundPlace){
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
           res.redirect("/places");
       } else {
           //redirect somewhere(show page)
           console.log(req.body.place);
           res.redirect("/places/" + req.params.id);
       }
    });
});

// DESTROY PLACE ROUTE
router.delete("/:id",middleware.checkPlaceOwnership, function(req, res){
   Place.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/places");
      } else {
          res.redirect("/places");
      }
   });
});


module.exports = router;