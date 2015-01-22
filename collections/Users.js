

Users = new Meteor.Collection('room_users');

Users.allow({
    insert: function (userId, doc) {
        if(Users.findOne({name: doc.name, room: doc.room}))
            doc.name = 'Ghost_'+Random.hexString(6);
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc) {
        Messages.remove({user: doc._id});
        return true;
    }
});

if (Meteor.isServer) {

    Users._ensureIndex({room: 1, name: 1});

    Meteor.publish('room-users', function(room) {
        return Users.find({room: room}, {
            fields:  {room: 0, token: 0}
        });
    });
}