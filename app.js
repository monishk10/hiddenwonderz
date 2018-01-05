// ********************************************************************
// Initializing environment variables
var express     	= require("express"),
    app         	= express(),
    bodyParser  	= require("body-parser"),
    mongoose    	= require("mongoose"),
    flash       	= require("connect-flash"),
    passport    	= require("passport"),
    LocalStrategy 	= require("passport-local"),
    methodOverride 	= require("method-override"),
    Place  			= require("./models/place"),
    User        	= require("./models/user");
// ********************************************************************


// ********************************************************************
//requiring routes
var placeRoutes 	= require("./routes/places"),
    indexRoutes     = require("./routes/index");

// ********************************************************************


// ********************************************************************
// Setting up MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASEURL, {useMongoClient: true});
// ********************************************************************


// ********************************************************************
// Setting up the environment
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// ********************************************************************


// ********************************************************************
// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Hidden Wonderz!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// ********************************************************************


// ********************************************************************
// Pass current user info
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});
// ********************************************************************



// ********************************************************************
// Routes
app.use("/", indexRoutes);
app.use("/places", placeRoutes);
// ********************************************************************


// ********************************************************************
// Listening to the server
app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Hidden Wonderz server started!!!");
});