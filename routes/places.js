var express = require("express");
var router  = express.Router();
var Place = require("../models/place");
var middleware = require("../middleware");


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
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to places array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newPlace = {name: name, image: image, description: desc, author:author}
    // Create a new place and save to DB
    Place.create(newPlace, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to places page
            res.redirect("/places");
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
router.get("/:id/edit", middleware.checkPlaceOwnership, function(req, res){
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