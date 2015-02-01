

Messages = new Meteor.Collection('messages');

Messages.allow({
    insert: function (userId, doc) {
        return false;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc) {
        return true;
    }
});

if (Meteor.isServer) {

    Messages._ensureIndex({room: 1});

    Meteor.publish('messages', function(room, offset, limit) {
        return Messages.find({room: room}, {
            fields:  {room: 0},
            sort: {createdAt: 1},
            skip: offset,
            limit: limit
        });
    });
}