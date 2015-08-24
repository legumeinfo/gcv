var contextServices = angular.module('contextServices', ['ngResource']);

contextServices.factory('Context', ['$resource',
function($resource) {
  console.log("getting");
  return {};
  //return $resource('/chado/context_viewer/angular/search_tracks/:focusName', {}, {
  //  query: {method:'GET', params:{focusName:'context'}, isObject:true}
  //});
}]);
