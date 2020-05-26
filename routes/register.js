//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

let sendEmail = require('../utilities/utils').sendEmail;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

// Register new user
router.post('/', (req, res) => {
    res.type("application/json");

    //Retrieve data from query params
    var first = req.body['first'];
    var last = req.body['last'];
    var username = req.body['username'];
    var email = req.body['email'];
    var password = req.body['password'];
    //Verify that the caller supplied all the parameters
    if(first && last && username && email && password) {
        //Store password as salted hash for better security practices
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);
        // generate a random string to be used as a verification link
        let verifyLink = crypto.randomBytes(20).toString("hex");
        
        // Use prepared statement to avoid SQL injection attacks
        let params = [first, last, username, email, salted_hash, salt, verifyLink];
        db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt, VerifyLink) VALUES ($1, $2, $3, $4, $5, $6, $7)", params)
        .then(() => {
            //We successfully added the user, let the user's client know
            res.send({
                success: true
            });
            // send registration email to be verified
            img = [{
                filename: 'logo.png',
                path: './assets/logo_light.png',
                cid: 'unique@current.com'
            }]
            sendEmail('Current <' + process.env.MAILER_ADDR + '>', email, "Welcome!", 
                        "<body bgcolor=\"#000066\">" + 
                        "<font color=#ffffff>" +
                        "<table width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr>" +
                        "<td bgcolor=\"#000066\" style=\"padding:30px; text-align: center;\">" +
                        "<img src=\"cid:unique@current.com\"/>" +
                        "<p style=\"text-align: center;\"><strong>Welcome to our Current, the application for staying up to date!</strong></p>" +
                        "<p style=\"text-align: center;\"><strong>Please click <a href=\"" +
                        "https://team3-chatapp-backend.herokuapp.com/verify?account=" + verifyLink + "\">here</a> to verify your account.</strong></p>" +
                        "<p>&nbsp;</p><p style=\"text-align: center;\"><small>Do not reply to this message, this account is not checked for any incoming mail.</small></p>" +
                        "</td></tr></table></font></body>",
                        img);
        }).catch((err) => {
            console.log(err);
            // Error is probably that email or username exists thus insertion was blocked
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        // Incomplete set of information sent
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

module.exports = router;