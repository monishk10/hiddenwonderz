// ********************************************************************
// Initializing environment variables
var express 		= require("express"),
	app				= express(),
	bodyParser		= require("body-parser");
// ********************************************************************


// ********************************************************************
// Setting up the environment
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
// ********************************************************************


// ********************************************************************
// Routes
app.get("/", function(req, res){
	res.render("home");
});
// ********************************************************************


// ********************************************************************
// Listening to the server
app.listen(3000 || process.env.PORT, process.env.IP, function(){
   console.log("Hidden Wonderz server started!!!");
});