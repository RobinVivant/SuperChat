
Template.home.helpers({
    userName: function(){
        var user = Users.findOne({_id:Session.get('userId')},{reactive: false});
        if( user ){
            return user.name;
        }
    },
    rooms: function(){
        return Rooms.find({}, {
            sort: {name: 1}
        }).fetch();
    },
    roomName: function(){
        return Session.get('roomName');
    }
});

var usernameTimeout, roomTimeout;

Template.home.events({
    'keyup .user-name': function(e, tmpl){
        if( e.currentTarget.value.trim().length == 0 || e.keyCode != 8 && e.keyCode != 46 && (e.keyCode < 65 || e.keyCode > 90))
            return;

        clearTimeout(usernameTimeout);
        usernameTimeout = setTimeout(function(){
            Meteor.call('updateUserName', Session.get('roomId'), localStorage.token, e.currentTarget.value.trim());
        }, 200);
    },
    'keyup .room-name': function(e, tmpl){
        if( e.currentTarget.value.trim().length == 0 || e.keyCode != 8 && e.keyCode != 46 && (e.keyCode < 65 || e.keyCode > 90))
            return;
        clearTimeout(roomTimeout);
        roomTimeout = setTimeout(function() {
            Meteor.call('updateRoomName', Session.get('roomId'), localStorage.token, e.currentTarget.value.trim());
        }, 200);
    },
    'click .room-destroy': function(e, tmpl){
        Meteor.call('removeRoom', Session.get('roomId'), localStorage.token, function(error, result){

        });
    },
    'focus #roomSetting>input': function (e, tmpl) {
        console.log(e);
        $('#roomSetting').addClass('active');
    },
    'click #roomSetting>*': function (e, tmpl) {
        e.stopImmediatePropagation();
    },
    'click #roomList > li': function(e, tmpl) {
        Session.set('roomId', this._id);
    },
    'click': function (e, tmpl) {
        if (e.currentTarget != document.getElementById('roomSetting')) {
            $('#roomSetting').removeClass('active');
        }
    }
});

Session.set('subsReadyCount', 0);
var lastRoomId = Session.get('roomId');

Template.home.created = function(){

    Meteor.defer(function(){
        function doIt(){
            $('.main-container').height($(window).height()-$('.header').height());
        }
        $(window).on('resize', doIt);
        doIt();
    });


    Tracker.autorun(function() {
        Session.set('subsReadyCount', 0);

        Meteor.subscribe('room-users', Session.get('roomId'), {
            onReady: function () {
                Session.set('subsReadyCount', Session.get('subsReadyCount')+1);
            }
        });
    });

    Tracker.autorun(function(){

        if( Session.get('subsReadyCount') < 2 ){
            return;
        }

        Meteor.call('isRoomOwner', Session.get('roomId'), localStorage.token, function(error, result){
            Session.set('isRoomOwner', result);
        });


    });

    Tracker.autorun(function() {
        if (Session.get('subsReadyCount') < 2 || lastRoomId == Session.get('roomId') ) {
            return;
        }

        lastRoomId = Session.get('roomId');

        var previousName = $('.user-name').val();

        function createUser() {
            Users.insert({
                room: Session.get('roomId'),
                token: localStorage.token,
                name: previousName,
                geoPos: {
                    latitude: 0,
                    longitude: 0
                }
            }, function (error, id) {
                Session.set('userId', id);
                navigator.geolocation.getCurrentPosition(function (pos) {
                    Meteor.call('updateUserLoc', Session.get('roomId'), localStorage.token, pos.coords );
                });
            });
        }

        if (!localStorage.token) {
            localStorage.token = Random.hexString(12);
            createUser();
        } else {
            Meteor.call('getUser', Session.get('roomId'), localStorage.token, function (error, result) {
                if (error || !result) {
                    createUser();
                } else {
                    Session.set('userId', result._id);
                    navigator.geolocation.getCurrentPosition(function (pos) {
                        Meteor.call('updateUserLoc', Session.get('roomId'), localStorage.token, pos.coords );
                    });
                }
            });
        }
    });

    Session.set('userToken', localStorage.token);

    Tracker.autorun(function(){
        var room = Rooms.findOne({_id: Session.get('roomId')});
        if( !room) {
            Session.set("roomId", null);
            Session.set('roomName', null);
        }else{
            Session.set('roomName', room.name);
        }
        window.history.replaceState(Session.get('roomName'), Session.get('roomName'), '/'+(Session.get('roomId')||''));
    });
};


