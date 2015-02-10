

Template.files.helpers({
    files: function(){
        return Files.find();
    },
    showFile: function(){
        var filter = Session.get('fileFilter');
        if(!filter || filter.trim().length == 0)
            return true;
        return (Users.findOne({_id: this.user}).name+" "+this.name).match(new RegExp(filter, 'i'));
    },
    getUserName: function(){
        return Users.findOne({_id: this.user}).name;
    }
});

Template.files.events({

    'input .search-file > input': function(e, tmpl){
        Session.set('fileFilter', e.currentTarget.value.trim());
    }
});

Template.files.created = function(){
    Tracker.autorun(function() {
        var room = Rooms.findOne({_id: Session.get('roomId')});
        if (room) {
            Meteor.subscribe('files', Session.get('roomId'));
        }
    });
};


