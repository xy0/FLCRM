angular.module("Main")
.filter('myLimitTo', function() {
  return function(input, limit, begin) {
    return input.slice(begin, begin + limit);
  }
})

.filter('words', function () {
  return function (input, words) {
    if (isNaN(words)) return input;
    if (words <= 0) return '';
    if (input) {
      var inputWords = input.split(/\s+/);
      if (inputWords.length > words) {
        input = inputWords.slice(0, words).join(' ') + '…';
      }
    }
    return input;
  }
})

.filter('tel', function () {
  return function (tel) {
    if (!tel) { return ''; }
    var value = tel.toString().replace(/[^a-z0-9]/gi,'');;
    var country, city, number;
    switch (value.length) {
      case 10:
        country = 1;
        city = value.slice(0, 3);
        number = value.slice(3);
        break;
      case 11:
        country = value[0];
        city = value.slice(1, 4);
        number = value.slice(4);
        break;
      case 12:
        country = value.slice(0, 3);
        city = value.slice(3, 5);
        number = value.slice(5);
        break;
      default:
        return tel;
    }
    if (country == 1) {
      country = "";
    }
    number = number.slice(0, 3) + '-' + number.slice(3);
    return (country + " (" + city + ") " + number).trim();
  }
})

.factory('API', function($http) {
  var promise = [];
  var API = {
    request: function(url, method, params, promiseID) {
      method = method || "get";
      promiseID = promiseID || false;
      params = params || null;
      if(promiseID){
        if (!promise[promiseID] ) {
          promise[promiseID] = $http[method](url,params).then(function (response) {
            return response.data;
          })
        }
        return promise[promiseID];
      }else{
        promise = $http[method](url,params).then(function (response) {
          return response.data;
        }).catch(function(err){
          return err;
        })
        return promise;
      }
    }
  }
  return API;
})

.factory('Cookies', function(){
  var Cookie = {
    read: function (name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ')
          c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) 
          return JSON.parse(unescape(c.substring(nameEQ.length,c.length)).substring(2));
      }
      return null;
    },
    check: function (name){
      return (document.cookie.indexOf(name) >= 0);
    }
  }
  return Cookie;
})


;