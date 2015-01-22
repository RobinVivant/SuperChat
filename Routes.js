
Router.configure({
    layoutTemplate: 'defaultLayout' ,
    loadingTemplate: 'loading'
});

Router.route('/', function () {
    this.render('home');
    //this.render('loading');
});
