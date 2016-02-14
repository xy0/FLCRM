angular.module("Main")

// the top-most navbar controller
.controller('navCtrl', function ($scope, $rootScope, Page, Log, Cookies){

  $scope.changePage = function (page){
    Page.change(page);
  }

  $scope.resetWorkspace = function(mode) {
    Log(1, "resetWorkspace", mode)
    localStorage.removeItem( 'savedState' );
    window.location.reload();
  }

  $scope.setPref = function(pref, value) {
    if ( pref in $rootScope.Prefs ) {
      Log(1, "setPref", pref + " value: " + value);
      $rootScope.Prefs[pref] = value;
      Cookies.write("Prefs", $rootScope.Prefs);
    } else {
      Log(-1, "setPref", pref + " value: " + value + " No Such Preference");
    }
  }

})

.controller("toggleController", function($scope){
  $scope.showToggle = false;

  $scope.toggle = function(){ 
    $scope.showToggle = !$scope.showToggle;
  }

})

.controller("mainCtrl", function($scope, $rootScope, $timeout, Log){

  $rootScope.Globals.isDataLoaded = true;

  var defaultConfig = {
    content:[
      {
        type: 'row',
        content: [
          {
            width: 20,
            title: 'Main Module',
            type: 'component',
            componentName: 'MyLayoutComponent',
            componentState: {
              module: 'Mods',
              templateId: 'spawnerModule',
              selectedUserIndex: 2
            }
          }
        ]
      }
    ]
  };

   // local storage for saving the layout, if noLocalStorage is set, clear
  // the local storage and use default component
  var savedState = localStorage.getItem( 'savedState' );

  if( savedState !== null && !$rootScope.Prefs.noLocalStorage) {
    var myLayout = new GoldenLayout( JSON.parse( savedState ) );
  } else {
    // localStorage.removeItem( 'savedState' );
    var myLayout = new GoldenLayout( defaultConfig );
  }

  // save current state to localStorage if enabled
  if( !$rootScope.Prefs.noLocalStorage ) {
    myLayout.on( 'stateChanged', function(){
      var state = JSON.stringify( myLayout.toConfig() );
      localStorage.setItem( 'savedState', state );
    });
  }

  var defaultComponent = function( container, state ) {

    var newState = state;
    newState.persistantFields = newState.persistantFields || {};
    var newPersistantFields = newState.persistantFields;

    // if localStorage is enabled
    if( !$rootScope.Prefs.noLocalStorage ) {

      setTimeout(function(){

        //Check for localStorage
        if( !typeof window.localStorage ) {
          Log(-1, "persistantFields", "The browser does not support localStorage.");
          return;
        }
        
        // loop over persistant fields with the same controller 
        $( 'div[ng-controller="'+ newState.templateId +'Ctrl"] .persistantField' ).each( function( index ) {

          // if the field dosn't have an identifier like ng-model
          if(!$(this).attr('ng-model')) {
            Log(0, "persistantField", "No ng-model, adding it");

            // give it a unique ID
            var uniqueID = 'persistantField' + index;
            $(this).attr('ng-model', uniqueID);

          } else {
            var uniqueID = $(this).attr('ng-model') + index;
          }

          // Set the initial / saved state
          if( uniqueID in newPersistantFields ) {
            $(this).val( newPersistantFields[uniqueID] );
          }

          // Store state updates
          $(this).on( 'change', function() {
            Log(1, "persistantFieldSaved", uniqueID);
            newPersistantFields[uniqueID] = $(this).val();
            newState.persistantFields = newPersistantFields;
            container.setState( newState );
          });
        });
      }, 200);
    }

    // Templates are stored in template tags in the DOM.
    var html = $( '#' + newState.templateId ).html(),
        element = container.getElement();

    // Write the template's html into the container
    element.html( html );

    // Inject container and state into the module. If multiple instances of
    // the same module are created this will override the previous module's container
    // and state with the current (correct) 
    if(!!newState.module) {
      angular
        .module( newState.module )
        .value( 'container', container )
        .value( 'state', newState );

      // Actually kick off Angular's magic
      angular.bootstrap( element[ 0 ], [ newState.module ] );
    } else {
      Log(-1,"injectModuleIntoAngular", {state:state, newState:newState});
    }
  };

  myLayout.registerComponent( 'MyLayoutComponent', defaultComponent );
  myLayout.init();

  // functions to call when moving the tab around
  var showOverlay = function() {
  };
  var hideOverlay = function() {
  };
  myLayout.on( 'tabCreated', function( tab ){
    tab._dragListener.on( 'dragStart', function(){ 
      showOverlay();  
    });

    tab._dragListener.on( 'dragStop', function(){ 
      hideOverlay();  
    });
  });

 var defaultModuleConfig = {
    title: "title",
    type: 'component',
    componentName: 'MyLayoutComponent',
    componentState: {
      module: 'Mods'
    }
  };

  // adding new Modules
  var addMenuItem = function( name, config, moduleTitle ) {

    var theConfig = JSON.parse(JSON.stringify(config));

    var element = $( '<li>' + name + '</li>' );
    $( '#menuContainer' ).append( element );

    if(moduleTitle) {
      theConfig.title = moduleTitle;
    }

    theConfig.componentState.templateId = name + "Module";  

    myLayout.createDragSource( element, theConfig );
  };

  addMenuItem( 'spawner', defaultModuleConfig, "Spawner" );
  addMenuItem( 'default', defaultModuleConfig, "Blank" );
  addMenuItem( 'iFramer', defaultModuleConfig, "iFramer" );
  addMenuItem( 'uploader', defaultModuleConfig, "Uploader" );

})

