/*                                        FYN 2016 \_|\                                              */
angular.module( "flcrm", [ 
                            'flcrm.mainServices', 'flcrm.mainControllers', 'flcrm.mainDirectives',
                            'ui.router', 'ngFileUpload', 'btford.socket-io'
                         ])

.constant('LOG_URLs', [
                        'http://xy0.me/qd'
                      ])

.run( function ($rootScope, $state, Cookies, Log, SAPI, qdMsg) {

  console.log('        \\_|\\         ');

  // tweakable values that can be saved to a cookie. If not explicitly saved in the app, these 
  $rootScope.Prefs = {
    noLocalStorage: false,
    savedWorkspace: false,
    sendLogEvents : false,
  }

  // global variables used by various parts of the app
  $rootScope.Globals = {
    siteURL       : Window.origin + "/",
    isDataLoaded  : false,
    page          : 'root' || $state.current.name,
    User          : null
  }

  // see if the client has Prefrences cookie and load it into the app to overwrite the defaults
  if( Cookies.check("Prefs") ) {

    // Load Prefrences from Cookie
    $rootScope.Prefs = Cookies.readB64("Prefs");
    Log( 2, "prefsCookie", "found", $rootScope.Prefs);

  }else{

    // Default Prefrences will be used
    Log( 1, "prefsCookie", "not found");

  }

  console.log('connecting...');
  var msg = qdMsg.format({
    type:  60,
     msg: '~ Connecting to Web Socket...'
  });
  SAPI.emit('qdMsg', {"enc": msg});

  SAPI.on('qdRes', function (res) {
    console.log('server:', res);
  });


  // Log(1, "autoSaveState", JSON.parse(localStorage.getItem( "autoSaveState" )));

})

.config( function ($urlRouterProvider, $stateProvider, $locationProvider, $sceProvider) {

  // sce protects aginst cross site scripting
  $sceProvider.enabled(false);

  // application states
  $stateProvider
    .state('root', {
      url: '/',
      views: {
        'content': {
          templateUrl: 'tpl/root.html',
          controller: 'mainCtrl'
        }
      }
    })
    .state('demo', {
      url: '/demo',
      views: {
        'navigation': {
          templateUrl: 'tpl/navigation.html',
          controller: 'navCtrl'
        },
        'content': {
          templateUrl: 'tpl/demo.html',
          controller: 'emptyCtrl'
        }
      }
    })
    .state('test', {
      url: '/test',
      views: {
        'navigation': {
          templateUrl: 'tpl/navigation.html',
          controller: 'navCtrl'
        },
        'content': {
          templateUrl: 'tpl/test.html',
          controller: 'mainCtrl'
        }
      }
    })
    .state('sidebar', {
      url: '/sidebar',
      views: {
        'content': {
          templateUrl: 'tpl/sidebar.html',
          controller: 'staticDemoCtrl'
        }
      }
    })
  ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise( '/login' );
  
  // true to use html5 memory mode, not supported on older browsers
  $locationProvider.html5Mode( true );

  // prefix character when not running in html5 mode 
  $locationProvider.hashPrefix( '!' );

});

// create another module for running "modules"... 
angular.module("flcrm.moduleControllers", [ 'flcrm.mainServices', 'flcrm.mainDirectives', 
                'btford.socket-io' ])