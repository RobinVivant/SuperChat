

Template.files.helpers({
    files: function(){
        return Files.find();
    },
    showFile: function(){
        var filter = Session.get('fileFilter');
        if(!filter)
            return true;
        return this.name.match(new RegExp(filter, 'i'));
    }
});

Template.files.events({

    'keyup .search-file > input': function(e, tmpl){
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


