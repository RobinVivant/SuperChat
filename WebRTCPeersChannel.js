
WebRTCPeersChannel = new Meteor.Stream('peers');

if(Meteor.isServer){

    WebRTCPeersChannel.permissions.write(function(eventName, message) {
        return Users.findOne({token: message.userToken});
    }, false);

    WebRTCPeersChannel.permissions.read(function(eventName) {
        //var userId = this.userId;
        //var subscriptionId = this.subscriptionId;
        //return true to accept and false to deny
        return true;
    });

    WebRTCPeersChannel.addFilter(function(eventName, args) {
        args[0].userId = Users.findOne({token: args[0].userToken, room: args[0].roomId})._id;
        args[0].userToken = undefined;
        return args;
    });
}