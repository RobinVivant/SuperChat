

Rooms = new Meteor.Collection('rooms');

Rooms.allow({
    insert: function (userId, doc) {
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

    Rooms._ensureIndex({_id: 1});

    Meteor.publish('rooms', function() {
        return Rooms.find({},{_id:1, name:1});
    });
}