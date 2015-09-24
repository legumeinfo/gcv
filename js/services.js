var contextServices = angular.module('contextServices', []);

contextServices.factory('Context', ['$http',
function($http){
  return {get: function(focusName, params, successCallback, errorCallback) {
    $http({url: 'http://localhost:8000/chado/context_viewer' +
                '/search_tracks_service/'+focusName, 
           method: "GET",
           params: params})
         .then(function(response) { successCallback(response.data); },
               function(response) { errorCallback(response); });
}}}]);

contextServices.factory('Gene', ['$http',
function($http){
  return {get: function(geneName, successCallback, errorCallback) {
    $http({url: '#'+geneName, // TODO: use correct url
           method: "GET"})
         .then(function(response) { successCallback(response.data); },
               function(response) { errorCallback(response); });
}}}]);

contextServices.factory('Family', ['$http',
function($http){
  return {get: function(familyName, successCallback, errorCallback) {
    $http({url: '#'+familyName, // TODO: use correct url
           method: "GET"})
         .then(function(response) { successCallback(response.data); },
               function(response) { errorCallback(response); });
}}}]);

contextServices.factory('Plot', ['$http',
function($http){
  return {get: function(geneName, successCallback, errorCallback) {
    $http({url: '#'+geneName, // TODO: use correct url
           method: "GET"})
         .then(function(response) { successCallback(response.data); },
               function(response) { errorCallback(response); });
}}}]);

contextServices.factory('Broadcast', ['$rootScope',
function($rootScope) {
  return {
    redraw: function() {
      $rootScope.$broadcast('redraw');
    },
    geneClicked: function(gene) {
      $rootScope.$broadcast('geneClicked', gene);
    }
  }
}]);
