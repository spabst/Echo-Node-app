var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');

var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic('.')).listen(8080);

var binaryWebServer = binaryServer({port: 9001});

binaryWebServer.on('connection', function(recorderClient) {
    console.log("new Binary Server connection...");
    var fileWriter = null;

    recorderClient.on('stream', function(stream, meta) {
        console.log("Stream Start")
        var fileName = "recordings/audio.wav"
        fileWriter = new wav.FileWriter(fileName, {
            channels: 1,
            sampleRate: 44100,
            bitDepth: 16
        });

        stream.pipe(fileWriter);
    });

    recorderClient.on('close', function() {
        console.log(fileWriter != null);
        if (fileWriter != null) {
            fileWriter.end();
        }
        console.log("Binary Server Connection Closed");
    });
});



// Serveur Websocket !!
// Ce Serveur est lancé de manière parallèle à l'autre (Binary Web Server)

//definition du port
var webSocketServerPort = 1337;

//chargement de la bibliothèque
var webSocketServer = require('websocket').server;
//definir le protocole
var http = require('http');

//Initialisation du serveur http
var server = http.createServer(function(request, response){});

//Creation d'un tableau de clients
var clients = [];

//Creation d'un tableau ordonné de player
var players = [];

var reproduire = false;



//function déclenchée au lancement du serveur
server.listen(webSocketServerPort, function(){
    console.log("Server is running on port " + webSocketServerPort);
} );

//Initialisation du server websocket (ws)
var wsServer = new webSocketServer({
    httpServer:server
});

/// GESTION PAR LE WS SERVER
wsServer.on('request', function(request){
    var connection = request.accept(null, request.origin);
    console.log("le ws server a reçu une request d'initialisation");
    
    //Gestion des clients
    var date = new Date();
    var clientName = 'client_' + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds();
    var playerId;
    clients[clientName] = connection;
    
    connection.on('message', function(message){
        
        var json = JSON.parse(message.utf8Data);
        
        switch(json.type){
            case 'setup':
                playerId =json.message;
                players[playerId] = clients[json.creatorName];
                console.log("setup: "+ playerId);
                console.log("name: "+ json.creatorName);
                
                for(var name in clients){
                    clients[name].sendUTF(JSON.stringify({message:json.message,creatorName:json.creatorName,type:'activation'}));
                }
                
            break;
            case 'connection':
                console.log("envoie du nom d'utilisateur");
                //check players
                var disabledBtn = ''
                for(var name in players){
                    disabledBtn+=name+',';
                }
                connection.sendUTF(JSON.stringify({message:disabledBtn,creatorName:String(clientName),type:'Init'}));
            break;
            case 'newAudiosrc':
                console.log("envoie du chemin du fichier audio aux clients");
                for(var name in clients){
                    clients[name].sendUTF(JSON.stringify({message:'',creatorName:String(clientName),type:'setAudioSrc'}));
                }
                
                reproduire = true;

            break;
            
        }
        
    });
    
    connection.on('close',function(connection){
        console.log(new Date() + " Peer " + connection.remoteAddress + " disconnected");
        delete players[playerId];
        delete clients[clientName]; 
        
        for(var name in clients){
            clients[name].sendUTF(JSON.stringify({message:playerId,creatorName:'',type:'disconnection'}));
        }
    });
    
});

//sequencer

var timer = setInterval(sendBIP, 1000);


i=0;
function sendBIP() {
    if (reproduire==true) {

        console.log('reproduire : ' + reproduire);
        if(players[i] !=undefined){
            players[i].sendUTF(JSON.stringify({message:'Bip',creatorName:i,type:'Bip'}) );
            console.log("On reproduit sur l'écran : " + i);
            console.log("Players increment : " + players[i]);
        }
        if(i<4){
            i++;
         }else{
            i = 0;
            reproduire = false;
         }
    }
    
}