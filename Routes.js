
Router.configure({
    layoutTemplate: 'defaultLayout' ,
    loadingTemplate: 'loading'
});

Router.route('home',{
    template: 'home',
    path: '/:roomId?',
    waitOn: function () {
        Session.set("roomId", this.params.roomId);
        var sub = [
            Meteor.subscribe('rooms')
        ];
        return sub;
    }
});
