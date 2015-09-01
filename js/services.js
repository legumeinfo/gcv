var contextServices = angular.module('contextServices', ['ngResource']);

contextServices.factory('Context', ['$resource',
function($resource) {
  return $resource('http://localhost:8000/chado/context_viewer' +
                   '/search_tracks_service/:focusName', {}, {
  //return $resource('/your/service/url/:focusName', {}, {
    query: {method:'GET', params: {focusName: '@focusName',
                                   numNeighbors: '@numNeighbors',
                                   numMatchedFamilies: '@numMatchedFamilies',
                                   numNonFamily: '@numNonFamily'},
            isObject:true, withCredentials:true,
            headers: {'Content-Type': 'application/json; charset=utf-8'}}
  });
}]);
