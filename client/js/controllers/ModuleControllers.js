angular.module("Mods")

.controller('defaultModuleCtrl', function($scope, container, state) {
  $scope.user = state.user || null;
  console.log(state);

  container.layoutManager.eventHub.on( 'userSelected', function( user ){
    $scope.user = user;
    container.extendState({ user: user });
    $scope.$apply();
  });
})

.controller('spawnerModuleCtrl', function($scope, $timeout, container, state) {

  var selectedUser = {};

  //Some demo users
  $scope.users = [
    { name: 'Jackson Turner', street: '217 Tawny End', img: 'men_1.jpg' },
    { name: 'Megan Perry', street: '77 Burning Ramp', img: 'women_1.jpg' },
    { name: 'Ryan Harris', street: '12 Hazy Apple Route', img: 'men_2.jpg' },
    { name: 'Jennifer Edwards', street: '33 Maple Drive', img: 'women_2.jpg' },
    { name: 'Noah Jenkins', street: '423 Indian Pond Cape', img: 'men_3.jpg' }
  ];

  // Change the selected user
  $scope.select = function( user ) {
    selectedUser.isSelected = false;
    user.isSelected = true;
    selectedUser = user;
    container.extendState({ selectedUserIndex: $scope.users.indexOf( user ) });
    container.layoutManager.eventHub.emit( 'userSelected', user );
  };

  // Select the initial user, based on the Component config
  $timeout(function(){
    $scope.select( $scope.users[ state.selectedUserIndex ] );
  });

})

.controller("iFramerModuleCtrl", function($scope, $sce) {

  // change the url of the iframe
  $scope.changeIframeURL = function (url) {

    // add http if link dosn't start with either http or https
    if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
    }
    $scope.iframeURL = $sce.trustAsResourceUrl(url);
  }
  
})

.controller("uploaderModuleCtrl", function($scope) {


})

;