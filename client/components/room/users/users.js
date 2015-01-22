
var map;

initMapsAPI = function(){

    navigator.geolocation.getCurrentPosition(function(pos){
        var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

        var mapOptions = {
            zoom: 8,
            center: myLatlng
        }
        map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title:"CACA !"
        });
    });

};

Template.users.helpers({
    users: function(){
        return Users.find({},{
            sort: {name: 1}
        }).fetch();
    },
    showUser: function(){
        var filter = Session.get('userFilter');
        if(!filter)
            return true;
        return this.name.match(filter);
    },
    ifIsCurrentUser: function(){
        if(Session.get('userId') === this._id)
            return "current-user";
    }
});

Template.users.events({

    'keyup .find-user > input': function(e, tmpl){
        Session.set('userFilter', e.currentTarget.value.trim());
    }
});

Template.users.created = function(){
    if(!window.google){
        $.cachedScript( "//maps.googleapis.com/maps/api/js?key=AIzaSyA3CdM0aZAJd_QfZVfgw5hUlbPBuRIcrrQ&callback=initMapsAPI")
            .fail(function( jqxhr, settings, exception ) {
                $( "#map-canvas" ).text("Error while loading map : ");
            });
    }else{
        Meteor.defer(initMapsAPI);
    }
};


