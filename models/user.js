var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: String,
	email: {type: String, required: true},
    username: {type: String, required: true},
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: String,
    avatarId: String,
    isAdmin: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);