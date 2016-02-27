angular.module("flcrm.mainDirectives", [])

.directive('loadingAnimation', function($timeout, $interval, $rootScope){
  return {
    restrict: 'E',
    template: '<span class="loading-animation noselect" data-ng-bind-html="loadIcons"></span>',
    scope: {
      loaded: '='
    },
    link: function(scope, $element, $attributes){
      dspAscii = function(num){
        scope.loadIcons = "&#"+num+";";
      }
      var loadIconAnimation = $interval(function(){
        dspAscii(Math.floor(Math.random()*90)+33);
      }, 50);
      scope.$watch("loaded", function(loaded){
        if(loaded){
          $interval.cancel(loadIconAnimation);
        }
      });
      $timeout(function(){
        $interval.cancel(loadIconAnimation);
      },60000);
    }
  }
})

.directive('expandingTextArea', function() {
  return {
    restrict: 'E',
    template: '<div class="expandingArea"><pre><span></span><br></pre><textarea ng-model="textData"></textarea></div>',
    scope: {
      content: '='
    },
    link: function($scope, $element, $attributes){
      $element.bind("keydown keypress", function (event) {
        if(event.which === 13 && !event.shiftKey) {
          $scope.$apply(function (){
            $scope.content = $scope.textData;
            $scope.textData = '';
          });
          event.preventDefault();
        }
      });
      function makeExpandingArea(container) {
        var area = container.querySelector('textarea');
        var span = container.querySelector('span');
        if (area.addEventListener) {
          area.addEventListener('input', function() {
            span.textContent = area.value;
          }, false);
          span.textContent = area.value;
        } else if (area.attachEvent) {
          area.attachEvent('onpropertychange', function() {
            span.innerText = area.value;
          });
          span.innerText = area.value;
        }
        container.className += " active";
      }
      setTimeout(function(){
        var areas = document.querySelectorAll('.expandingArea');
        var l = areas.length;while (l--) {
          makeExpandingArea(areas[l]);
        }
      },0)
    }
  }
})

.directive('chat', function($rootScope, API) {
  return {
    restrict: 'E',
    template: '<expanding-text-area content="newMessage"/>'
            + '<span> {{response}} </span>'
            + '<div ng-repeat = "message in messages">'
            + '  <span> {{ message.sender }}: {{ message.content }} </span>'
            + '</div>'
    ,
    scope: {
      update: '@'
    },
    link: function($scope, $element, $attributes){

      $scope.messages = [ {content: "asdf", sender: "cy"}, {content: "1234"} ]

      $scope.$watch('newMessage', function (newMessage) {
        if(newMessage){
          var message = {
            content: newMessage,
            sender: 'cytest'
          }
          $scope.messages.push(message);
          $scope.newMessage = false;
        }
      })

    }
  }
})

.directive('load', function($rootScope, API) {
  return {
    restrict: 'E',
    template: '<span data-ng-bind-html="content"></span>',
    scope: {
      effect: '@',
      item:   '@',
      source: '@',
      update: '@'
    },
    link: function($scope, $element, $attributes){
      $scope.content = "";
      var uniquePromiseID = 0;
      var loadData = function(){
        API.request(dataSource, 'get', false, dataSource+'-loader-'+uniquePromiseID).then(function(res){
          $rootScope.Globals.isDataLoaded = true;
          if(!!$scope.source){
            var data = res.replace(/\n/g, '<br><br>');
          } else {
            var data = res[$scope.item];
          }

          function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }

          switch($scope.effect){
            case 'type'   : 
                            var letter = 0;
                            var interval = setInterval(function(){ 
                              $scope.content = $scope.content+data[letter];
                              letter = letter+1; 
                              if(letter >= data.length) clearInterval(interval);
                            }, 20);
                            break;
            case 'glitch' :
                            var incrementer = 0;
                            var interval = setInterval(function(){ 
                              var effectArray = [];
                              var glitchState = false;
                              var content = "";
                              for(var l = data.length; l >= 0; l = l-1){
                                if(getRandomInt(0,(data.length * .1)+incrementer) != 0){
                                  effectArray.push(glitchState);
                                } else {
                                  glitchState = !glitchState;
                                  effectArray.push(glitchState);
                                }
                                if(l == 0){
                                  for(var l2 = 0; l2 < data.length-1; l2 = l2+1){
                                    if(effectArray[l2]){
                                      if(glitchState){
                                        content = content+"<span class='iofx1'>"+data[l2]+"</span>";
                                      } else {
                                        content = content+"<span class='iofx2'>"+data[l2]+"</span>";
                                      }
                                    } else {
                                      content = content+data[l2];
                                    }
                                    if (l2 == data.length-2){
                                      $scope.content = content;
                                      incrementer = incrementer+data.length * .15;
                                    }
                                  }
                                }
                              }
                              if(effectArray.indexOf(true) == -1) clearInterval(interval);
                            }, 40);
                            break;
            default:
              $scope.content = data;
          }
        })
      }

      if(!!$scope.source){
        if($scope.source.indexOf('http') == 0){
          var dataSource = $scope.source;
        } else {
          var dataSource = '../../data/'+$scope.source;
        }
      } else {
        var dataSource = '../../data/'+$rootScope.Globals.page+'.js';
      }
      if(!!$scope.update){
        loadData();
        var interval = setInterval(function(){
          uniquePromiseID = uniquePromiseID + 1;
          loadData();
        }, $scope.update * 1000)
      } else {
        loadData();
      }
    }
  }
})

