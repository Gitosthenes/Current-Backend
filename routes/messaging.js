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

// Create a new chat with the given name and description
router.post("/create", (req, res) => {
    let memberID = req.body['memberid'];
    let chatname = req.body['name'];
    let description = req.body['description'];
    if (!memberID || !chatname) {
        res.send({
            success: false,
            error: "memberID or chatName not supplied"
        });
    } else {
        // Give a default description if none provided
        if(!description)
            description = "No description available.";
        // Insert the given chat properties into the database
        db.none("INSERT INTO Chats(Name, Description) VALUES($1, $2)", [chatname, description])
        .then(() => {
            // Automatically add the creator to the chat
            db.one("SELECT ChatId FROM Chats WHERE Name = $1", [chatname])
            .then((row) => {
                let chatId = row['chatid'];
                db.none("INSERT INTO ChatMembers(ChatId, MemberId) VALUES($1, $2)", [chatId, memberID])
                .then(() => {
                    // Push the new chat to the creator
                    let chatinfo = {
                        chatid: chatId,
                        name: chatname,
                        description: description,
                        new: true
                    }
                    db.one(`SELECT Username, Token FROM Members WHERE MemberID = $1`, [memberID])
                    .then((row) => {
                        msg_functions.sendToIndividual(row['token'], "convo", chatinfo, row['username']);
                        res.send({
                            success: true,
                            chatid: chatId
                        });
                    })
                    .catch(err => {
                        console.log("error on PUSH ChatMembers");
                        console.log(err);
                        res.send({
                            success:false,
                            error:"Could not create chat"
                        });
                    });
                })
                .catch(err => {
                    console.log("error on INSERT ChatMembers");
                    console.log(err);
                    res.send({
                        success:false,
                        error:"Could not create chat"
                    });
                });
            })
            .catch(err => {
                console.log("error on SELECT Chat");
                console.log(err);
                res.send({
                    success:false,
                    error:"Could not create chat"
                });
            });
        }).catch(err => {
            // Probably means duplicate name being used
            console.log("error on INSERT Chat");
            console.log(err);
            res.send({
                success:false,
                error:"Chat already exists"
            });
        });
    }
});

// Invite set of users to a chat
router.post("/invite", (req, res) => {
    let sender = req.body['sender'];
    let invitees = req.body['invitees'];
    let chatId = req.body['chatid'];
    if(!sender || !invitees || !chatId) {
        res.send({
            success:false,
            error:"sender, invitees, or chatId not supplied"
        });
    } else {
        invitees.forEach((receiver) => {
            db.one(`INSERT INTO ChatMembers (ChatId, MemberId) 
                    (SELECT $1 as ChatID, $2 as MemberId 
                    WHERE NOT EXISTS (SELECT * FROM ChatMembers WHERE ChatId = $1 AND MemberId = $2))
                    RETURNING *`, [chatId, receiver])
            .then(() => {
                // Get chat info to send to invitee
                db.one(`SELECT * FROM Chats WHERE ChatID = $1`, [chatId])
                .then((row) => {
                    let chatinfo = {
                        chatid: row['chatid'],
                        name: row['name'],
                        description: row['description'],
                        new: true
                    }
                    db.one(`SELECT Username FROM Members WHERE MemberID = $1`, [sender])
                    .then((row) => {
                        let senderName = row['username'];
                        db.one(`SELECT Token FROM Members WHERE MemberID = $1`, [receiver])
                        .then((row) => {
                            msg_functions.sendToIndividual(row['token'], "convo", chatinfo, senderName);
                        })
                        .catch(err => {
                            console.log("error in invite");
                            console.log(err);
                            res.send({
                                success:false,
                                error:"Could not push new chat"
                            });
                        }); 
                    })
                    .catch(err => {
                        console.log("error in invite");
                        console.log(err);
                        res.send({
                            success:false,
                            error:"Could not get sender's username"
                        });
                    }); 
                })
                .catch(err => {
                    console.log("error in invite");
                    console.log(err);
                    res.send({
                        success:false,
                        error:"Could not get chat info for user"
                    });
                });           
            })
            // Error probably means duplicate invitation, and thus no return
            .catch(err => {
                console.log("error in invite initial insertion");
                console.log(err);
            });
        });
        res.send({
            success: true
        });
    }
});

