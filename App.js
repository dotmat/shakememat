'use strict';

const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const xmlParser = require('xml2json');
const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');
const mustacheExpress = require('mustache-express');
const cryptr = new Cryptr('ShakeMeMat'); // For some reason the encrpytion string has to be entered here. I've not been able to use an external reference...?
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Config File for the App
const config = require('./config');
const { json } = require('body-parser');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

function generateUUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}


// Handle the admin of a game
app.get('/admin', (request, response) => {
    const requestFormat = request.query.format || 'html'; // Format the user is requesting data in, if blank treat as HTML
    const teamA = request.query.a;
    const teamB = request.query.b;
    const adminUUID = 'admin.'+generateUUID();


    if(requestFormat == 'html'){
        // Treat as HTML request
        const htmlConfigObject = {
            teamA: teamA,
            teamB: teamB,
            uuid: adminUUID,
            pnInit: JSON.stringify({
                subscribeKey: config.subKey,
                publishKey: config.pubKey,
                logVerbosity: true,
                uuid: adminUUID,
                origin: "withlovefrommat.pndsn.com",
                ssl: true,
                restore: true
            })
        };
        response.render('admin', htmlConfigObject);
    } else {
        // Treat as API request
        var responseJSON = {};
        responseJSON.status = 500;
        responseJSON.success = false;
        // Try to get the API key, on fail issue a 404 access fail. 
        try {
            const accessToken = request.header('x-api-key');
        }
        catch(err) {
            console.log('Missing API Key')
            responseJSON.status = 401;
            responseJSON.success = false;
            responseJSON.message = "Missing API key.";
            // Return the Response Object
            response.status(responseJSON.status).json(responseJSON);
        } 
        finally {
            // Do something with the API Request and API key.
            // Return the Response Object
            response.status(responseJSON.status).json(responseJSON);
        }
    }
});

// Players of a game
app.get('/', (request, response) => {
    const requestFormat = request.query.format || 'html'; // Format the user is requesting data in, if blank treat as HTML
    const teamA = request.query.a;
    const teamB = request.query.b;
    const playerUUID = 'player.'+generateUUID();

    const gameID = request.params.gameID || 'NoGame';
    if(requestFormat == 'html'){
        // Treat as HTML request
        // response.sendFile(path.join(__dirname, './public', 'player.html'));
        const htmlConfigObject = {
            teamA: teamA,
            teamB: teamB,
            uuid: playerUUID,
            pnInit: JSON.stringify({
                subscribeKey: config.subKey,
                publishKey: config.pubKey,
                logVerbosity: true,
                uuid: playerUUID,
                origin: "withlovefrommat.pndsn.com",
                ssl: true,
                restore: true
            })
        };
        response.render('player', htmlConfigObject);
    } else {
        // Treat as API request
        var responseJSON = {};
        responseJSON.status = 500;
        responseJSON.success = false;
        // Try to get the API key, on fail issue a 404 access fail. 
        try {
            const accessToken = request.header('x-api-key');
        }
        catch(err) {
            console.log('Missing API Key')
            responseJSON.status = 401;
            responseJSON.success = false;
            responseJSON.message = "Missing API key.";
            // Return the Response Object
            response.status(responseJSON.status).json(responseJSON);
        } 
        finally {
            // Do something with the API Request and API key.
            // Return the Response Object
            response.status(responseJSON.status).json(responseJSON);
        }
    }
});


// Example GET
// If a request is for a GET without any ?format=FORMAT then treat the request as a HTML based request.
// If the request contains a format type ie: ?format=json then scan for the x-api-key header, validate and process the request.
app.get('/', (request, response) => {
    const requestFormat = request.query.format || 'html'; // Format the user is requesting data in, if blank treat as HTML
    if(requestFormat == 'html'){
        // Treat as HTML request
        response.sendFile(path.join(__dirname, './public', 'index.html'));
    } else {
        // Treat as API request
        var responseJSON = {};
        responseJSON.status = 500;
        responseJSON.success = false;
        // Try to get the API key, on fail issue a 404 access fail. 
        try {
            const accessToken = request.header('x-api-key');
        }
        catch(err) {
            console.log('Missing API Key')
            responseJSON.status = 401;
            responseJSON.success = false;
            responseJSON.message = "Missing API key.";
            // Return the Response Object
            response.status(responseJSON.status).json(responseJSON);
        } 
        finally {
            // Do something with the API Request and API key.
            // Return the Response Object
            response.status(responseJSON.status).json(responseJSON);
        }
    }
});

app.listen(config.port, () => console.log(`${config.AppName} App listening on port ${config.port}!`));