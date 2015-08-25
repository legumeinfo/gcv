var contextServices = angular.module('contextServices', ['ngResource']);

contextServices.factory('Context', ['$resource',
function($resource) {
  return $resource('/your/service/url/:focusName', {}, {
    query: {method:'GET', params:{focusName:'@focusName'}, isObject:true}
  });
}]);
