
function centerVideo(){
    $('#myVideo').css('margin-left', -($('#myVideo').width() - $('.videoContainer').width())/2);
}

Template.video.helpers({

});

Template.video.events({
    'click #myVideo': function(){

        $('.videoContainer').velocity('stop').velocity({
            properties : {
                scale: 0.5
            }, options:{
                duration: 200,
                loop: 1,
                easing: 'spring'
            }
        });

        var video = document.querySelector('#myVideo');
        var canvas = document.querySelector('canvas');
        canvas.width = $('#myVideo').width();
        canvas.height = $('#myVideo').height();
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, $('#myVideo').width(), $('#myVideo').height());

        Meteor.call('sendMessage', {
            room : Session.get('roomId'),
            user : Session.get('userId'),
            token : Session.get('userToken'),
            type: 'snapshot',
            content: canvas.toDataURL('image/wbp')
        });
    }
});

Template.video.created = function(){

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

        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: true}, handleVideo, videoError);
        }

        function handleVideo(stream) {
            video.src = window.URL.createObjectURL(stream);
        }

        function videoError(e) {
            console.log(e);
        }

    });

};


