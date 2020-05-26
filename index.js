//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();
const fs = require('fs');

let middleware = require('./utilities/middleware');

// Login and registration endpoints
app.use("/register", require("./routes/register.js"));
app.use("/login", require("./routes/login.js"));
app.use("/verify", require("./routes/verify.js"));
app.use(express.static('assets'));

// Friend connection endpoint
app.use("/connections", middleware.checkToken, require("./routes/connections.js"));

// Chatting endpoint
app.use("/chat", middleware.checkToken, require("./routes/messaging.js"));

// Weather endpoint
app.use("/weather", require("./routes/weather.js"));

/*
 * Return HTML for the / end point. 
 * Documentation API located at this end point.
 */
app.get("/", (req, res) => {
    fs.readFile('documentation.html', function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

/* 
* Heroku will assign a port you can use via the 'PORT' environment variable
* Alternatively, use a known default port
*/ 
app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});