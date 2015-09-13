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
