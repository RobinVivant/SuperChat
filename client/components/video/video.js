
var localStream;
var peerConnections = {};
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


function centerVideo(){
    $('#myVideo').css('margin-left', -($('#myVideo').width() - $('.videoContainer').width())/2);
}

setInterval(function(){
    for( var i in peerConnections ){
        if( peerConnections[i].connection.iceConnectionState === 'disconnected' ){
            PeerVideos.remove({id: i});
        }else{
            if( PeerVideos.find({id: i}).count() == 0 ){
                PeerVideos.insert({
                    id: i,
                    src: URL.createObjectURL(peerConnections[i].stream)
                });
            }
        }
    }
}, 500);

function makeRTCConnection(peerId) {
    var pc = new RTCPeerConnection({
        iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    });
    pc.onaddstream = function (e) {
        peerConnections[peerId].stream = e.stream;

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
    'click video': function(e, tmpl){
        sendVideo($(e.currentTarget));
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
            }, handleVideo, videoError);
        }

        function handleVideo(stream) {
            localStream = stream;
            video.src = window.URL.createObjectURL(stream);

            Tracker.autorun(function(){
                if( !Session.get('roomId'))
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
                    var pc = makeRTCConnection(peers[i]._id);
                    pc.answererName = peers[i]._id;
                    pc.addStream(localStream);
                    peerConnections[peers[i]._id] = {
                        connection: pc
                    };
                    (function (connection, id) {
                        connection.createOffer(function (sessionDescription) {
                            connection.setLocalDescription(sessionDescription);
                            WebRTCPeersChannel.emit('offer', {
                                userToken: localStorage.token,
                                roomId: Session.get('roomId'),
                                sessionDescription: sessionDescription,
                                peerId: id
                            });
                        });
                    })(pc, peers[i]._id);

                }
            });

        }

        function videoError(e) {
            console.log(e);
        }

    });


    function isDestinated(message){
        return message.peerId == Session.get('userId') && message.roomId == Session.get('roomId') ;
    }

    WebRTCPeersChannel.on('offer', function(message){
        if( !isDestinated(message) || !localStream)
            return;

        var pc = makeRTCConnection(message.userId);
        pc.answererName = message.userId;
        pc.addStream(localStream);

        peerConnections[message.userId] = {
            connection: pc
        };

        pc.setRemoteDescription(new RTCSessionDescription(message.sessionDescription), function () {
            pc.createAnswer(function (sessionDescription) {
                pc.setLocalDescription(sessionDescription);
                WebRTCPeersChannel.emit('answer', {
                    userToken: localStorage.token,
                    roomId: Session.get('roomId'),
                    sessionDescription: sessionDescription,
                    peerId: message.userId
                });
            });
        });

    });

    WebRTCPeersChannel.on('answer', function(message){
        if( !isDestinated(message) )
            return;

        peerConnections[message.userId].connection.setRemoteDescription(new RTCSessionDescription(message.sessionDescription));

    });

    WebRTCPeersChannel.on('icecandidate', function(message){
        if( !isDestinated(message)  || !peerConnections[message.userId] )
            return;

        peerConnections[message.userId].connection.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.candidate.sdpMLineIndex,
            candidate: message.candidate.candidate
        }));

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


