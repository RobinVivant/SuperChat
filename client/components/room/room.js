
Session.setDefault('room-view', 'rooms');

Template.room.helpers({
    selectedView: function(){
        return Session.get('room-view');
    },
    tabSelected: function(view){
        if( Session.get('room-view') === view ){
            return 'tab-selected';
        };
    }
});

Template.room.events({
    'click .tab': function(e, tmpl){
        Session.set('room-view', $(e.currentTarget).attr('view'));
    }
});

Template.room.created = function(){

};


