
Session.setDefault('drive-script-loaded', false);

initDriveAPI = function() {
    Meteor.defer(function(){
        Session.set('drive-script-loaded', true);
    });
};

if(!window.gapi){
    $.cachedScript( "https://apis.google.com/js/client.js?onload=initDriveAPI")
        .fail(function( jqxhr, settings, exception ) {
            console('error initializing maps api', exception);
        }
    );
}
