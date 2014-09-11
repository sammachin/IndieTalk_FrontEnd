var gw = "localhost"
var jid = "talk.1nd13.net"
var connectionUrl = "http://talk.1nd13.net/http-bind"
var password = null;

var host = window.location.hostname;

	Strophe.log = function(level, msg) {
		if (level == 4) {
    		console.log("STROPHE ERROR! " + level + " : " + msg);
    	}
    	console.log("STROPHE " + level + " : " + msg);
	};
	connection = new Strophe.Connection(connectionUrl);
	var xmlSerializer = {};
	if (navigator.appName.indexOf('Internet Explorer') > 0) {
		xmlSerializer.serializeToString = function(body) {
    		return body.xml;
    	};
	} else {
		xmlSerializer = new XMLSerializer();
	}
	connection.xmlInput = function(body) {
		console.log("[WIRE] (i) " + xmlSerializer.serializeToString(body));
	};
	connection.xmlOutput = function(body) {
		console.log("[WIRE] (o) " + xmlSerializer.serializeToString(body));
	};
	connection.connect(jid + "/phono", password, function(status) {
       	if (status == Strophe.Status.CONNECTED) {
       		connection.send($pres().tree());
           	phono.connect();
        };
	});
	var phono = $.phono({
		connectionUrl: connectionUrl,
		gateway: gw,
		connection: connection,
		audio : {
			type: "jsep",
			media: {
      		  audio: true,
			  video: false
		},
    	localContainerId: "localVideo",
    	remoteContainerId: "remoteVideo"
		},
  		onReady: function() {
	    console.log("READY");
		$.ajax({
		    url: 'http://talk.1nd13.net/app/lookup',
		    data: { session: this.sessionId, host: host },
		    type: 'POST',
		    beforeSend: function(xhr){
		       xhr.withCredentials = true;
		    },
			success: function(data){
				if (data == 'OK_GUEST') {
					$("#call").html("Call");
					$("#call").bind("click", call);
					$("#call").removeClass("disabled").addClass("btn-success");
					$("#status").html("Ready");
				}
				else if (data == 'NOT_LOGGED_IN'){
					$("#status").html("Logged Out");
					$("#call").unbind()
					$("#call").removeClass("btn-success").addClass("disabled");
					$("#call").html("");
				}
				else{
					$("#status").html("Waiting for Call");
				}
			},
		});
		setTimeout(function(){location.reload();}, 3600000);
		},
		phone: {
		ringTone: "sounds/Diggztone_Marimba.ogg",
		ringbackTone: "sounds/ringback_uk.ogg",
		onIncomingCall: function(event) {
   			var call = event.call;
			console.log("******INCOMMING CALL*******");
			$.ajax({
			    url: 'http://talk.1nd13.net/app/getcli',
			    data: { session: call.remoteJid},
			    type: 'POST',
			    beforeSend: function(xhr){
			       xhr.withCredentials = true;
			    },
				success: function(data){
					if (data == 'NOT_LOGGED_IN'){
						$("#status").html("Logged Out");
						$("#call").unbind()
						$("#call").removeClass("btn-success").addClass("disabled");
						$("#call").html("");
					}
					else{
						$("#callinfo").html("Call From: " + data);
					}
				},
			});
			$("#status").html("Incomming Call");
   			$("#call").bind("click", function() { return answer(call); });
  			$("#call").removeClass("disabled").addClass("btn-success");		
  			$("#call").html("Answer");
			call.bind({
				onHangup: function() {
					$("#call").unbind()
					$("#call").removeClass("btn-danger").addClass("disabled");
					$("#call").removeClass("btn-sucess").addClass("disabled");
	        		$("#call").html("");
					$("#status").html("Hungup");
					setTimeout(clearStatus,3000);
				}
			})
		},
		}
	});


function call() {
	$.ajax({
	    url: 'http://talk.1nd13.net/app/lookup',
	    type: 'GET',
	    beforeSend: function(xhr){
	       xhr.withCredentials = true;
	    },
		success: function(data){
			if (data == 'NOT_LOGGED_IN'){
				$("#status").html("Logged Out");
				$("#call").unbind()
				$("#call").removeClass("btn-success").addClass("disabled");
				$("#call").html("");
			}
			else{
				var address = 'xmpp:'+data+'/phono';
				console.log(address);
				$("#status").html("Connecting");
				$("#call").unbind()
				$("#call").bind("click", function() { call.hangup(); });
				document.getElementById("call").value="Cancel";
		    	var call = phono.phone.dial(address, {
		    		onRing: function() {
		        		$("#status").html("Ringing");
						$("#call").bind("click", function() { 
							call.hangup();
							$("#call").unbind()
							$("#call").removeClass("btn-danger").addClass("disabled");
							$("#status").html("Hungup");
							setTimeout(resetForNextCall,1500);
						});
						$("#call").removeClass("btn-success").addClass("btn-danger");		
						$("#call").html("Hangup");
		        	},
		        	onAnswer: function() {
		        		$("#status").html("Answered");
						$("#call").removeClass("btn-success").addClass("btn-danger");		
						$("#call").html("Hangup");
		        	},
		        	onHangup: function() {
						$("#call").unbind()
						$("#call").removeClass("btn-danger").addClass("disabled");
						$("#status").html("Hungup");
						setTimeout(resetForNextCall,3000);
		        	}
		    	});
			}
		},
	});
}

function clearStatus(){
	$("#callinfo").html("");
	$("#status").html("Ready");
}

function resetForNextCall(){
	$("#call").html("Call");
	$("#call").bind("click", call);
	$("#call").removeClass("disabled").addClass("btn-success");
	$("#status").html("Ready");
}

function answer(call){
	call.answer();
	$("#status").html("Answered");
	$("#call").unbind()
	$("#call").bind("click", function() {
		call.hangup();
		$("#call").html("")
		$("#call").unbind()
		$("#call").removeClass("btn-danger").addClass("disabled");
		$("#status").html("Hungup");
		setTimeout(clearStatus,1500);
	});
	$("#call").removeClass("btn-success").addClass("btn-danger");		
	$("#call").html("Hangup");
}


