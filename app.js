// ********************************************************************
// Initializing environment variables
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    Place  = require("./models/places");
// ********************************************************************


// ********************************************************************
// Setting up MongoDB
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/hidden_wonderz", {useMongoClient: true});
// ********************************************************************


// ********************************************************************
// Setting up the environment
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
//seedDB();
// ********************************************************************


// ********************************************************************
// Routes
// ===================
// HOME PAGE ROUTE
// ===================
app.get("/", function(req, res){
    res.render("home");
});

// ===================
// LOCATION ROUTES
// ===================
//INDEX - show all places
app.get("/places", function(req, res){
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
app.post("/places", function(req, res){
    // get data from form and add to places array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newPlace = {name: name, image: image, description: desc}
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
app.get("/places/new", function(req, res){
   res.render("places/new"); 
});

// SHOW - shows more info about one place
app.get("/places/:id", function(req, res){
    //find the place with provided ID
    Place.findById(req.params.id, function(err, foundPlace){
        if(err){
            console.log(err);
        } else {
            console.log(foundPlace)
            //render show template with that place
            res.render("places/show", {place: foundPlace});
        }
    });
});
// ********************************************************************


// ********************************************************************
// Listening to the server
app.listen(3000 || process.env.PORT, process.env.IP, function(){
   console.log("Hidden Wonderz server started!!!");
});