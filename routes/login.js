//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

let getHash = require('../utilities/utils').getHash;

var router = express.Router();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

//Pull in the JWT module along with environment secret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

router.post('/', (req, res) => {
    let email = req.body['email'];
    let theirPw = req.body['password'];
    let pushyToken = req.body['token'];
    if(email && theirPw && pushyToken) {
        db.one('SELECT MemberID, Firstname, Lastname, Username, Password, Salt, Verification FROM Members WHERE Email=$1', [email])
        .then(row => {
            // Compare stored salted hash to salted hash generated based on input
            let salt = row['salt'];            
            let ourSaltedHash = row['password']; 
            let theirSaltedHash = getHash(theirPw, salt); 
            let wasCorrectPw = ourSaltedHash === theirSaltedHash;

            // Check if user's email has been verified with the service
            let isVerified = row['verification'];

            if (wasCorrectPw && isVerified) {
                let firstname = row['firstname']
                let lastname = row['lastname']
                let username = row['username']
                let userid = row['memberid']
                //Credentials valid, provide JWT
                let token = jwt.sign({username: email},
                    config.secret,
                    { expiresIn: '48h' } // expires in two days, subject to client preferences
                );
                let params = [row['memberid'], pushyToken];
                db.manyOrNone('UPDATE Members SET Token = $2 WHERE MemberID = $1', params)
                .then(row => {
                    res.json({
                        // Return client confirmation, JWT for app use and username
                        success: true,
                        message: 'Authentication successful!!!!',
                        test: undefined,
                        firstname: firstname,
                        lastname: lastname,
                        username: username,
                        memberid: userid,
                        token: token
                    });
                })
                .catch(err => {
                        console.log("error on insert");
                    console.log(err);
                    //some error on pushy token insert. See console logs
                    res.send({
                    success: false 
                    });
                });
            } else if (!isVerified) {
                // Account is not verified, fail to log in but provide explanation
                res.send({
                    success: false,
                    message: 'Not verified'
                });
            } else {
                //Credentials fail to match records
                res.send({
                    success: false 
                });
            }
        })
        //More than one row shouldn't be found, since table has constraint on it
        .catch((err) => {
            //Regardless of problem, don't log in
            res.send({
                success: false,
                message: err
            });
        });
    } else {
        // Incomplete set of information sent
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});

module.exports = router;