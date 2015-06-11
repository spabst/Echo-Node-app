var myClientName;
var connection;

//check pour firefox (Mozilla). L'appel aux websockets s'écrit différemment
window.WebSocket = window.WebSocket || window.MozWebSocket;

//si le navigateur n'accepte pas les websocket
if (!window.WebSocket) {
      	alert("Il faut utiliser un autre navigateur. Chrome par exemple.");
		
}else{
	//si le navigateur est ok
	//on initialise une connection sur le bon port, et la bonne IP (celle de l'ordinateur qui a le serveur)
	connection = new WebSocket('ws://localhost:1337');
	//on ouvre la connection
	connection.onopen = function(){
		
		connection.send(JSON.stringify({message:'',creatorName:'',type:'connection'}));	
		console.log("connection.onopen " + JSON.stringify({message:'',creatorName:'',type:'connection'}));
	}
	
	connection.onerror = function(error){
		//on alert une erreur
		alert("Il y a un problème avec la connection au serveur. Vérifiez l'IP ou le PORT...");
	}
	
	connection.onmessage = function(message){
		//on vérifie l'état du JSON afin d'éviter des erreurs
		 try {
            var json = JSON.parse(message.data);
        } catch (e) {
            alert("Le fichier JSON semble être mal formé");
			return;
        }
		
		
		console.log("connection.onmessage data: "+ message.data);
		
		switch(json.type){
			case 'Bip':
				var vol = (1 - (json.creatorName  / 5) ); 
				console.log("VOLUME : "+ vol);
				document.getElementById("audio").volume =  vol;
				document.getElementById("audio").play();
			break;
			case 'Init':
				myClientName = json.creatorName;
				//check les players déjà loggé
				var logged = json.message.split(",");
				for(var name in logged){
					if( document.getElementsByName("btn"+logged[name])[0]!=undefined){
				  		document.getElementsByName("btn"+logged[name])[0].disabled = true;
					}
				}
				console.log(myClientName);	
			break;
			case 'activation':
				console.log("activation");
				if(myClientName == json.creatorName){
					console.log("should erase the div")
					document.getElementById("boutons").style.display = 'none';
				}else{
					console.log("should desactivate the button");
					document.getElementsByName("btn"+json.message)[0].disabled = true;	
				}
			break;
			case 'disconnection':
				console.log("déconnection du "+json.message)
				if( document.getElementsByName("btn"+json.message)[0]!=undefined){
					document.getElementsByName("btn"+json.message)[0].disabled = false;
				}
			break;
			case 'setAudioSrc':
				console.log("On modifie la propriété src de l'element audio!");
				document.getElementById('audio').src='js-server/recordings/audio.wav';	
			break;




		}
		
	}
	
}

function setup(val,myClientName){
	// console.log("Is " + val  + " equal to 0? " );
	if(val==0){
		document.getElementById("recordingBox").style.display = "block";
	}
	connection.send(JSON.stringify({message:val,creatorName:String(myClientName),type:'setup'}));	
}