
var cacaTimeout;

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

    }
});

Template.chat.created = function(){

    Tracker.autorun(function() {
        var room = Rooms.findOne({_id:Session.get('roomId')});
        if( room) {
            Meteor.subscribe('messages', Session.get('roomId'), {
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


