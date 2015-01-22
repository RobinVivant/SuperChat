

Template.home.helpers({
    userName: function(){
        var user = Users.findOne({_id:Session.get('userId')});
        if( user ){
            return user.name;
        }
    },
    roomName: function(){
        return Session.get('roomName');
    },
    visibleIfIsRoomOwner: function(){
        if( !Session.get('isRoomOwner') ){
            return 'display:none;';
        }
    }
});

Template.home.events({
    'keyup .user-name': function(e, tmpl){
        if( e.currentTarget.value.trim().length == 0 || e.keyCode != 8 && e.keyCode != 46 && (e.keyCode < 65 || e.keyCode > 90))
            return;
        Meteor.call('updateUserName', Session.get('roomId'), localStorage.token, e.currentTarget.value.trim(), function(error, result){
            if( !result )
                e.currentTarget.value = Users.findOne({_id:Session.get('userId')}).name;
        });
    },
    'keyup .room-name': function(e, tmpl){
        if( e.currentTarget.value.trim().length == 0 || e.keyCode != 8 && e.keyCode != 46 && (e.keyCode < 65 || e.keyCode > 90))
            return;
        Meteor.call('updateRoomName', Session.get('roomId'), localStorage.token, e.currentTarget.value.trim(), function(error, result){
            if( !result )
                e.currentTarget.value = Rooms.findOne({_id:Session.get('roomId')}).name;
        });
    },
    'click .room-destroy': function(e, tmpl){
        Meteor.call('removeRoom', Session.get('roomId'), localStorage.token, function(error, result){

        });
    }
});

Template.home.created = function(){

    Tracker.autorun(function(){

        Meteor.subscribe('messages', Session.get('roomId'));
        Meteor.subscribe('room-users', Session.get('roomId'));

        Meteor.call('isRoomOwner', Session.get('roomId'), localStorage.token, function(error, result){
            Session.set('isRoomOwner', result);
        });

        function createUser(){
            Users.insert({
                room: Session.get('roomId'),
                token: localStorage.token,
                name: $('.user-name').val()
            }, function(error, id) {
                Session.set('userId', id);
            });
        };

        if( !localStorage.token){
            localStorage.token = Random.hexString(12);
            createUser();
        }else{
            Meteor.call('getUser',  Session.get('roomId'), localStorage.token, function (error, result) {
                if (error || !result) {
                    createUser();
                } else {
                    Session.set('userId', result._id);
                }
            });

        }
        Session.set('userToken', localStorage.token);
    });

    Tracker.autorun(function(){
        var room = Rooms.findOne({_id: Session.get('roomId')});
        if( !room) {
            Session.set("roomId", null);
        }else{
            Session.set('roomName', room.name);
        }
        window.history.replaceState(Session.get('roomName'), Session.get('roomName'), '/'+(Session.get('roomId')||''));
    });
};


