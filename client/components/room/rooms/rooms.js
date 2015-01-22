

Template.rooms.helpers({
    rooms: function(){
        return Rooms.find({},{
            sort: {name: 1}
        }).fetch();
    },
    ifIsCurrentRoom: function(){
        if(Session.get('roomId') === this._id)
            return "current-room";
    }

});

Template.rooms.events({
    'click .room-list > div': function(e, tmpl){
        Session.set('roomId', this._id)
    },
    'keyup .create-room > input': function(e, tmpl){
        if(e.keyCode == 13){
            Rooms.insert({
                name: e.currentTarget.value.trim(),
                owner: localStorage.token
            }, function(error, id){
                if( !error){
                    Session.set("roomId", id);
                    e.currentTarget.value = '';
                }
            });
        }
    }
});

Template.rooms.created = function(){

};


