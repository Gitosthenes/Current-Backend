//Get the connection to Heroku Database
let db = require('./sql_conn.js');

//We use this create the SHA256 hash
const crypto = require("crypto");

//nodemailer allows for straightforward email sending
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'Hotmail',
    auth: {
        user:process.env.MAILER_ADDR,
        pass:process.env.MAILER_PASS
    }
});

/**
 * Method for sending emails with HTML content.
 * @param {string} sender the sending email account
 * @param {string} receiver the receiving email account
 * @param {string} subj the email subject
 * @param {string} message the email's message body
 * @param {strring} attachments any attachments to the message
 */
function sendEmail(sender, receiver, subj, message, attachment) {
    var emailSettings = {
        from: sender,
        to: receiver,
        subject: subj,
        html: message,
        attachments: attachment
    }
    transporter.sendMail(emailSettings, (err, info) =>{
        if(err) {
            console.log(err);
        } else {
            console.log("message sent to " + info.response);
        }
    });
  }
  
  /**
   * Method to get a salted hash.
   * We put this in its own method to keep consistency
   * @param {string} pw the password to hash
   * @param {string} salt the salt to use when hashing
   */
  function getHash(pw, salt) {
      return crypto.createHash("sha256").update(pw + salt).digest("hex");
  }

// Needed for push notifications to be used
let messaging = require('./pushy_services.js');
module.exports = { 
    db,
    getHash,
    sendEmail,
    messaging
};