/*                                        FYN 2015 \_|\                                              */
angular.module("Main", ['ui.router','ui.bootstrap', 'flow'])

.run(function($rootScope){
  $rootScope.APIADDRESS = Window.origin+"/";
  $rootScope.Globals = {};
  $rootScope.Globals.isDataLoaded = false;
  $rootScope.Globals.page = 'root';
})

.config(function($urlRouterProvider, $stateProvider, $locationProvider, $sceProvider){
  $sceProvider.enabled(false);
  $stateProvider
    .state('root', {
      url: '/',
      views: {
        'navigation': {
          templateUrl: 'views/navigation.html',
          controller: 'navCtrl'
        },
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
          controller: 'mainCtrl'
        }
      }
    })
    .state('minecraft', {
      url: '/minecraft',
      views: {
        'navigation': {
          templateUrl: 'views/navigation.html',
          controller: 'navCtrl'
        },
        'content': {
          templateUrl: 'views/minecraft.html',
          controller: 'mainCtrl'
        }
      }
    })
    ;
  $urlRouterProvider.otherwise("/");
  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');
})

.config(['flowFactoryProvider', function (flowFactoryProvider) {
  flowFactoryProvider.defaults = {
    target: 'q/',
    permanentErrors: [404, 500, 501],
    maxChunkRetries: 2,
    chunkRetryInterval: 5000,
    simultaneousUploads: 4
  }
  flowFactoryProvider.on('catchAll', function (event) {
    console.log('upload', arguments[0]);
  })
}])

;