//express is the framework we're going to use to handle requests
const express = require('express');

//Create connection to Heroku Database
let db = require('../utilities/utils').db;

var router = express.Router();
const bodyParser = require("body-parser");

//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

// Needed for push messaging
let msg_functions = require('../utilities/utils').messaging;

// Endpoint for creating a new connection request and sending it to the recipient
router.post('/send', (req, res) => {
    res.type("application/json");

    let memberA = req.body['sender'];
    let memberB = req.body['receiver'];
    if(memberA && memberB) {
        db.none("INSERT INTO Contacts (MemberID_A, MemberID_B) VALUES ($1, $2)", [memberA, memberB])
        .then(() => {
            // Connection created, send confirmation to sender and push notification to recipient            
            db.one(`SELECT FirstName, LastName, Username, 
                    CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email" 
                    FROM Members WHERE MemberID = $1`, [memberA])
            .then((row) => {
                let sendername = row['username'];
                let senderinfo = {
                    memberid: memberA, 
                    firstname: row['firstname'], 
                    lastname: row['lastname'], 
                    username: sendername, 
                    email: row['email'],
                    relation: 0,
                    new: true
                }
                db.one("SELECT Token FROM Members WHERE MemberID = $1", [memberB])
                .then((row) => {                    
                    msg_functions.sendToIndividual(row['token'], "conn", senderinfo, sendername);
                    db.one(`SELECT FirstName, LastName, Username, 
                            CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email" 
                            FROM Members WHERE MemberID = $1`, [memberB])
                            .then((row) => {
                            let username = row['username'];
                            let senderinfo = {
                            memberid: memberB, 
                            firstname: row['firstname'], 
                            lastname: row['lastname'], 
                            username: username, 
                            email: row['email'],
                            relation: 0,
                            new: true
                        }
                        db.one("SELECT Token FROM Members WHERE MemberID = $1", [memberA])
                        .then((row) => {                     
                            msg_functions.sendToIndividual(row['token'], "conn", senderinfo, sendername);
                            res.send({
                                success: true
                            });
                        }).catch((err) => {
                            console.log(err);
                            res.send({
                                success: false,
                                error: err
                            });
                        });
                    }).catch((err) => {
                        console.log(err);
                        res.send({
                            success: false,
                            error: err
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                    res.send({
                        success: false,
                        error: err
                    });
                });
            }).catch((err) => {
                console.log(err);
                res.send({
                    success: false,
                    error: err
                });
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
            console.log(err);
        });
    } else {
        res.send({
            success: false,
            error: "Neccessary information not provided"
        });
    }
});

// Endpoint to confirm a connection request from another user
router.post('/confirm', (req, res) => {
    res.type("application/json");

    let memberA = req.body['sender'];
    let memberB = req.body['receiver'];
    let accepted = req.body['accepted'];
    if(memberA && memberB && accepted) {
        if(accepted == 'true') { // Accept the user's friend request
            db.none('UPDATE Contacts SET Verified=1 WHERE MemberID_A=$1 AND MemberID_B=$2', [memberA, memberB])
            .then(() => {
                // Connection confirmed, present success
                db.one(`SELECT FirstName, LastName, Username, 
                            CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email" 
                            FROM Members WHERE MemberID = $1`, [memberA])
                .then((row) => {
                    let sendername = row['username'];
                    let senderinfo = {
                        memberid: memberA, 
                        firstname: row['firstname'], 
                        lastname: row['lastname'], 
                        username: sendername, 
                        email: row['email'],
                        relation: 1,
                        new: true
                    }
                    db.one("SELECT Token FROM Members WHERE MemberID = $1", [memberB])
                    .then((row) => {                     
                        msg_functions.sendToIndividual(row['token'], "conn", senderinfo, sendername);
                        db.one(`SELECT FirstName, LastName, Username, 
                            CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email" 
                            FROM Members WHERE MemberID = $1`, [memberB])
                        .then((row) => {
                            let username = row['username'];
                            let senderinfo = {
                                memberid: memberB, 
                                firstname: row['firstname'], 
                                lastname: row['lastname'], 
                                username: username, 
                                email: row['email'],
                                relation: 1,
                                new: true
                            }
                            db.one("SELECT Token FROM Members WHERE MemberID = $1", [memberA])
                            .then((row) => {                     
                                msg_functions.sendToIndividual(row['token'], "conn", senderinfo, sendername);
                                res.send({
                                    success: true
                                });
                            }).catch((err) => {
                                console.log(err);
                                res.send({
                                    success: false,
                                    error: err
                                });
                            });
                        }).catch((err) => {
                            console.log(err);
                            res.send({
                                success: false,
                                error: err
                            });
                        });  
                    }).catch((err) => {
                        console.log(err);
                        res.send({
                            success: false,
                            error: err
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                    res.send({
                        success: false,
                        error: err
                    });
                });             
            }).catch((err) => {
                res.send({
                success: false,
                    error: err
                });
            });
        } else if(accepted == 'false') { // Deny the user's friend request, delete the request to allow reattempts
            db.none('DELETE FROM Contacts WHERE MemberID_A=$1 AND MemberID_B=$2', [memberA, memberB])
            .then(() => {
                // Connection confirmed, present success
                db.one(`SELECT FirstName, LastName, Username, 
                            CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email" 
                            FROM Members WHERE MemberID = $1`, [memberA])
                .then((row) => {
                    let sendername = row['username'];
                    let senderinfo = {
                        memberid: memberA, 
                        firstname: row['firstname'], 
                        lastname: row['lastname'], 
                        username: sendername, 
                        email: row['email'],
                        relation: 0,
                        new: false
                    }
                    db.one("SELECT Token FROM Members WHERE MemberID = $1", [memberB])
                    .then((row) => {                     
                        msg_functions.sendToIndividual(row['token'], "conn", senderinfo, sendername);
                        db.one(`SELECT FirstName, LastName, Username, 
                            CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email" 
                            FROM Members WHERE MemberID = $1`, [memberB])
                        .then((row) => {
                            let username = row['username'];
                            let senderinfo = {
                                memberid: memberB, 
                                firstname: row['firstname'], 
                                lastname: row['lastname'], 
                                username: username, 
                                email: row['email'],
                                relation: 0,
                                new: false
                            }
                            db.one("SELECT Token FROM Members WHERE MemberID = $1", [memberA])
                            .then((row) => {                     
                                msg_functions.sendToIndividual(row['token'], "conn", senderinfo, sendername);
                                res.send({
                                    success: true
                                });
                            }).catch((err) => {
                                console.log(err);
                                res.send({
                                    success: false,
                                    error: err
                                });
                            });
                        }).catch((err) => {
                            console.log(err);
                            res.send({
                                success: false,
                                error: err
                            });
                        });  
                    }).catch((err) => {
                        console.log(err);
                        res.send({
                            success: false,
                            error: err
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                    res.send({
                        success: false,
                        error: err
                    });
                });             
            }).catch((err) => {
                res.send({
                success: false,
                    error: err
                });
            });
        } else {
            res.send({
                success: false,
                error: 'Neccessary information not provided'
            });
        }
    }
});

// Endpoint to retrieve all user connections involving a given user
router.post('/get', (req, res) => {
    res.type("application/json");

    let memberA = req.body['memberid'];
    if(memberA) {
        // Get all Users' First and Last name, Username, and Email as well as whether the connection is verified or not
        db.manyOrNone(`SELECT DISTINCT MemberID, FirstName, LastName, Username,
                    CASE WHEN (Privacy=0) THEN Email ELSE 'Private Email' END AS "email", 
                    Contacts.Verified, 
                    CASE WHEN (MemberID_A=$1) THEN 1 ELSE 0 END AS "sender"
                    FROM Members 
                    INNER JOIN Contacts ON MemberID = MemberID_B OR MemberID = MemberID_A
                    WHERE MemberID<>$1 AND (MemberID_A=$1 OR MemberID_B=$1)`, [memberA])
        .then(rows => {
            // Provide all connections involving the user, leave categorization to app
            res.send({
                connections: rows
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
            console.log(err);
        });
    } else {
        res.send({
            success: false,
            error: 'Member ID not provided'
        });
    }
});

// Endpoint for searching for a given user based on certain criteria
router.post("/search", (req, res) => {
    res.type("application/json");

    let memberid = req.body['memberid'];
    let fName = req.body['firstname'];
    let lName = req.body['lastname'];
    let username = req.body['username'];
    let email = req.body['email'];
    // Build base query which all requests must involve
    // Uses a subquery to find MemberID for all users that you have some sort of standing connection with to exclude them
    let query = `SELECT MemberID, FirstName, LastName, Username, Email, null AS "Verified", 0 AS "Sender" 
                    FROM Members WHERE MemberID <> $1 AND Verification = 1 AND MemberID NOT IN 
                    (SELECT DISTINCT MemberID FROM Members INNER JOIN Contacts ON MemberID = MemberID_A OR MemberID = MemberID_B 
                        WHERE MemberID <> $1 AND (MemberID_A = $1 OR MemberID_B = $1))
                    AND `;

    // Determine primary criteria, then build query as needed
    if(fName && lName) {
        query += 'LOWER(FirstName) LIKE LOWER($2) AND LOWER(LastName) LIKE LOWER($3) ';
        if(username) {
            query += 'AND LOWER(Username) LIKE LOWER($4) '
        }if(email) {
            query += 'AND LOWER(Email) LIKE LOWER($5)'
        }
        db.manyOrNone(query, 
        [memberid, fName + '%', lName + '%', username + '%', email + '%'])
        .then(rows => {
            res.send({
                users: rows
            });
        }).catch(err => {
            res.send({
                success: false,
                error: err
            });
            console.log(err);
        });

    } else if (username) {
        query += 'LOWER(Username) LIKE LOWER($2) ';
        if(email)
            query += 'AND LOWER(Email) LIKE LOWER($3)';
        db.manyOrNone(query, 
            [memberid, username + '%', email + '%'])
        .then(rows => {
            res.send({
                users: rows
            });
        }).catch(err => {
            res.send({
                success: false,
                error: err
            });
            console.log(err);
        });
    } else if (email) {
        db.manyOrNone(query + 'LOWER(Email) LIKE LOWER($2)', [memberid, email + '%'])
        .then(rows => {
            res.send({
                users: rows
            });
        }).catch(err => {
            res.send({
                success: false,
                error: err
            });
            console.log(err);
        });
    } else {
        res.send({
            success: false,
            error: 'Search information not provided'
        });
    }
});

module.exports = router;