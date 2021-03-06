var express = require("express");
var router  = express.Router();
var Place = require("../models/place");
var Comment = require("../models/comment");
var moment = require('moment-timezone');
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GOOGLE_MAPS_API_KEY
};
var geocoder = NodeGeocoder(options);
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
  var noMatch;
  var perPage = 20;
  var pageQuery = parseInt(req.query.page);
  var pageNumber = pageQuery ? pageQuery : 1;
  // Search specific term
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // search via location or name with Regular Expressions(regex)
    Place.find().or([{"location": regex}, {"name": regex}]).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allPlaces){
      // count the places
      Place.count().or([{"location": regex}, {"name": regex}]).exec(function (err, count) {
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          res.redirect("back");
        } else {
          if(allPlaces.length < 1){
            noMatch = "No data found. Please search again."
          }
          res.render("places/index",
            {
              places:allPlaces, 
              noMatch: noMatch, 
              current: pageNumber, 
              pages: Math.ceil(count / perPage),
              search: req.query.search,
              placeType: false
            }
          );
        }
      });
    });
  } 
  // Search via tags
  else if(req.query.placeType){
    Place.find({"placeType" : { $all: req.query.placeType}}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allPlaces){
      Place.count({"placeType" : { $all: req.query.placeType}}).exec(function (err, count) {
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          res.redirect("back");
        } else {
          if(allPlaces.length < 1){
            noMatch = "No data found. Please search again."
          }
          res.render("places/index",
            {
              places:allPlaces, 
              noMatch: noMatch, 
              current: pageNumber, 
              pages: Math.ceil(count / perPage),
              search: false,
              placeType: req.query.placeType
            }
          );
        }
      });
    });
  } else {
    // Get all places from DB
    Place.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allPlaces){
      Place.count().exec(function (err, count) {
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          res.redirect("/places");
        } else {
          res.render("places/index",
            {
              places:allPlaces,
              noMatch: noMatch,
              current: pageNumber,
              pages: Math.ceil(count / perPage),
              search: false,
              placeType: false
            }
          );
        }
      });
    });
  }
});

//CREATE - add new place to DB
router.post("/", middleware.isLoggedIn, upload.array('images'), function(req, res){
  geocoder.geocode(req.body.place.location, function (err, data, results, status) {
    // if location was not found redirect to new page
    if (err) {
      req.flash('error', 'Something went wrong. Try again!');
      return res.redirect('back');
    }

    if(data.length < 1){
      req.flash('error', 'Invalid location address.. Try again');
      return res.redirect('back');
    }
    // else allot lat, long, location value
    req.body.place.lat = data[0].latitude;
    req.body.place.lng = data[0].longitude;
    req.body.place.location = data[0].formattedAddress;

    // start with an empty array to store image urls
    req.body.place.images = [];

    // loop through the no of images to upload one by one
    for(var i=0; i<req.files.length; i++) {
      var imageObject = {};
      cloudinary.uploader.upload(req.files[i].path, function(result) {
        // add cloudinary url for the image to the place object under image property
        imageObject = {
          imageURL: result.secure_url,
          imageID: result.public_id
        }
        req.body.place.images.push(imageObject);
      });
    }

    // A function that checks if the images are uploaded in a 500 msec interval and creates the place
    main();
    function main(){
      if (req.body.place.images.length == req.files.length) {
        // add author to place
        req.body.place.author = {
          id: req.user._id,
          firstName: req.user.firstName
        }
        // add time
        req.body.place.createdAtDate = moment().tz('Asia/Kolkata').format("Do MMM YY");
        req.body.place.createdAtTime = moment().tz('Asia/Kolkata').format("hh:mm:ss a");
        if(req.body.place.images.length)
        // Create a new place and save to DB
        Place.create(req.body.place, function(err, newlyCreated){
          if(err){
            req.flash("error", "Something went wrong!! Try again!");
            res.redirect("/places");
          } else {
            req.flash("success", "Added a new place, " + newlyCreated.name);
            res.redirect("/places");
          }
        });
      } else {
        setTimeout(main, 500);
      }
    }
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
      req.flash("error", "Something went wrong!! Try again!");
      res.redirect("/places");
    } else {
      //render show template with that place
      res.render("places/show", {place: foundPlace});
    }
  });
});

// EDIT PLACE ROUTE
router.get("/:id/edit",middleware.checkPlaceOwnership, function(req, res){
  Place.findById(req.params.id, function(err, foundPlace){
    if(err){
      req.flash("error", "Something went wrong!! Try again!");
      res.redirect(("/places/" + req.params.id) || "/places");
    } else {
      res.render("places/edit", {place: foundPlace});
    }
  });
});

// UPDATE PLACE ROUTE
router.put("/:id",middleware.checkPlaceOwnership, function(req, res){
  geocoder.geocode(req.body.place.location, function (err, data, results, status) {
    // if location was not found redirect to edit page
    if (err) {
      req.flash('error', 'Something went wrong. Try again!');
      return res.redirect('back');
    }

    if(data.length < 1){
      req.flash('error', 'Invalid location address.. Try again');
      return res.redirect('back');
    }
    
    req.body.place.lat = data[0].latitude;
    req.body.place.lng = data[0].longitude;
    req.body.place.location = data[0].formattedAddress;
    // find and update the correct place
    Place.findByIdAndUpdate(req.params.id, req.body.place, function(err, updatedPlace){
      if(err){
        req.flash("error", "Something went wrong!! Try again!");
        res.redirect(("/places/" + req.params.id) || "/places");
      } else {
        //redirect somewhere(show page)
        req.flash("success", "Updated!!");
        res.redirect("/places/" + req.params.id);
      }
    });
  });
});

// DESTROY PLACE ROUTE
router.delete("/:id",middleware.checkPlaceOwnership, function(req, res){
  Place.findById(req.params.id, function(err, foundPlace){
    if(err){
      req.flash("error", "Something went wrong!! Try again!");
      res.redirect("/places");
    } else {
      //Deleting the images associated with the place
      for(var i=0; i < foundPlace.images.length; i++){
        cloudinary.uploader.destroy(foundPlace.images[i].imageID, function(result){
        });
      }
      //Deleting the comments associated with the place
      for(var i=0; i < foundPlace.comments.length; i++){
        Comment.findByIdAndRemove(foundPlace.comments[i], function(err){
        });
      }
      //Deleting the place
      Place.findByIdAndRemove(req.params.id, function(err){
        if(err){
          req.flash("error", "Something went wrong!! Try again!");
          res.redirect("/places");
        } else {
          req.flash("success", "Deleted the place successfully");
          res.redirect("/places");
        }
      });
    }
  })
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;