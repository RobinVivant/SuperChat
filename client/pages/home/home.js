var roomFieldValue = new ReactiveVar();
var isRoomOwner = new ReactiveVar(false);

Template.home.helpers({
    userName: function(){
        var user = Users.findOne({_id:Session.get('userId')},{reactive: false});
        if( user ){
            return user.name;
        }
    },
    rooms: function(){
        var rooms = Rooms.find({}, {
            sort: {name: 1}
        }).fetch();
        return rooms;
    },
    roomName: function(){
        return Session.get('roomName');
    },
    getRoomFieldValue: function () {
        return roomFieldValue.get();
    },
    getIsRoomOwner: function () {
        return isRoomOwner.get();
    }
    ,createDisabledOrNot: function () {
        var val = roomFieldValue.get();
        if (val == '' || Rooms.find({'name': val}).count()) {
            return 'disabled';
        } 
    },
    renameDisabledOrNot: function () {
        if (!Session.get('roomId') || !isRoomOwner.get() || roomFieldValue.get().length == 0 || roomFieldValue.get() == Rooms.findOne({_id: Session.get('roomId')}).name) {
            return 'disabled';
        }
    }
});

Template.registerHelper('roomHiddenOrNot', function (name) {
    if (roomFieldValue.get().length > 0 && name.indexOf(roomFieldValue.get()) == -1)
        return 'hidden';
});

var usernameTimeout, roomTimeout;

Template.home.events({
    'input .user-name': function(e, tmpl){
        if( e.currentTarget.value.trim().length == 0 || e.keyCode != 8 && e.keyCode != 46 && (e.keyCode < 65 || e.keyCode > 90))
            return;

        clearTimeout(usernameTimeout);
        usernameTimeout = setTimeout(function(){
            Meteor.call('updateUserName', Session.get('roomId'), localStorage.token, e.currentTarget.value.trim());
        }, 200);
    },
    'click #renameRoom': function(e, tmpl){
        console.log(roomFieldValue.get());
        Meteor.call('updateRoomName', Session.get('roomId'), localStorage.token, roomFieldValue.get());
    },
    'click #createRoom': function(e, tmpl) {
        Rooms.insert({name: roomFieldValue.get(), owner: localStorage.token}, function (error, newRoomId) {
            Session.set('roomId', newRoomId);
        });
    },
    'input #roomName, change #roomName': function(e, tmpl) {
        var val = $('#roomName').val();
        roomFieldValue.set(val);
    },
    'click #destroyRoom': function(e, tmpl){
        Meteor.call('removeRoom', Session.get('roomId'), localStorage.token);
        roomFieldValue.set('');
    },
    'focus #roomSetting>input': function (e, tmpl) {
        $('#roomSetting').addClass('active');
    },
    'click #roomSetting>*': function (e, tmpl) {
        e.stopImmediatePropagation();
    },
    'click #roomList > li.room': function(e, tmpl) {
        Session.set('roomId', this._id);
        Session.set('roomName', this.name);
        $('#roomName').val(this.name);
    },
    'click': function (e, tmpl) {
        if (e.currentTarget != document.getElementById('roomSetting')) {
            $('#roomSetting').removeClass('active');
            $('#roomName').val(Session.get('roomName'));
        }
    }
});

Session.set('subsReadyCount', 0);
var lastRoomId = Session.get('roomId');

Template.home.created = function(){

    Meteor.defer(function(){
        function doIt(){
            $('.main-container').height($(window).height()-$('.header').height());
            $('.view').height($(window).height()-$('.header').height()-$('.tabs').height());
        }
        $(window).on('resize', doIt);
        doIt();
    });

    Tracker.autorun(function () {
        Meteor.call('isRoomOwner', Session.get('roomId'), localStorage.token, function (error, result) {
            isRoomOwner.set(result);
        });
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
            roomFieldValue.set(room.name);
        }
        window.history.replaceState(Session.get('roomName'), Session.get('roomName'), '/'+(Session.get('roomId')||''));
    });
};


