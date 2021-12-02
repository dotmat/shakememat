'use-strict';

var adminSPA = {
    appName: null,
    appURL: null,
    pubnubClient: null,
    usePNSignals: false,
    username: null,
    gameID: null,
    gameStatus:null,
    gameStartTimestamp: null,
    teamAID: null,
    teamBID: null,
    teamAVoteCount: null,
    teamBVoteCount: null,
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
    launchTheGame(){
        console.log('Launching the Game.');
        adminSPA.pubnubClient.publish({
            message: {type: 'gameStart'},
            channel: adminSPA.gameID,
            sendByPost: true, // true to send via post
            storeInHistory: true, //override default storage options
        });
        adminSPA.teamAVoteCount = 0;
        adminSPA.teamBVoteCount = 0;
    },
    launcher(){
        adminSPA.appName = $('meta[name=appName]').attr("content") || 'ShakeMeMat';
        console.log(adminSPA.appName+' is launching!');
        adminSPA.gameID = adminSPA.appName + '.' + $('meta[name=teamA]').attr("content") + '&' + $('meta[name=teamB]').attr("content");
        adminSPA.gameStatus = 'stopped';

        $('#pageTitle').html('Administrating Game: '+adminSPA.gameID);
        $('#bodyTitle').html('Administrating Game: '+adminSPA.gameID);

        // Create the PubNub Client
        const pnInitObject = JSON.parse($('meta[name=pnInit]').attr("content"));
        
        const presenceTeamA = adminSPA.gameID+'.'+$('meta[name=teamA]').attr("content");
        const presenceTeamB = adminSPA.gameID+'.'+$('meta[name=teamB]').attr("content");
        adminSPA.teamAID = $('meta[name=teamA]').attr("content");
        adminSPA.teamBID = $('meta[name=teamB]').attr("content");

        // Launch the PN Client
        adminSPA.pubnubClient = new PubNub(pnInitObject);
        adminSPA.pubnubClient.subscribe({
            channels: [adminSPA.appName+'-admin', adminSPA.gameID, presenceTeamA, presenceTeamB],
        });


        // Make a new subscribe presence request for the teams presence channels to get updated presence numbers
        adminSPA.pubnubClient.subscribe({
            channels: [presenceTeamA, presenceTeamB],
            withPresence: true
        });

        // Attach the listener to get message and presence events
        adminSPA.pubnubClient.addListener({
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
                // Work out what kind of message
                if(messagePayload.message.vote){
                    // Work out if the vote is for team A or Team B
                    if(messagePayload.channel == adminSPA.gameID+'.'+adminSPA.teamAID){
                        // Add the vote to the team ID
                        adminSPA.teamAVoteCount = adminSPA.teamAVoteCount + 1;
                        // Update the UI
                        //$('#teamAVotes').html(adminSPA.teamAID+': '+adminSPA.teamAVoteCount);

                        var teamACountHTML = null;
                        if(adminSPA.teamAVoteCount > adminSPA.teamBVoteCount){
                            teamACountHTML = '<button type="button" class="btn btn-success">'+adminSPA.teamAID+': '+adminSPA.teamAVoteCount+'</button>';
                        } else {
                            teamACountHTML = '<button type="button" class="btn btn-danger">'+adminSPA.teamAID+': '+adminSPA.teamAVoteCount+'</button>';
                        }
                        console.log(teamACountHTML);
                        $('#teamAVotes').html(teamACountHTML);
                    }
                    if(messagePayload.channel == adminSPA.gameID+'.'+adminSPA.teamBID){
                        // Add the vote to the team ID
                        adminSPA.teamBVoteCount = adminSPA.teamBVoteCount + 1;
                        // Update the UI
                        // $('#teamBVotes').html(adminSPA.teamBID+': '+adminSPA.teamBVoteCount);
                        var teamBCountHTML = null;
                        if(adminSPA.teamBVoteCount > adminSPA.teamAVoteCount){
                            teamBCountHTML = '<button type="button" class="btn btn-success">'+adminSPA.teamBID+': '+adminSPA.teamBVoteCount+'</button>';
                        } else {
                            teamBCountHTML = '<button type="button" class="btn btn-danger">'+adminSPA.teamBID+': '+adminSPA.teamBVoteCount+'</button>';
                        }
                        $('#teamBVotes').html(teamBCountHTML);
                    }
                }
            },
            presence: function(presenceEvent) {
                // handle presence
                console.log('New presence event, here are the details', presenceEvent);
                // Check if the event is for Team A or B. 
                if(presenceEvent.channel == adminSPA.gameID+'.'+adminSPA.teamAID){
                    console.log('Presence event for Team A')
                    $('#teamAPresence').html('Current players for '+adminSPA.teamAID+' '+(presenceEvent.occupancy -1));
                }
                if(presenceEvent.channel == adminSPA.gameID+'.'+adminSPA.teamBID){
                    console.log('Presence event for Team B')
                    $('#teamBPresence').html('Current players for '+adminSPA.teamBID+' '+(presenceEvent.occupancy -1));
                }
            }
        });

        // Draw the buttons needed to start the next game. 
        const drawLaunchButtonsHTML = '<button type="button" class="btn btn-primary" onclick="adminSPA.launchTheGame(); return false;">Start The Game</button>';
        $('#gameAdminContainer').html(drawLaunchButtonsHTML);

        // 

    }
};
