

Users = new Meteor.Collection('room_users');

Users.allow({
    insert: function (userId, doc) {
        if( !doc.room || doc.room.trim().length == 0 )
            return false;
        if( Users.findOne({name: doc.name && doc.name.trim(), room: doc.room}) )
            return false;
        if( doc.name.trim().length == 0 )
            doc.name = 'User_'+Random.hexString(6);

        doc.status = {
            label : 'online',
            video: false
        };

        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return false;
    },
    remove: function (userId, doc) {
        return false;
    }
});

if (Meteor.isServer) {

    Users._ensureIndex({room: 1, token: 1, name: 1});

    Meteor.publish('room-users', function(room) {
        return Users.find({room: room}, {
            fields:  {room: 0, token: 0}
        });
    });
}