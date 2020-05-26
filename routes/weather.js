// AERIS API keys
const AREIS_ID = process.env.AERIS_CLIENT_ID;
const AREIS_SECRET = process.env.AERIS_CLIENT_SECRET;

// OpenWeather API Key
const OW_API_KEY = process.env.OW_API_KEY

//express is the framework we're going to use to handle requests
const express = require('express');

//request module is needed to make a request to a web service
const request = require('request');

var router = express.Router();

//Aeris batch request for current weather 10-day & 24hr forecasts for user's current and saved locations.
router.get('/batch', (req, res) => {
    let url = `https://api.aerisapi.com/batch?client_id=${AREIS_ID}&client_secret=${AREIS_SECRET}`;

    let idx = req.originalUrl.indexOf('?') + 1;
    if(idx > 0) { 
        url += '&' + req.originalUrl.substring(idx);
    }

    request(url, function(error, response, body) {
        if(error) { 
            res.send(error);
        } else {
            res.send(body);
        }
    });
});

//OpenWeather OneCall request for current/48hr/7d forecast info
//Incoming requests should be formatted as:
//`https://team3-chatapp-backend.herokuapp.com/weather/{lat}:{long}`
router.get('/:loc', (req, res) => {
    let regex = /(\-?\d+\.?\d*):(\-?\d+\.?\d*)/;
    let lat = req.params.loc.match(regex)[1]
    let lon = req.params.loc.match(regex)[2]
    let append = `&lat=` + lat + '&lon=' + lon;
    let url = `https://api.openweathermap.org/data/2.5/onecall?appid=${OW_API_KEY}` + append;

    request(url, function(error, _, body) {
        if(error) { 
            res.send(error);
        } else {
            res.send(body);
        }
    });
});


router.get('/observations/:loc', (req, res) => {
    let url = `https://api.aerisapi.com/observations/` + req.params.loc + `?client_id=${AREIS_ID}&client_secret=${AREIS_SECRET}`;

    let idx = req.originalUrl.indexOf('?') + 1;
    if(idx > 0) { 
        url += '&' + req.originalUrl.substring(idx);
    }

    request(url, function(error, response, body) {
        if(error) { 
            res.send(error);
        } else {
            res.send(body);
        }
    });
});

router.get('/places/closest', (req, res) => {
    let url = `https://api.aerisapi.com/places/closest?client_id=${AREIS_ID}&client_secret=${AREIS_SECRET}`;

    let idx = req.originalUrl.indexOf('?') + 1;
    if(idx > 0) { 
        url += '&' + req.originalUrl.substring(idx);
    }

    request(url, function(error, response, body) {
        if(error) { 
            res.send(error);
        } else {
            res.send(body);
        }
    });
});

module.exports = router;