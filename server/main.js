
Meteor.methods({
    'resetDB': function(pwd){
        if( pwd !== 'getthestrap' )
            return;
        Files.remove({});
        Messages.remove({});
        Rooms.remove({});
        Users.remove({});
    },
    'getUser': function(room, token){
        return Users.findOne({token: token, room: room});
    },
    'updateUserName': function(room, token, name){
        if( !name || name.trim().length == 0 || Users.findOne({name: name, room: room}))
            return false;
        Users.update({token: token, room: room}, {
            $set:{
                name: name || 'User_'+Random.hexString(6)
            }
        });
        return true;
    },
    'updateUserLoc': function(room, token, pos){
        if( !pos || Users.findOne({token: token, room: room}))
            return false;
        Users.update({token: token, room: room}, {
            $set:{
                geoPos: pos
            }
        });
        return true;
    },
    'removeRoom': function(room, token){
        Rooms.remove({owner: token, _id: room}, function(error){
            if( !error ){
                Messages.remove({room: room});
                Users.remove({room: room});
                Files.remove({room: room});
            }
        });
    },
    'updateRoomName': function(room, token, name){
        if(!name || name.trim().length == 0  || Rooms.findOne({name: name, _id: room}))
            return false;
        Rooms.update({owner: token, _id: room}, {$set:{ name: name || 'Room_'+Random.hexString(6)}});
        return true;
    },
    'isRoomOwner': function(room, token){
        return Rooms.findOne({owner: token, _id: room}) ? true : false;
    },
    'sendMessage': function(doc){
        if( doc.type!='link' && doc.type != 'snapshot' && (!doc.room || !doc.content || doc.content.trim().length == 0))
            return false;
        var user = Users.findOne({token: doc.token, room: doc.room, _id: doc.user});
        if( !user )
            return false;

        Rooms.update({_id:doc.room},{
            $inc : { msgCount : 1}
        });

        doc.createdAt = new Date().valueOf();

        return Messages.insert(doc);
    }
});