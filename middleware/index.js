var Place   = require("../models/place");

// all the middleare goes here
var middlewareObj = {};

middlewareObj.checkPlaceOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Place.findById(req.params.id, function(err, foundPlace){
           if(err){
               res.redirect("back");
           }  else {
               // does user own the place?
            if(foundPlace.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                res.redirect("back");
            }
           }
        });
    } else {
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = middlewareObj;