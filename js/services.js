var contextServices = angular.module('contextServices', []);

contextServices.service('DataStore', ['$http', '$rootScope',
function($http, $rootScope){
  var json;
  var familyNames;
  return {get: function(focusName, params, errorCallback) {
                 $http({url: 'http://localhost:8000/chado/context_viewer' +
                             '/search_tracks_service/'+focusName, 
                        method: "GET",
                        params: params})
                      .then(function(response) {
                              json = response.data;
                              familyNames = getFamilyNameMap(JSON.parse(json));
                              // controllers should listen for the broadcast
                              // instead of passing a success callback
                              $rootScope.$broadcast('newData');
                            },
                            function(response) { errorCallback(response); });},
          json: function() { return json; },
          familyNames: function() { return familyNames; }
}}]);

contextServices.service('Viewer', ['DataStore',
function(DataStore) {
  var tracks;
  var scores;
  return {get: function(focusName, params, successCallback, errorCallback) {
            DataStore.get(focusName, params, successCallback, errorCallback);
          },
          align: function(params) {
            tracks = JSON.parse(DataStore.json());
            scores = {};
            var aligner = params.algorithm == "repeat" ? repeat : smith;
            // align all the tracks with the query track
            var alignments = [],
                resultTracks = [];
            for (var i = 1; i < tracks.groups.length; i++) {
              var al = aligner(tracks.groups[0].genes,
                               tracks.groups[i].genes,
                               function(item) { return item.family; },
                               params);
              var id = tracks.groups[i].species_id+":"+
                       tracks.groups[i].chromosome_id;
              if (al !== null) {
                if (scores[id] === undefined) {
                  scores[id] = 0;
                }
                scores[id] += al[1];
                for (var j = 0; j < al[0].length; j++) {
                  resultTracks.push(clone(tracks.groups[i]));
                  alignments.push(al[0][j]);
                }
              }
            }
            // merge the alignments
            tracks.groups = [tracks.groups[0]];
            mergeAlignments(tracks, resultTracks, alignments);
          },
          tracks: function() {
            return tracks;
          }}
}]);

// TODO: cache clicked gene data
contextServices.factory('Gene', ['$http', 'DataStore',
function($http, DataStore){
  return {get: function(geneName, successCallback, errorCallback) {
    $http({url: 'http://legumeinfo.org/gene_links/'+geneName+'/json',
           method: "GET"})
         .then(function(response) { successCallback(response.data); },
               function(response) { errorCallback(response); });
}}}]);

// TODO: cache clicked family data
contextServices.factory('Family', ['$http', 'DataStore',
function($http, DataStore){
  return {get: function(familyName, successCallback, errorCallback) {
            $http({url: '#'+familyName, // TODO: use correct url
                   method: "GET"})
            .then(function(response) { successCallback(response.data); },
                  function(response) { errorCallback(response); });},
           familyNames: function() { return DataStore.familyNames(); }
}}]);

// TODO: cache global plot data
contextServices.factory('Plot', ['$http', 'DataStore',
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
    },
    familyClicked: function(family, genes) {
      $rootScope.$broadcast('familyClicked', family, genes);
    }
  }
}]);
