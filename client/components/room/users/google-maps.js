
Session.setDefault('maps-script-loaded', false);

initMapsAPI = function(){
    Meteor.defer(function(){
        Session.set('maps-script-loaded', true);
    });
};

if(!window.google){
    $.cachedScript( "//maps.googleapis.com/maps/api/js?key=AIzaSyA3CdM0aZAJd_QfZVfgw5hUlbPBuRIcrrQ&callback=initMapsAPI")
        .fail(function( jqxhr, settings, exception ) {
            console('error initializing maps api', exception);
        }
    );
}