
var localStream;
peerConnections = {};
var lastRoomId = null;

PeerVideos = new Meteor.Collection(null);

PeerVideos.allow({
    insert: function (userId, doc) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc) {
        return true;
    }
});


function saveToDisk(fileUrl, fileName) {

    window.open(fileUrl, 'blank');
    /*

     var a = document.createElement("a");
     a.innerHTML = "Download " + fileName;
     // safari doesn't support this yet
     if (typeof a.download === 'undefined') {
     window.location = fileUrl;
     } else {
     a.href = fileUrl;
     a.download = fileName;
     document.body.appendChild(a);
     }
     return;
     */
}


function centerVideo(){
    $('#myVideo').css('margin-left', -($('#myVideo').width() - $('.videoContainer').width())/2);
}

setInterval(function(){
    for( var i in peerConnections ){
        if( peerConnections[i].connection.iceConnectionState === 'disconnected' ){
            PeerVideos.remove({id: i});
        }else{
            if( PeerVideos.find({id: i}).count() == 0 && peerConnections[i].stream ){
                PeerVideos.insert({
                    id: i,
                    src: URL.createObjectURL(peerConnections[i].stream)
                });
            }
        }
    }
}, 500);

function makeRTCConnection(peerId, initiator) {
    var pc = new RTCPeerConnection({
        iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    });
    pc.onaddstream = function (e) {
        peerConnections[peerId].stream = e.stream;

        PeerVideos.remove({id: peerId});
        PeerVideos.insert({
            id: peerId,
            src: URL.createObjectURL(e.stream)
        });
    };
    pc.onicecandidate = function (e) {
        pc.onicecandidate = null;
        if (!e || !e.candidate) return;
        WebRTCPeersChannel.emit('icecandidate', {
            userToken: localStorage.token,
            roomId: Session.get('roomId'),
            candidate: e.candidate,
            peerId: peerId
        });
    };
    pc.ondatachannel = function (e) {
        if( !peerConnections[peerId].channel )
            peerConnections[peerId].channel = e.channel;
        console.log('poupou');
        var arrayToStoreChunks = [];

        e.channel.onmessage = function (event) {
            var data = JSON.parse(event.data);
            arrayToStoreChunks.push(data.message);
            console.log('received chunk!');
            if (data.last) {
                console.log('saving');
                saveToDisk(arrayToStoreChunks.join(''), data.filename);
                arrayToStoreChunks = [];
            }
        };
    };
    return pc;
}

function sendVideo(elem){
    elem.parent().velocity('stop').velocity({
        properties : {
            scale: 0.5
        }, options:{
            duration: 200,
            loop: 1,
            easing: 'spring'
        }
    });

    var video = elem[0];
    var canvas = document.querySelector('canvas');
    var dim = [elem.width(), elem.height()];

    canvas.width = dim[0];
    canvas.height = dim[1];
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    Session.set('sendingMessage', Session.get('sendingMessage')+1);
    Meteor.call('sendMessage', {
        room : Session.get('roomId'),
        user : Session.get('userId'),
        token : Session.get('userToken'),
        type: 'snapshot',
        content: canvas.toDataURL('image/jpg')
    }, function(ret){
        Session.set('sendingMessage', Session.get('sendingMessage')-1);
    });
}

Template.video.helpers({
    peerVideos: function(){
        return PeerVideos.find();
    }
});

Template.video.events({
    'click .peerVideo' : function(e, tmpl){
        sendVideo($(e.currentTarget).find('video'));
    },
    'click .videoContainer': function(e, tmpl){
        sendVideo($(e.currentTarget).find('video'));
    }
});

