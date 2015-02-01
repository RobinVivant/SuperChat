

Files = new Meteor.Collection('files');

Files.allow({
    insert: function (userId, doc) {
        if( !doc.room || !doc.name || doc.name.trim().length == 0 || !doc.url)
            return false;

        if( !Rooms.findOne({_id:doc.room}) )
            return false;

        doc.createdAt = new Date().valueOf();
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc) {
        return true;
    }
});

if (Meteor.isServer) {

    Files._ensureIndex({room: 1});

    Meteor.publish('files', function(room) {
        return Files.find({room: room}, {
            fields:  {room: 0},
            sort: {createdAt: 1}
        });
    });
}