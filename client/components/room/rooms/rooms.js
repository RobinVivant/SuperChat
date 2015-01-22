

Template.rooms.helpers({
    rooms: function(){
        return Rooms.find({},{
            sort: {name: 1}
        }).fetch();
    }

});

Template.rooms.events({
    'click .room-list > div': function(e, tmpl){
        Session.set('roomId', this._id)
    }
});

Template.rooms.created = function(){

};


