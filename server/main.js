
Meteor.methods({
    'resetDB': function(){
        Messages.remove({});
        Users.remove({});
        Rooms.remove({});
    },
    'getUser': function(room, token){
        return Users.findOne({token: token, room: room});
    },
    'updateUserName': function(room, token, name){
        if(Users.findOne({name: name, room: room}))
            return false;
        Users.update({token: token, room: room}, {$set:{ name: name || 'User_'+Random.hexString(6)}});
        return true;
    },
    'removeRoom': function(room, token){
        Messages.remove({room: room});
        Users.remove({room: room});
        Files.remove({room: room});
        Rooms.remove({owner: token, _id: room});
    },
    'updateRoomName': function(room, token, name){
        if(Rooms.findOne({name: name, _id: room}))
            return false;
        Rooms.update({owner: token, _id: room}, {$set:{ name: name || 'Room_'+Random.hexString(6)}});
        return true;
    },
    'isRoomOwner': function(room, token){
        return Rooms.findOne({owner: token, _id: room}) ? true : false;
    }
});