

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
    },
    activeIfIsInRoom: function(){
        if( !Session.get('roomId') ){
            return 'disabled';
        }
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

    $(document).on('keyup', function(e){
        if(e.keyCode === 13){
            $('.user-message').focus();
            $('.user-message').select();
        }
    });
};


