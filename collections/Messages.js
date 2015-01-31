

Messages = new Meteor.Collection('messages');

Messages.allow({
    insert: function (userId, doc) {

        if( doc.type!='link' && doc.type != 'snapshot' && (!doc.room || !doc.content || doc.content.trim().length == 0))
            return false;
        var user = Users.findOne({token: doc.token, room: doc.room});
        if( !user || doc.token !== user.token )
            return false;

        Rooms.update({_id:doc.room},{
            $inc : { msgCount : 1}
        });
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