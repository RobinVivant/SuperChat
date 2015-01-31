
var cacaTimeout;
var loadingChatHistory = false;
var firstElem;
var allMessagesLoaded = false;
var MINIMUM_CHAT_MESSAGE_HEIGHT = 72;
var CLIENT_ID = '396727141908-tvbl6mq0vdu9opfibl3n18ocokqfn3l9.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

Session.setDefault('fileUploading', false);

function uploadFile(evt, showAuth) {

    gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'scope': SCOPES,
        'immediate': !showAuth
    },function(authResult){
        if(authResult && !authResult.error){
            Session.set('fileUploading', true);
            gapi.client.load('drive', 'v2', function() {
                var file = evt.target.files[0];
                insertFile(file, function(name, url){
                    if(arguments.length ==0){
                        console.log("error uploading file");
                    }else{
                        Files.insert({
                            room: Session.get('roomId'),
                            name: name,
                            url: url,
                            user: Session.get('userId')
                        });
                        Messages.insert({
                            room : Session.get('roomId'),
                            user : Session.get('userId'),
                            token : Session.get('userToken'),
                            type: 'link',
                            linkName: name,
                            linkUrl: url
                        }, function(error, id){
                            if( error )
                                return;
                        });
                    }
                    Session.set('fileUploading', false);
                });
            });
        }else{
            uploadFile(evt, true);
        }
    });
}

function insertFile(fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function(e) {
        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'title': fileData.name,
            'mimeType': contentType
        };

        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        }).execute(function(file) {
            if( file.error ){
                callback && callback();
            }
            gapi.client.drive.permissions.insert({
                'fileId': file.id,
                'resource': {
                    'value': null,
                    'type': "anyone",
                    'role': "reader"
                }
            }).execute(function(resp) {
                if( resp.error ){
                    callback && callback();
                }else{
                    callback && callback(file.title, file.webContentLink.replace("&export=download", ""));
                }
            });
        });
    }
}


function toLocalTime (date) {
    var local = new Date(date);
    //local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.getHours()+':'+local.getMinutes();
}

Template.chat.helpers({
    messages: function(){
        return Messages.find({},{
            sort: {createdAt: 1}
        });
    },
    userNameFromId: function(id){
        var user = Users.findOne({_id:id});
        if(!user)
            return;
        return user.name;
    },
    activeIfIsInRoom: function(){
        if( !Session.get('roomId') ){
            return 'disabled';
        }
    },
    ownsMessage: function(){
        return this.user == Session.get('userId');
    },
    scrollDown: function(){
        clearTimeout(cacaTimeout);
        cacaTimeout = setTimeout(function(){
            if(loadingChatHistory){
                loadingChatHistory = false;
                if( firstElem ){
                    $('.message-list').scrollTop(firstElem.position().top + MINIMUM_CHAT_MESSAGE_HEIGHT);
                    firstElem = null;
                }
            }else{
                $('.message-list').scrollTop($('.message-list').prop("scrollHeight"));
            }
            $('.message-list').velocity('stop').velocity({
                properties:{
                    opacity:[1, 0]
                }, options:{
                    duration: 200
                }
            });

        }, 200);
    },
    formatDate: function(timestamp){
        return toLocalTime(new Date(timestamp));
    },
    isFileUploading: function(){
        return Session.get('fileUploading');
    },
    getContent: function(){
        if( this.type == 'link' ){
            return Spacebars.SafeString('<a href="'+this.linkUrl+'" target="blank">'+this.linkName+'</a>');
        }else{
            return this.content
        }
    }
});

Template.chat.events({
    'keyup .user-message': function(e, tmpl){
        if(e.keyCode === 13){
            Messages.insert({
                room : Session.get('roomId'),
                user : Session.get('userId'),
                token : Session.get('userToken'),
                content: e.currentTarget.value.trim()
            }, function(error, id){
                if( error )
                    return;
            });
            e.currentTarget.value = '';
        }
    },
    'scroll .message-list': function(e, tmpl){
        if($(e.currentTarget).scrollTop() < 10 && !firstElem && !allMessagesLoaded){
            loadingChatHistory = true;
            $('.message-list').velocity('stop').velocity({
                properties: {
                    opacity: [0, 1]
                }, options:{
                    duration: 200
                }
            });
            firstElem = $(e.currentTarget).children().first();
            Session.set('chatCursorPosition', Session.get('chatCursorPosition')+10 );
        }
    },
    'click .fileUploadButton': function(e, tmpl){
        $('#filePicker').trigger('click');
    }
});


Template.chat.created = function(){

    Tracker.autorun(function(){
        if( Session.get('drive-script-loaded') ) {
            Meteor.defer(function() {
                document.getElementById('filePicker').onchange = uploadFile;
            });
        }
    });

    Tracker.autorun(function() {
        Session.get('roomId');
        allMessagesLoaded = false;
        $('.message-list').velocity('stop').velocity({
            properties: {
                opacity: [0, 1]
            }, options:{
                duration: 200
            }
        });
        $('.message-list').scrollTop($('.message-list').prop("scrollHeight"));
        Session.set('chatCursorPosition', Math.round($(window).height() / MINIMUM_CHAT_MESSAGE_HEIGHT));
    });

    Tracker.autorun(function() {
        var room = Rooms.findOne({_id:Session.get('roomId')});
        if( room) {
            Meteor.subscribe('messages', Session.get('roomId'), Math.round(Math.max(0, room.msgCount-Session.get('chatCursorPosition'))), Session.get('chatCursorPosition'), {
                onReady: function () {
                    if( room.msgCount <= Session.get('chatCursorPosition') ){
                        allMessagesLoaded = true;
                    }
                    Session.set('subsReadyCount', Session.get('subsReadyCount') + 1);
                }
            });
        }
    });

    $(document).on('keyup', function(e){
        if(e.keyCode === 13){
            $('.user-message').focus();
            $('.user-message').select();
        }
    });
};


