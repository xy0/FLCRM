angular.module("Main")

.controller("navCtrl", function($scope, $rootScope, $state){

  $scope.changePage = function(page){
    if(!$rootScope.Globals.page == page){
      $rootScope.Globals.isDataLoaded = false;
    }
    $rootScope.Globals.page = page;
    $state.go(page);
    console.log("Page:",page);
  }

})

.controller("toggleController", function($scope){
  $scope.showToggle = false;

  $scope.toggle = function(){ 
    $scope.showToggle = !$scope.showToggle;
  }

})

.controller('dragCtrl',['$scope',function($scope){
  // variables
  var obj = {
    id: null,
    content: null,
    group: null
  };
  
  $scope.obj = angular.copy(obj);
  
  // listeners
  
  $scope.$on('drag.started',function(evt,data){
    if(angular.isDefined(data.obj))
      $scope.obj = data.obj;
  });
  
  $scope.$on('drag.stopped',function(evt,data){
    $scope.obj = angular.copy(obj); // reset controller's object
  });
}]) 

.controller("mainCtrl", function($scope, $rootScope){
  window.scrollTo(0, 0);
  
  $("#myModal").draggable({
      handle: ".modal-header"
  });


  $("#myModal2").draggable({
      handle: ".modal-header"
  });


})

;