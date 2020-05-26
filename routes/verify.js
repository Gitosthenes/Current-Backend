//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

//Use a filereader to provide the base URL content
const fs = require('fs');

var router = express.Router();

router.get("/", (req, res) => {
    let uniqueLink = req.query['account'];
    if (uniqueLink) {
        //Set verified flag for that user if link exists
        db.none("UPDATE Members SET Verification = 1 WHERE VerifyLink = $1", [uniqueLink])
        .then(() => {
            //Verification complete, present confirmation
            fs.readFile('verifysuccess.html', function(err, data) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                res.end();
            });
        }).catch((err) => {
            console.log(err);
            //Error most likely means account does not exist
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            message: 'Incomplete query'
        });
    }

});

module.exports = router;