

Template.files.helpers({
    files: function(){
        return Files.find();
    }
});

Template.files.events({

});

Template.files.created = function(){
    Tracker.autorun(function() {
        var room = Rooms.findOne({_id: Session.get('roomId')});
        if (room) {
            Meteor.subscribe('files', Session.get('roomId'));
        }
    });
};


