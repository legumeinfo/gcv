// a helper function that moves things to the back of an svg element
d3.selection.prototype.moveToBack = function() { 
  return this.each(function () { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  });
};

// show tips in all plots
function showTips(gene_selection, rail_selection) {
  d3.selectAll(".gene").style("opacity", .1);
  if (gene_selection !== undefined) {
  	gene_selection.style("opacity", 1);
  	gene_selection.selectAll(".tip").style("visibility", "visible");
  }
  d3.selectAll(".rail").style("opacity", .1);
  if (rail_selection !== undefined) {
  	rail_selection.style("opacity", 1);
  	rail_selection.selectAll(".tip").style("visibility", "visible");
  }
}

// hide tips in all plots
function hideTips(gene_selection, rail_selection) {
  d3.selectAll(".gene").style("opacity", 1);
  if (gene_selection !== undefined) {
  	gene_selection.selectAll(".tip").style("visibility", "hidden");
  }
  d3.selectAll(".rail").style("opacity", 1);
  if (rail_selection !== undefined) {
  	rail_selection.selectAll(".tip").style("visibility", "hidden");
  }
}

// return the length of the trakcs based on the data
function get_track_length(data) {
  return d3.max(data.groups, function (d) { 
    return d3.max(d.genes, function (e) {
      return +e.x;
    }); 
  })+1;
}

// return a family id to name map
function getFamilyNameMap(data) {
  // make a family id name map
  var family_names = {};
  for (var i = 0; i < data.families.length; i++) {
  	var fam = data.families[i];
  	family_names[fam.id] = fam.name;
  }
  return family_names;
}

// return a family size map
function getFamilySizeMap(data) {
  // make a family size map
  var family_sizes = {};
  for (var i = 0; i < data.groups.length; i++) {
  	for (var j = 0; j < data.groups[i].genes.length; j++) {
  	  var family = data.groups[i].genes[j].family;
  	  if (family in family_sizes) {
  	  	family_sizes[family] += 1;
  	  } else {
  	  	family_sizes[family] = 1;
  	  }
  	}
  }
  return family_sizes;
}

// merges multiple alignments and sets coordinates for the context viewer
function mergeAlignments(context_data, selected_groups, alignments) {
  var num_groups = context_data.groups.length,
      query_length = context_data.groups[0].genes.length;
  // update the context data with the alignment
  for (var k = 0; k < alignments.length; k++) {
    var query_count = 0,
        pre_query = 0,
        insertion_count = 0,
        alignment = alignments[k],
        index = num_groups+k;
    context_data.groups.push(selected_groups[k]);
    context_data.groups[index].genes = [];
    for (var i = 0; i < alignment[0].length; i++) {
      // keep track of how many selected genes come before the query genes
      if (alignment[0][i] == null && query_count == 0) {
        pre_query++;
      // it must be an insertion
      } else if (alignment[0][i] == null) {
        // position the genes that come after the query genes
        if (query_count >= query_length) {
          alignment[1][i].x = query_count++;
          alignment[1][i].y = k+1;
          context_data.groups[index].genes.push(alignment[1][i]);
        // track how many genes were inserted
        } else {
          insertion_count++;
        }
      // a deletion
      } else if (alignment[1][i] == null) {
        query_count++;
      // an alignment
      } else {
        // position the genes that came before the query
        if (pre_query > 0) {
          for (var j = 0; j < pre_query; j++) {
            alignment[1][j].x = -1*(pre_query-(j+1));
            alignment[1][j].y = k+1;
            context_data.groups[index].genes.push(alignment[1][j]);
          }
          pre_query = 0;
        // position the genes that go between query genes
        } else if (insertion_count > 0) {
          var step = 1.0/(insertion_count+1);
          for (var j = i-insertion_count; j < i; j++) {
            if (alignment[1][j] != null) {
              alignment[1][j].x = query_count+(step*(i-j))-1;
              alignment[1][j].y = k+1;
              context_data.groups[index].genes.push(alignment[1][j]);
            }
          }
          insertion_count = 0;
        }
        alignment[1][i].x = query_count++;
        alignment[1][i].y = k+1;
        context_data.groups[index].genes.push(alignment[1][i]);
      }
    }
  }
}

// 100 maximally distinct colors
var contextColors = d3.scale.ordinal().range(["#7A2719","#5CE33C","#E146E9","#64C6DE","#E8B031","#322755","#436521","#DE8EBA","#5C77E3","#CEE197","#E32C76","#E54229","#2F2418","#E1A782","#788483","#68E8B2","#9E2B85","#E4E42A","#D5D9D5","#76404F","#589BDB","#E276DE","#92C535","#DE6459","#E07529","#A060E4","#895997","#7ED177","#916D46","#5BB0A4","#365167","#A4AE89","#ACA630","#38568F","#D2B8E2","#AF7B23","#81A158","#9E2F55","#57E7E1","#D8BD70","#316F4B","#5989A8","#D17686","#213F2C","#A6808E","#358937","#504CA1","#AA7CDD","#393E0D","#B02828","#5EB381","#47B033","#DF3EAA","#4E191E","#9445AC","#7A691F","#382135","#709628","#EF6FB0","#603719","#6B5A57","#A44A1C","#ABC6E2","#9883B0","#A6E1D3","#357975","#DC3A56","#561238","#E1C5AB","#8B8ED9","#D897DF","#61E575","#E19B55","#1F303A","#A09258","#B94781","#A4E937","#EAABBB","#6E617D","#B1A9AF","#B16844","#61307A","#ED8B80","#BB60A6","#E15A7F","#615C37","#7C2363","#D240C2","#9A5854","#643F64","#8C2A36","#698463","#BAE367","#E0DE51","#BF8C7E","#C8E6B6","#A6577B","#484A3A","#D4DE7C","#CD3488"]);
