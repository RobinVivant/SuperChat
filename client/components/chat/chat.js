

Template.chat.helpers({
    messages: function(){
        return Messages.find({},{
            sort: {createdAt: -1}
        }).fetch();
    },
    userNameFromId: function(id){
        var user = Users.findOne({_id:id});
        if(!user)
            return;
        return user.name;
    }
});

Template.chat.events({
    'keyup .user-message': function(e, tmpl){
        if(e.keyCode === 13){
            Messages.insert({
                room : Session.get('roomId'),
                user : Session.get('userId'),
                token : Session.get('userToken'),
                content: e.currentTarget.value.trim()
            });
            e.currentTarget.value = '';
        }
    }
});

Template.chat.created = function(){

};


