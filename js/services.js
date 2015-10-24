var contextServices = angular.module('contextServices', []);

contextServices.service('DataStore', ['$http', '$cookies',
function($http, $cookies) {
  var json;
  var family;
  var familyNames;
  var familySizes;
  var colors = contextColors;
  var domain = $cookies.getObject('contextColors');
  if (domain !== undefined) {
    colors.domain(domain); //TODO: load color from cookie
  }
  return {basic: function(nodeID, params, successCallback, errorCallback) {
                 $http({url: 'http://localhost:8000/chado/context_viewer' +
                             '/basic_tracks_service/'+nodeID, 
                        method: "GET",
                        params: params})
                      .then(function(response) {
                              var data = JSON.parse(response.data);
                              json = JSON.stringify(data.tracks);
                              family = data.family;
                              familyNames = getFamilyNameMap(data.tracks);
                              successCallback();
                            },
                            function(response) { errorCallback(response); });
          },
          search: function(focusName, params, successCallback, errorCallback) {
                 $http({url: 'http://localhost:8000/chado/context_viewer' +
                             '/search_tracks_service/'+focusName, 
                        method: "GET",
                        params: params})
                      .then(function(response) {
                              json = response.data;
                              familyNames = getFamilyNameMap(JSON.parse(json));
                              successCallback();
                            },
                            function(response) { errorCallback(response); });
          },
          parsedData: function() {
            var data = JSON.parse(json);
            var reference = data.groups[0].chromosome_name;
            for (var i = 0; i < data.groups.length; i++) {
              // guarantee each track has a unique id and the reference name
              data.groups[i].reference = reference;
              data.groups[i].id = i;
              for (var j = 0; j < data.groups[i].genes.length; j++) {
                // guarantee each gene has x and y attributes
                data.groups[i].genes[j].x = j;
                data.groups[i].genes[j].y = i;
              }
            }
            return data;
          },
          familyNames: function() { return familyNames; },
          familySizes: function() { return familySizes; },
          colors: function() { return colors; },
          saveColors: function() {
            $cookies.putObject('contextColors', colors.domain());
          },
          family: function() { return family; }
}}]);

contextServices.service('Viewer', ['DataStore', 'Broadcast',
function(DataStore, Broadcast) {
  var tracks;
  var scores;
  var returned;
  var aligned;
  var lastQuery;
  // helper functions for sorting tracks
  function byChromosome(a, b) {
    return a.chromosome_name.localeCompare(b.chromosome_name);
  }
  function byDistance(a, b) {
    var a_id = a.id,
        b_id = b.id;
    return scores[b_id]-scores[a_id];
  }
  function sorter(selection) {
    return selection == "chromosome" ? byChromosome : byDistance
  }
  return {get: function(search, query, params, successCallback, errorCallback) {
            var call = search ? DataStore.search : DataStore.basic;
            call(query, params,
              function() {
                lastQuery = query;
                tracks = DataStore.parsedData();
                successCallback();
              }, errorCallback);
          },
          getQueryGene: function(index, successCallback, errorCallback) {
            var names = [];
            tracks.groups[0].genes.forEach(function(gene) {
              names.push(gene.name);
            });
            if (index >= 0 && index < tracks.groups[0].genes.length) {
              successCallback(tracks.groups[0].genes[index].name);
            } else {
              errorCallback();
            }
          },
          align: function(params) {
            tracks = DataStore.parsedData();
            returned = tracks.groups.length-1;
            scores = {};
            aligned = 0;
            var aligner = params.algorithm == "repeat" ? repeat : smith;
            // align all the tracks with the query track
            var alignments = [],
                resultTracks = [];
            for (var i = 1; i < tracks.groups.length; i++) {
              var al = aligner(tracks.groups[0].genes,
                               tracks.groups[i].genes,
                               function(item) { return item.family; },
                               params);
              var id = tracks.groups[i].id;
              if (al !== null) {
                for (var j = 0; j < al[0].length; j++) {
                  resultTracks.push(clone(tracks.groups[i]));
                  alignments.push(al[0][j]);
                }
                if (al[0].length > 0) {
                  if (scores[id] === undefined) {
                    scores[id] = 0;
                  }
                  scores[id] += al[1];
                  aligned++;
                }
              }
            }
            // merge the alignments
            tracks.groups = [tracks.groups[0]];
            mergeAlignments(tracks, resultTracks, alignments);
            Broadcast.processed(sorter(params.order), scores);
          },
          center: function(params) {
            tracks = DataStore.parsedData();
            returned = tracks.groups.length;
            var length = params.numNeighbors*2+1;
            var family = DataStore.family();
            var centered = {};
            for (var i = 0; i < tracks.groups.length; i++) {
              // does the track need to be centered?
              if (tracks.groups[i].genes.length < length) {
                // find the gene it should be centered on
                var j;
                for (j = 0; j < tracks.groups[i].genes.length; j++) {
                  if (tracks.groups[i].genes[j].family == family &&
                      centered[tracks.groups[i].genes[j].id] === undefined) {
                    centered[tracks.groups[i].genes[j].id] = true;
                    break;
                  }
                }
                // center the track
                var offset = params.numNeighbors-j;
                for (j = 0; j < tracks.groups[i].genes.length; j++) {
                  tracks.groups[i].genes[j].x = offset+j;
                }
              }
            }
          },
          tracks: function() { return tracks; },
          scores: function() { return scores; },
          colors: function() { return DataStore.colors(); },
          saveColors: function() { DataStore.saveColors(); },
          returned: function() { return returned; },
          aligned: function() { return aligned; },
          lastQuery: function() { return lastQuery; },
          family: function() { return DataStore.family(); },
          getSorter: function(selection) {
            return sorter(selection);
          }
}}]);

