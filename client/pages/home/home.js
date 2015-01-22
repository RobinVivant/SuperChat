

Template.home.helpers({
    userName: function(){
        var user = Users.findOne({_id:Session.get('userId')});
        if( user ){
            return user.name;
        }
    },
    roomName: function(){
        return Session.get('roomName');
    }
});

Template.home.events({

});

Template.home.created = function(){

    Tracker.autorun(function(){
        Meteor.subscribe('messages', Session.get('roomId'));
        Meteor.subscribe('room-users', Session.get('roomId'));

        function createUser(){
            Users.insert({
                room: Session.get('roomId'),
                token: localStorage.token
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


