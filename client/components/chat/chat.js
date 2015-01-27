
var cacaTimeout;
var loadingChatHistory = false;
var firstElem;

function toJSONLocal (date) {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
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
                    $('.message-list').scrollTop(firstElem.position().top-40);
                    firstElem = null;
                }
                return;
            }
            $('.message-list').scrollTop($('.message-list').prop("scrollHeight"));
        }, 200);
    },
    formatDate: function(timestamp){
        return toJSONLocal(new Date(timestamp));
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
        if($(e.currentTarget).scrollTop() == 0 && !firstElem){
            loadingChatHistory = true;
            firstElem = $(e.currentTarget).children().first();
            Session.set('chatCursorPosition', Session.get('chatCursorPosition')+10 );
        }
    }
});

Template.chat.created = function(){

    Tracker.autorun(function() {
        Session.get('roomId');
        $('.message-list').scrollTop($('.message-list').prop("scrollHeight"));
        Session.set('chatCursorPosition', Math.round($(window).height() / 35));
    });

    Tracker.autorun(function() {
        var room = Rooms.findOne({_id:Session.get('roomId')});
        if( room) {
            Meteor.subscribe('messages', Session.get('roomId'), Math.round(Math.max(0, room.msgCount-Session.get('chatCursorPosition'))), Session.get('chatCursorPosition'), {
                onReady: function () {
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


