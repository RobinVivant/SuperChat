
Meteor.methods({
    'resetDB': function(){
        Rooms.remove({});
        Messages.remove({});
        Users.remove({});
        for( var i = 0; i < 20; i++){
            Rooms.insert({
                name: "YOLO Room "+i
            });
        }
    },
    'getUser': function(room, token){
        return Users.findOne({token: token, room: room});
    },
    'removeRoom': function(room, token){
        Messages.remove({room: doc._id});
        Users.remove({room: doc._id});
        return Rooms.remove({token: token, _id: room});
    },
    'updateRoomName': function(room, token, name){
        return Rooms.update({token: token, _id: room}, {$set:{ name: name}});
    }
});