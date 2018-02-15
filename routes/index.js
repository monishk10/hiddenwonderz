var express = require("express");
var router  = express.Router();

//root route
router.get("/", function(req, res){
  res.render("home");
});

//root route
router.get("/aboutMe", function(req, res){
  res.render("aboutme");
});

module.exports = router;