.directive('charLimit', function(){
  return {
    restrict: 'A',
    link: function($scope, $element, $attributes){
      var limit = $attributes.charLimit;
      $element.bind('keyup', function(event){
        var element = $element.parent().parent();
        element.toggleClass('warning', limit - $element.val().length <= 10);
        element.toggleClass('error', $element.val().length > limit);
      })
      $element.bind('keypress', function(event){
        // Once the limit has been met or exceeded, prevent all keypresses from working
        if ($element.val().length >= limit){
          // Except backspace
          if (event.keyCode != 8){
            event.preventDefault();
          }
        }
      })
    }
  }
})

.directive('monitorWindowSize', function ($window) {
  return function (scope, element) {
    var w = angular.element($window);
    scope.getWindowDimensions = function () {
      return w.width();
    }
    scope.$watch(scope.getWindowDimensions, function (newValue) {
      scope.windowWidth = newValue;
      return newValue
    })
    w.bind('resize', function () {
      scope.$apply();
    })
  }
})

.directive('checkStrength', function () {
  return {
    replace: false,
    restrict: 'EACM',
    link: function (scope, iElement, iAttrs) {
      var strength = {
        colors: ['#F00', '#F90', '#FF0', '#9F0', '#0F0'],
        mesureStrength: function (p) {
          var _force = 0;
          var _regex = /[$-/:-?{-~!^_`\[\]]/g;
          var _lowerLetters = /[a-z]+/.test(p);
          var _upperLetters = /[A-Z]+/.test(p);
          var _numbers = /[0-9]+/.test(p);
          var _symbols = _regex.test(p);
          var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];
          var _passedMatches = $.grep(_flags, function (el) { return el === true; }).length;
          _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
          _force += _passedMatches * 10;
          _force = (p.length <= 6) ? Math.min(_force, 10) : _force;
          _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
          _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
          _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;
          return _force;
        },
        getColor: function (s) {
          var idx = 0;
          if (s <= 10) { idx = 0; }
          else if (s <= 20) { idx = 1; }
          else if (s <= 30) { idx = 2; }
          else if (s <= 40) { idx = 3; }
          else { idx = 4; }
          scope.pwStrength = idx;
          return { idx: idx + 1, col: this.colors[idx] };
        }
      }
      scope.$watch(iAttrs.checkStrength, function () {
        if (typeof scope.thePassword === 'undefined') {
          iElement.css({ "display": "none"  });
          scope.pwStrength = 0;
        } else {
          var c = strength.getColor(strength.mesureStrength(scope.thePassword));
          iElement.css({ "display": "block" });
          iElement.children('li')
          .css({ "background": "#DDD" })
          .slice(0, c.idx)
          .css({ "background": c.col });
        }
      })
    },
    template: '<li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li>'
  }
})

;