// Leave a given chat
router.post("/leave", (req, res) => {
    let memberID = req.body['memberid'];
    let chatID = req.body['chatid'];
    if (!memberID || !chatID) {
        res.send({
            success: false,
            error: "MemberID or ChatID not provided"
        });
    } else {
        db.none(`DELETE FROM ChatMembers WHERE MemberID = $1 AND ChatID = $2`, [memberID, chatID])
        .then(() => {
            db.one(`SELECT * FROM Chats WHERE ChatID = $1`, [chatID])
            .then((row) => {
                let chatinfo = {
                    chatid: row['chatid'],
                    name: row['name'],
                    description: row['description'],
                    new: false
                }
                db.one(`SELECT Username, Token FROM Members WHERE MemberID = $1`, [memberID])
                .then((row) => {
                    msg_functions.sendToIndividual(row['token'], "convo", chatinfo, row['username']);
                    res.send({
                        success: true
                    });
                })
                .catch(err => {
                    console.log("error in leave");
                    console.log(err);
                    res.send({
                        success:false,
                        error:"Could not push leaving chat"
                    });
                });
            })
            .catch(err => {
                console.log("error in leave");
                console.log(err);
                res.send({
                    success:false,
                    error:"Could not push leaving chat"
                });
            });
        })
        .catch(err => {
            console.log("error in leave");
            console.log(err);
            res.send({
                success:false,
                error:"Could not leave chat"
            });
        });
    }

})

// Retrieve all chats for a given user
router.post("/getchats", (req, res) => {
    let memberId = req.body['memberid'];
    if(!memberId) {
        res.send({
            success:false,
            error:"memberid not provided"
        });
    } else {
        db.manyOrNone("SELECT * FROM Chats WHERE ChatID in (SELECT ChatId FROM ChatMembers WHERE MemberID = $1)", [memberId])
        .then((rows) => {
            res.send({
                chats:rows
            });
        })
        .catch((err) => {
            console.log("error in chatid retrieve");
            console.log(err);
            res.send({
                success:false,
                error:"Could not retrieve chats"
            });
        });
    }
});

//send a message to all users "in" the chat session with chatId
router.post("/send", (req, res) => {
    let memberID = req.body['memberid'];
    let message = req.body['message'];
    let chatId = req.body['chatid'];
    if(!memberID || !message || !chatId) {
        res.send({
            success: false,
            error: "memberid, message, or chatId not supplied"
        });
        return;
    }
    let username;
    db.one('SELECT Username FROM Members WHERE MemberID = $1', [memberID])
    .then((row) => {
        username = row['username'];
    })
    .catch((err) => {
        res.send({
            success: false,
            error: err,
        });
    });
    //add the message to the database
    let insert = `INSERT INTO Messages(ChatId, Message, MemberId) 
                  VALUES ($1, $2, $3) RETURNING TimeStamp`
    db.one(insert, [chatId, message, memberID])
    .then((row) => {
        let time = row['timestamp'];
        //send a notification of this message to all members in the given chat
        db.manyOrNone('SELECT Token FROM Members WHERE MemberId IN (SELECT MemberId FROM ChatMembers WHERE ChatId = $1)', [chatId])
        .then(rows => {
            rows.forEach(element => {
                msg_functions.sendToIndividual(element['token'], "msg", {memberid: memberID, room: chatId, text: message, stamp: time}, username);
            });
            res.send({
                success: true
            });
        }).catch(err => {
            console.log(err);
            res.send({
                success: false,
                error: err,
            });
        })
    }).catch((err) => {
        console.log(err);
        res.send({
            success: false,
            error: err,
        });
    });
});

// Retrieve all messages from a chat session with given chatid
router.post("/getchatcontent", (req, res) => {
    let chatId = req.body['chatid'];
    
    let query = `SELECT Members.Username, Members.MemberID, Messages.Message, 
                 to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US') AS Timestamp 
                 FROM Messages 
                 INNER JOIN Members ON Messages.MemberId=Members.MemberId
                 WHERE ChatId=$1 
                 ORDER BY Timestamp DESC`
    db.manyOrNone(query, [chatId])
    .then((rows) => {
        res.send({
            messages: rows
        })
    }).catch((err) => {
        res.send({
            success: false,
            error: err
        })
    });
});
module.exports = router;