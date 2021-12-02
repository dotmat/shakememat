'use-strict';

var playerSPA = {
    appName: null,
    appURL: null,
    pubnubClient: null,
    usePNSignals: false,
    username: null,
    gameID: null,
    gameStatus:null,
    teamPicked: null,
    getUrlParameter: function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;
    
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
    
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
    },
    generateUUID: function(){
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    },
    stopTime(){
        playerSPA.gameStatus = 'stop';
        $('#debugHTML').html('Game Stop');

    },
    checkForShakeEvent(){
        window.setInterval(playerSPA.shakerToPublish(), 15000);
    },
    shakerToPublish(){
        // Shake sensitivity (a lower number is more)
    var sensitivity = 20;

    // Position variables
    var x1 = 0, y1 = 0, z1 = 0, x2 = 0, y2 = 0, z2 = 0;

    // Listen to motion events and update the position
    window.addEventListener('devicemotion', function (e) {
        x1 = e.accelerationIncludingGravity.x;
        y1 = e.accelerationIncludingGravity.y;
        z1 = e.accelerationIncludingGravity.z;
    }, false);

    // Periodically check the position and fire
    // if the change is greater than the sensitivity
    setInterval(function () {
        var change = Math.abs(x1-x2+y1-y2+z1-z2);

        if (change > sensitivity) {
            // alert('Shake!');
            $('#debugHTML').html('Shake Happened');
            if(playerSPA.gameStatus == 'start'){
                playerSPA.pubnubClient.publish({
                    message: {
                        vote: 1,
                    },
                    channel: playerSPA.gameID+'.'+playerSPA.teamPicked,
                    sendByPost: true, // true to send via post
                    storeInHistory: true, //override default storage options
                });
            }
        }

        // Update new position
        x2 = x1;
        y2 = y1;
        z2 = z1;
    }, 150);
    },
    pickTeam(teamPicked){
        console.log('User Picked '+ teamPicked);
        playerSPA.teamPicked = teamPicked;
        playerSPA.pubnubClient.subscribe({
            channels: [playerSPA.gameID+'.'+playerSPA.teamPicked],
            withPresence: true,
        });

        // Update the Page HTML with the players team pick
        const titleHTML = 'Let\'s go '+ teamPicked+'!';
        $('#pageTitle').html(titleHTML);
        
        const bodyHTML = 'Let\'s Go '+ teamPicked+'!';
        $('#bodyTitle').html(bodyHTML);
        
        // Close the modal 
        $('#pickTeamModal').modal('hide');

        // Launch the request for movement data
        function getAccel(){
            DeviceMotionEvent.requestPermission().then(response => {
                if (response == 'granted') {
                    console.log("accelerometer permission granted");
                }
            });
        }
        getAccel();
    },
    launcher: function(){
        playerSPA.appName = $('meta[name=appName]').attr("content") || 'ShakeMeMat';
        console.log(playerSPA.appName+' is launching!');
        playerSPA.gameID = playerSPA.appName + '.' + $('meta[name=teamA]').attr("content") + '&' + $('meta[name=teamB]').attr("content");
        playerSPA.gameStatus = 'stopped';
        // console.log($('meta[name=pnInit]').attr("content"));
        const pnInitObject = JSON.parse($('meta[name=pnInit]').attr("content"));

        // Launch the PN Client
        playerSPA.pubnubClient = new PubNub(pnInitObject);
        playerSPA.pubnubClient.subscribe({
            channels: [playerSPA.appName+'-admin', playerSPA.gameID],
        });

        // Create Event Listeners for the App
        playerSPA.pubnubClient.addListener({
            status: function(statusEvent) {
                if (statusEvent.category === "PNConnectedCategory") {
                    console.log('Connected Event;', statusEvent);
                    // Write the connected time to localStorage
                    localStorage.setItem('connectedTime', statusEvent.currentTimetoken);
                };
                if (statusEvent.category === "PNReconnectedCategory") {
                    console.log('PubNub Issued a Reconnect Event');
                    // If a reconnection event occurrs check the expiration time of the accessToken
                    // This is done to ensure that if the client has been offline for a few days and the token gets expired make it seamless to get a reconnection event.
                    // if(){
                    //     // Access Token is Valid
                    // } else {
                    //     // Access Token is Invalid
                    //     chatSPA.handleInvalidAccessToken();
                    // };
                };
            },
            message: function(messagePayload) {
                // handle message
                console.log('New message event, here is the object:', messagePayload);

                // Check the message matches the game channel
                if(messagePayload.channel == playerSPA.gameID){
                    if(messagePayload.message.type == "gameStart"){
                        // While the device is vibrating, if a shake is occurring then publish an event.
                        console.log('Lets Start a Game!');
                        $('#debugHTML').html('Game Start');
                        //Start a 30 second timer, if shake is detected in that 30 seconds then send a fire event. 
                        playerSPA.gameStatus = 'start';
                        playerSPA.checkForShakeEvent();
                        setTimeout(playerSPA.stopTime, 30000);
                    }
                    if(messagePayload.message.type == "gameStop"){
                        // When a game stops, prevent and further publishes
                        $('#debugHTML').html('Game Stop');
                    }
                    if(messagePayload.message.type == "reset"){
                        // Resets the game
                    }
                    if(messagePayload.message.type == "reboot"){
                        // Reloads the page
                        location.reload();
                    }
                }
            },
            presence: function(presenceEvent) {
                // handle presence
                console.log('New presence event, here are the details', presenceEvent);
                if(presenceEvent.channel == playerSPA.gameID+'.'+playerSPA.teamPicked){
                    // Use the presence event to update the number of team members. 
                    const presenceHTMLUpdate = presenceEvent.occupancy+' Players In Your Team!';
                    $('#teamMembersPresent').html(presenceHTMLUpdate);
                }
            }
        });

        // Launch the modal that lets the user pick their team
        $('#pickTeamModal').modal('show');
    }

};