Template.video.created = function(){

    $.cachedScript( "//cdn.temasys.com.sg/adapterjs/latest/adapter.min.js")
        .fail(function( jqxhr, settings, exception ) {
            console('error initializing js adapter', exception);
        }
    );
    Meteor.defer(function(){
        var video = document.querySelector("#myVideo");

        navigator.getUserMedia =
            navigator.getUserMedia
            || navigator.webkitGetUserMedia
            || navigator.mozGetUserMedia
            || navigator.msGetUserMedia
            || navigator.oGetUserMedia;

        video.addEventListener('loadedmetadata', function(e){
            centerVideo();
        });

        video.addEventListener('playing', function(e){
            $('.videoContainer').velocity('stop').velocity({
                properties : {
                    scale: 0.5
                }, options:{
                    duration: 200,
                    loop: 1,
                    easing: 'spring'
                }
            });
        });

        if (navigator.getUserMedia) {
            navigator.getUserMedia({
                video: true,
                audio: true
            }, handleVideo, function(e){
                console.log(e);
                handleVideo(null);
            });
        }

        function handleVideo(stream) {
            if(stream){
                localStream = stream;
                video.src = window.URL.createObjectURL(stream);
            }

            Tracker.autorun(function(){
                if( !Session.get('roomId') || !Session.get('userId'))
                    return;

                if( lastRoomId ){
                    WebRTCPeersChannel.emit('leave', {
                        userToken: localStorage.token,
                        roomId: lastRoomId
                    });
                    for( var i in peerConnections){
                        peerConnections[i].connection.close();
                        delete peerConnections[i];
                    }
                    PeerVideos.remove({});
                }

                lastRoomId = Session.get('roomId');

                var peers = Users.find({_id: {$ne: Session.get('userId')}}).fetch();
                for (var i in peers ) {
                    if( peerConnections[peers[i]._id] )
                        continue;
                    var pc = makeRTCConnection(peers[i]._id, true);
                    pc.answererName = peers[i]._id;
                    localStream && pc.addStream(localStream);
                    peerConnections[peers[i]._id] = {
                        connection: pc,
                        channel: pc.createDataChannel("files", {
                            ordered: true,
                            maxRetransmitTime: 3000 // in milliseconds
                        })
                    };
                    (function (connection, id) {
                        connection.createOffer(function (sessionDescription) {
                            connection.setLocalDescription(sessionDescription, function(){
                                WebRTCPeersChannel.emit('offer', {
                                    userToken: localStorage.token,
                                    roomId: Session.get('roomId'),
                                    sessionDescription: sessionDescription,
                                    peerId: id
                                });
                            }, function(){
                                console.log(arguments);
                            });

                        }, function(error){
                            console.log(error);
                        }, {
                            "offerToReceiveAudio":true,
                            "offerToReceiveVideo":true
                        });
                    })(pc, peers[i]._id);

                }
            });

        }

    });


    function isDestinated(message){
        return message.peerId == Session.get('userId') && message.roomId == Session.get('roomId') ;
    }

    WebRTCPeersChannel.on('offer', function(message){
        if( !isDestinated(message))
            return;

        var pc = makeRTCConnection(message.userId, true);
        pc.answererName = message.userId;
        localStream && pc.addStream(localStream);

        peerConnections[message.userId] = {
            connection: pc
        };

        pc.setRemoteDescription(new RTCSessionDescription(message.sessionDescription), function () {
            pc.createAnswer(function (sessionDescription) {
                pc.setLocalDescription(sessionDescription, function(){

                }, function(){
                    console.log(arguments);
                });
                WebRTCPeersChannel.emit('answer', {
                    userToken: localStorage.token,
                    roomId: Session.get('roomId'),
                    sessionDescription: sessionDescription,
                    peerId: message.userId
                });
            }, function(error){
                console.log(error);
            });
        });

    }, function(){

    }, function(){
        console.log(arguments);
    });

    WebRTCPeersChannel.on('answer', function(message){
        if( !isDestinated(message) )
            return;

        peerConnections[message.userId].connection.setRemoteDescription(
            new RTCSessionDescription(message.sessionDescription),
            function(){

            }, function(){
                console.log(arguments);
            }
        );
    });

    WebRTCPeersChannel.on('icecandidate', function(message){
        if( !isDestinated(message)  || !peerConnections[message.userId] )
            return;

        if( !peerConnections[message.userId].channel ) {
            peerConnections[message.userId].channel = peerConnections[message.userId].connection.createDataChannel("files", {
                ordered: true,
                maxRetransmitTime: 3000 // in milliseconds
            });
        }

        peerConnections[message.userId].connection.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.candidate.sdpMLineIndex,
            candidate: message.candidate.candidate
        }), function(){
        }, function(){
            console.log(arguments);
        });

    });

    WebRTCPeersChannel.on('leave', function(message){
        if(  message.roomId != Session.get('roomId') && message.peerId != Session.get('userId') )
            return;

        if( peerConnections[message.userId] ){
            peerConnections[message.userId].connection.close();
            PeerVideos.remove({id: message.userId });
            delete peerConnections[message.userId];
        }

    });

};


