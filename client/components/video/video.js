
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
}

function centerVideo(){
    $('#myVideo').css('margin-left', -($('#myVideo').width() - $('.videoContainer').width())/2);
}

function onChannelMessage(channel){
    var arrayToStoreChunks = [];

    channel.onmessage = function (event) {
        var data = JSON.parse(event.data);
        arrayToStoreChunks.push(data.message);
        if (data.last) {
            saveToDisk(arrayToStoreChunks.join(''), data.filename);
            arrayToStoreChunks = [];
        }
    };
}

function makeRTCConnection(peerId) {


    // DTLS/SRTP is preferred on chrome
    // to interop with Firefox
    // which supports them by default

    var pc = new RTCPeerConnection({
        iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    },{
        optional: [{ DtlsSrtpKeyAgreement: true }]
    });

    pc.oniceconnectionstatechange = function(e){
        var state = e.currentTarget.iceConnectionState;
        var user = Users.findOne({_id:peerId});

        if(!user)
            return;

        console.log('Peer '+user.name+' : '+state);

        if( state === 'closed' &&
            (
            !peerConnections[peerId] ||
                (
                peerConnections[peerId] &&
                peerConnections[peerId].connection.localDescription &&
                peerConnections[peerId].connection.localDescription.sdp == pc.localDescription.sdp
                )
            )
        ){
            PeerVideos.remove({id: peerId });
        }else if( state === 'disconnected' && pc.iceConnectionState != 'closed' ){
            pc.close();
        }else if ( state === 'connected' || state === 'completed' ){
            PeerVideos.upsert({
                id: peerId
            },{
                id: peerId,
                src: URL.createObjectURL(peerConnections[peerId].stream)
            });

        }
    };
    pc.onaddstream = function (e) {
        console.log('Received stream from ' + Users.findOne({_id:peerId}).name);
        peerConnections[peerId].stream = e.stream;
        PeerVideos.upsert({
            id: peerId
        },{
            id: peerId,
            src: URL.createObjectURL(e.stream)
        });

    };
    pc.onicecandidate = function (e) {
        pc.onicecandidate = null;
        if (!e || !e.candidate) return;
        console.log('Sending icecandidate to ' + Users.findOne({_id:peerId}).name);
        WebRTCPeersChannel.emit('icecandidate', {
            userToken: localStorage.token,
            roomId: Session.get('roomId'),
            candidate: e.candidate,
            peerId: peerId
        });
    };
    pc.ondatachannel = function (e) {
        console.log('Received channel from ' + Users.findOne({_id:peerId}).name);

        peerConnections[peerId].channel = e.channel;
        onChannelMessage(e.channel);
    };
    return pc;
}

function sendVideo(elem){

    elem.parent().velocity('stop').velocity({
        properties : {
            scale: 0.5
        }, options:{
            duration: 200,
            complete: function(){
                elem.parent().velocity('reverse',{
                    duration: 200,
                    easing: 'spring'
                });
            }
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
    'click .peerVideo video' : function(e, tmpl){
        sendVideo($(e.currentTarget));
    },
    'click .videoContainer': function(e, tmpl){
        sendVideo($(e.currentTarget).find('video'));
    },
    'click .peerVideo a.muted-yes': function (e, tmpl) {
        $('#' + e.currentTarget.dataset.id + '>video')[0].muted = false;
        $('#' + e.currentTarget.dataset.id).removeClass('muted');
    },
    'click .peerVideo a.muted-no': function (e, tmpl) {
        $('#' + e.currentTarget.dataset.id + '>video')[0].muted = true;
        $('#' + e.currentTarget.dataset.id).addClass('muted');
    }
});

Template.video.created = function(){

    $.cachedScript( "//cdn.temasys.com.sg/adapterjs/0.10.x/adapter.debug.js")
        .fail(function( jqxhr, settings, exception ) {
            console('error initializing js adapter', exception);
        }).done(function(){
            onAdapterLoaded();
        });

    function onAdapterLoaded(){

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
                        complete: function(){
                            $('.videoContainer').velocity('reverse',{
                                duration: 200,
                                easing: 'spring'
                            });
                        }
                    }
                });
            });

            if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    video: true,
                    audio: true
                }, function (stream) {
                    if(stream){
                        localStream = stream;
                        video.src = window.URL.createObjectURL(stream);
                        Session.set('resetPeerConnections', true);
                    }
                }, function(e){
                    console.log(e);
                });
            }

        });

        Tracker.autorun(function(){
            if( Session.get('subsReadyCount') < 2 || !Session.get('roomId') || !Session.get('userId')
                || (!Session.get('resetPeerConnections') && lastRoomId == Session.get('roomId')))
                return;

            console.log('Reseting peers...');

            if( lastRoomId ){
                PeerVideos.remove({});
                for( var i in peerConnections){
                    peerConnections[i].connection.iceConnectionState != 'closed' && peerConnections[i].connection.close();
                    delete peerConnections[i];
                }
            }

            lastRoomId = Session.get('roomId');

            var peers = Users.find({_id: {$ne: Session.get('userId')}}).fetch();
            for (var i in peers ) {
                var pc = makeRTCConnection(peers[i]._id, true);
                pc.answererName = peers[i]._id;
                if(localStream)
                    pc.addStream(localStream);
                peerConnections[peers[i]._id] = {
                    connection: pc,
                    channel: pc.createDataChannel("files", {
                        ordered: true,
                        maxRetransmitTime: 3000 // in milliseconds
                    })
                };
                onChannelMessage(peerConnections[peers[i]._id].channel);
                (function (connection, id) {
                    connection.createOffer(function (sessionDescription) {
                        connection.setLocalDescription(sessionDescription, function(){
                            console.log('Sending offer to ' + Users.findOne({_id:id}).name);
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

            Session.set('resetPeerConnections', false);
        });


        function isDestinated(message){
            return message.peerId == Session.get('userId') && message.roomId == Session.get('roomId') ;
        }

        WebRTCPeersChannel.on('offer', function(message){
            if( !isDestinated(message))
                return;

            console.log('Received offer from ' + Users.findOne({_id:message.userId}).name);

            var pc = makeRTCConnection(message.userId, true);
            pc.answererName = message.userId;
            if(localStream)
                pc.addStream(localStream);

            peerConnections[message.userId] = {
                connection: pc
            };

            pc.setRemoteDescription(new RTCSessionDescription(message.sessionDescription), function () {
                pc.createAnswer(function (sessionDescription) {
                    pc.setLocalDescription(sessionDescription, function(){
                        console.log('Sending answer to ' + Users.findOne({_id:message.userId}).name);
                        WebRTCPeersChannel.emit('answer', {
                            userToken: localStorage.token,
                            roomId: Session.get('roomId'),
                            sessionDescription: sessionDescription,
                            peerId: message.userId
                        });
                    }, function(){
                        console.log(arguments);
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

            console.log('Received answer from ' + Users.findOne({_id:message.userId}).name);

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

            console.log('Received icecandidate from ' + Users.findOne({_id:message.userId}).name);

            peerConnections[message.userId].connection.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: message.candidate.sdpMLineIndex,
                candidate: message.candidate.candidate
            }), function(){
            }, function(){
                console.log(arguments);
            });

        });
    }
};


