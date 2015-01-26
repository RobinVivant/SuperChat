

Rooms = new Meteor.Collection('rooms');

Rooms.allow({
    insert: function (userId, doc) {
        if( !doc.name || doc.name.trim().length == 0)
            return false;
        if(Rooms.findOne({name: doc.name}))
            return false;
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
        return Rooms.find({},{
            fields:  {_id:1, name:1}
        });
    });
}