.controller("emptyCtrl", function($scope, $rootScope, $timeout) {

  setTimeout(function(){
    $rootScope.Globals.isDataLoaded = true;
  },500);

})

.controller("staticDemoCtrl", function($scope, $rootScope, $timeout){
  window.scrollTo(0, 0);
  
  $scope.bodyWidth = angular.element(document.querySelector( 'body' ))[0].clientWidth;
  var bodyHeight = angular.element(document.querySelector( 'body' ))[0].clientHeight;

  var footerHeight = angular.element(document.querySelector( '#theFooter' ))[0].clientHeight;
  var boxHeight = angular.element(document.querySelector( '#theStickyBox' ))[0].clientHeight;

  var bodyHeightOffset = bodyHeight-footerHeight-boxHeight;

  fixBoxPosition = function() {
    bodyHeight = angular.element(document.querySelector( 'body' ))[0].clientHeight;
    footerHeight = angular.element(document.querySelector( '#theFooter' ))[0].clientHeight;
    boxHeight = angular.element(document.querySelector( '#theStickyBox' ))[0].clientHeight;
    bodyHeightOffset = bodyHeight-footerHeight-boxHeight;

    var theHeaderHeight = angular.element(document.querySelector( '#theHeader' ))[0].clientHeight;
    var headerMarginOffset = 30;
    var boxMarginOffset = 20;
    var boxWidth = angular.element(document.querySelector( '#theStickyBox' ))[0].clientWidth;

    var contentDivWidth = angular.element(document.querySelector( '#theContainer' ))[0].clientWidth - boxWidth;
    var containerWidth = angular.element(document.querySelector( '#theContainer' ))[0].clientWidth;
    $scope.bodyWidth = angular.element(document.querySelector( 'body' ))[0].clientWidth;
    var offset =  contentDivWidth + ($scope.bodyWidth - containerWidth - boxMarginOffset)/2;
    var scrollOffset = window.pageYOffset;

    if (scrollOffset > theHeaderHeight && scrollOffset < bodyHeightOffset){
      $scope.boxStickyOffset = "position:fixed;top:"+headerMarginOffset+"px;left:"+offset+"px;";
    }else if(scrollOffset >= bodyHeightOffset){
      $scope.boxStickyOffset = "position:relative;top:"+(bodyHeightOffset - headerMarginOffset - footerHeight)+"px;";
    }else{
      $scope.boxStickyOffset = 0;
    }
  }

  window.onscroll = function () {
    $timeout( function(){
      fixBoxPosition();
    },50)
  }

  $scope.$watch('windowWidth', function() {
    $timeout( function(){
      fixBoxPosition();
    },50)
  })

  $scope.$on('$destroy', function() {
      window.onscroll = null;
  })
})

;