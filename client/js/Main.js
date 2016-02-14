/*                                        FYN 2016 \_|\                                              */
angular.module("Main", ['ui.router', 'ngFileUpload'])

.run( function ($rootScope, $state, Cookies, Log) {

  $rootScope.Globals = {
    siteURL: Window.origin + "/",
    isDataLoaded: false,
    page:'root' || $state.current.name
  }

  if(Cookies.check("Prefs")) {
    // Load Prefrences from Cookie
    Log(1, "prefsCookie", "found");
    $rootScope.Prefs = Cookies.readB64("Prefs");
    Log(1, "prefs", $rootScope.Prefs);
  } else {
    // Default Prefrences
    Log(1, "prefsCookie", "not found");
    $rootScope.Prefs = {
      noLocalStorage: false
    }
  }

  Log(1, "savedState", JSON.parse(localStorage.getItem( "savedState" )));

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
    ;
  $urlRouterProvider.otherwise("/");
  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');
})

;

// create another module for running "modules"... 
angular.module("Mods", [])