// TODO: cache clicked gene data
contextServices.factory('Gene', ['$http', 'DataStore',
function($http, DataStore) {
  return {get: function(geneName, successCallback, errorCallback) {
    $http({url: 'http://legumeinfo.org/gene_links/'+geneName+'/json',
           method: "GET"})
         .then(function(response) { successCallback(response.data); },
               function(response) { errorCallback(response); });
         },
         familyNames: function() { return DataStore.familyNames(); }
}}]);

// TODO: cache clicked family data
contextServices.factory('Track', ['$http', 'DataStore',
function($http, DataStore) {
  return {get: function(trackID, successCallback, errorCallback) {
            var data = DataStore.parsedData();
            var track;
            for (var i = 0; i < data.groups.length; i++) {
              if (data.groups[i].id == trackID) {             
                track = data.groups[i];
                break;
              }
            }
            if (track !== undefined) {
              successCallback(track);
            } else {
              errorCallback();
            }},
           familyNames: function() { return DataStore.familyNames(); }
}}]);

// TODO: cache clicked family data
contextServices.factory('Family', ['$http', 'DataStore',
function($http, DataStore) {
  return {get: function(familyName, successCallback, errorCallback) {
            $http({url: '#'+familyName, // TODO: use correct url
                   method: "GET"})
            .then(function(response) { successCallback(response.data); },
                  function(response) { errorCallback(response); });},
           familyNames: function() { return DataStore.familyNames(); }
}}]);

// TODO: cache global plot data
contextServices.service('Plot', ['$http', 'DataStore',
function($http, DataStore) {
  var localPlots;
  var idPlotMap;
  var globalPlots;
  var numNeighbors;
  var focusID;
  // a helper function that plots genes against genes
  var familyMap;
  function plotPoints(group) {
    var plot_genes = [];
    for (var j = 0; j < group.genes.length; j++) {
      if (group.genes[j].family in familyMap) {
        for (var k = 0; k < familyMap[group.genes[j].family].length; k++) {
          group.genes[j].x = ((group.genes[j].fmin/2)+(group.genes[j].fmax/2));
          group.genes[j].y = familyMap[group.genes[j].family][k];
        }
      } else {
          group.genes[j].x = ((group.genes[j].fmin/2)+(group.genes[j].fmax/2));
          group.genes[j].y = -1;
      }
      plot_genes.push(group.genes[j]);
    }
    return plot_genes;
  }
  return {getLocal: function(trackID, successCallback, errorCallback) {
            if (idPlotMap[trackID] !== undefined) {
              successCallback(localPlots[idPlotMap[trackID]]);
            } else {
              errorCallback();
            }
          },
          getAllLocal: function() {
            return localPlots;
          },
          getGlobal: function(trackID, successCallback, errorCallback) {
            if (globalPlots[trackID] !== undefined) {
              successCallback(globalPlots[trackID]);
            } else {
              if (idPlotMap[trackID] !== undefined) {
                $http({url: 'http://localhost:8000/chado/context_viewer' +
                             '/global_plot_service/',
                       method: "GET",
                       params:{focusID: focusID,
                               numNeighbors: numNeighbors,
                               chromosomeID:
                               localPlots[idPlotMap[trackID]].chromosome_id}
                })
                .then(function(response) {
                  var group = clone(localPlots[idPlotMap[trackID]]);
                  globalPlots[trackID] = group;
                  group.genes = response.data;
                  globalPlots[trackID].genes = plotPoints(group);
                  successCallback(globalPlots[trackID]);
                }, function(response) { errorCallback(); });
              } else {
                errorCallback();
              }
            }
          },
          plot: function(sorter, scores) {
            // prepare the plots data for show and tell
            localPlots = [];
            idPlotMap = {};
            globalPlots = {};
            var rawData = DataStore.parsedData();
            numNeighbors = (rawData.groups[0].genes.length-1)/2;
            focusID = rawData.groups[0].genes[numNeighbors].id;
            // filter the tracks we don't want and order them
            for (var i = 1; i < rawData.groups.length; i++) {
              if (scores[rawData.groups[i].id] !== undefined) {
                localPlots.push(rawData.groups[i]);
              }
            }
            localPlots.sort(sorter);
            localPlots.unshift(rawData.groups[0]);
            for (var i = 0; i < localPlots.length; i++) {
              idPlotMap[localPlots[i].id] = i;
            }
            // make a map of points all genes will be plotted against
            familyMap = {};
            for (var i = 0; i < rawData.groups[0].genes.length; i++) {
              var g = rawData.groups[0].genes[i];
              if (g.family in familyMap) {
                familyMap[g.family].push((g.fmin/2)+(g.fmax/2));
              } else if (g.family != '') {
                familyMap[g.family] = [(g.fmin/2)+(g.fmax/2)];
              }
            }
            // plot all the genes against the list of points
            for (var i = 0; i < localPlots.length; i++) {
              localPlots[i].genes = plotPoints(localPlots[i]);
            }
          },
          familySizes: function() { return DataStore.familySizes; },
          colors: function() { return DataStore.colors(); }
}}]);

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
    },
    leftAxisClicked: function(trackID) {
      $rootScope.$broadcast('leftAxisClicked', trackID);
    },
    rightAxisClicked: function(trackID) {
      $rootScope.$broadcast('rightAxisClicked', trackID);
    },
    viewChanged: function(searchView) {
      $rootScope.$broadcast('viewChanged', searchView);
    },
    processed: function(ordering, scores) {
      $rootScope.$broadcast('processed', ordering, scores);
    }
  }
}]);
