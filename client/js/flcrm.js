/*                                        FYN 2016 \_|\                                              */
angular.module("flcrm", ['ui.router', 'ngFileUpload'])

.constant('LOG_URLs',     [
                            'http://xy0.me/qd'
                          ]
          )

.run( function ($rootScope, $state, Cookies, Log) {

  $rootScope.Prefs = {
    noLocalStorage: false,
    savedWorkspace: false,
    sendLogEvents : true,
  }

  $rootScope.Globals = {
    siteURL       : Window.origin + "/",
    isDataLoaded  : false,
    page          : 'root' || $state.current.name,
    User          : null
  }

  // see if the client has Prefrences cookie and load it into the app
  if( Cookies.check("Prefs") ) {

    // Load Prefrences from Cookie
    $rootScope.Prefs = Cookies.readB64("Prefs");
    Log( 1, "prefsCookie", $rootScope.Prefs);

  } else {

    // Default Prefrences will be used
    Log( 1, "prefsCookie", "not found");

    // set cookie
    Cookies.write("Prefs", $rootScope.Prefs);
  }

  // Log(1, "autoSaveState", JSON.parse(localStorage.getItem( "autoSaveState" )));

})

.config( function ($urlRouterProvider, $stateProvider, $locationProvider, $sceProvider) {
  $sceProvider.enabled(false);
  $stateProvider
    .state('root', {
      url: '/',
      views: {
        'content': {
          templateUrl: 'views/root.html',
          controller: 'mainCtrl'
        }
      }
    })
    .state('demo', {
      url: '/demo',
      views: {
        'navigation': {
          templateUrl: 'views/navigation.html',
          controller: 'navCtrl'
        },
        'content': {
          templateUrl: 'views/demo.html',
          controller: 'emptyCtrl'
        }
      }
    })
    .state('test', {
      url: '/test',
      views: {
        'navigation': {
          templateUrl: 'views/navigation.html',
          controller: 'navCtrl'
        },
        'content': {
          templateUrl: 'views/test.html',
          controller: 'mainCtrl'
        }
      }
    })
    .state('sidebar', {
      url: '/sidebar',
      views: {
        'content': {
          templateUrl: 'views/sidebar.html',
          controller: 'staticDemoCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
  
  // true to use html5 memory mode, not supported on older browsers
  $locationProvider.html5Mode(true);

  // prefix character when not running in html5 mode 
  $locationProvider.hashPrefix('!');
})

;

// create another module for running "modules"... 
angular.module("Mods", [])