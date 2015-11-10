function contextViewer(container_id, color, data, optionalParameters) {

  document.getElementById(container_id).innerHTML = '';
  
  // data preprocessing
  var begin_genes = {};
  var end_genes = {};
  var partitions = {};
  var groups = {};
  for (var i = 0; i < data.groups.length; i++) {
    // find the beginning and end of each track
    data.groups[i].genes.sort(function (a, b) {
      return a.x-b.x;
    });
    var begin = data.groups[i].genes[0],
        end = data.groups[i].genes[data.groups[i].genes.length-1];
    begin_genes[begin.name] = begin;
    end_genes[end.name] = end;
    // prepare to merge partitions
    if (optionalParameters.merge !== undefined &&
        optionalParameters.merge == true) {
      var id = data.groups[i].id;
      if (partitions[id] === undefined) {
        partitions[id] = [];
        groups[id] = clone(data.groups[i]);
        groups[id].genes = [];
      }
      partitions[id].push(data.groups[i].genes);
    }
  }
  
  // merge partitions from same chromosome with the interval scheduling greedy
  // algorithm
  if (optionalParameters.merge !== undefined &&
      optionalParameters.merge == true) {
    data.groups = [];
    var group_y = 0;
    for (var id in partitions) {
      var partition_groups = [];
      // sort the partition groups by "finish time"
      partitions[id].sort(function (a, b) {
        return a[a.length-1].x-b[b.length-1].x;
      });
      // generate the merged tracks
      while (partitions[id].length > 0) {
        var track_genes = [];
        var remove = [];
        for (var i = 0; i < partitions[id].length; i++) {
          // make sure the genes are ordered by x coordinate
          partitions[id].sort(function (a, b) {
            return a.x-b.x;
          });
          // greedy ordering
          var partition = partitions[id][i];
          if (track_genes.length == 0 ||
              partition[0].x > track_genes[track_genes.length-1].x) {
            track_genes = track_genes.concat(partition);
            remove.push(i);
          }
        }
        // remove the tracks that were merged
        for (var i = remove.length-1; i >= 0; i--) {
          partitions[id].splice(remove[i], 1);
        }
        // save the new group
        var group = clone(groups[id]);
        group.genes = track_genes.slice(0);
        partition_groups.push(group);
      }
      // order the new groups largest to smallest
      partition_groups.sort(function (a, b) {
        return b.genes.length-a.genes.length;
      });
      // add the new groups to the data
      for (var i = 0; i < partition_groups.length; i++) {
        partition_groups[i].genes = partition_groups[i].genes.map(
                                    function (gene) {
                                      gene.y = group_y;
                                      return gene;
                                    });
        group_y++;
        data.groups.push(partition_groups[i]);
      }
    }
  }
  
  // sort the result tracks by some user defined function
  if (optionalParameters.sort !== undefined) {
    // remove the query from the groups array
    var query = data.groups.splice(0, 1);
    // sort the results with the user defined function
    data.groups.sort(optionalParameters.sort);
    // set the groups array to the query concatenated with the sorted results
    data.groups = query.concat(data.groups);
    // give each track the correct y value
    for (var i = 0; i < data.groups.length; i++) {
      for (var j = 0; j < data.groups[i].genes.length; j++) {
        data.groups[i].genes[j].y = i;
      }
    }
  }
  
  // get the family size map
  var family_sizes = getFamilySizeMap(data);
  
  // get the family id name map
  var family_names = getFamilyNameMap(data);
  
  // define dimensions of graph and a bunch of other stuff
  var targetWidth = ((optionalParameters.width !== undefined) ?
                     optionalParameters.width :
                     document.getElementById(container_id).offsetWidth);
  var w = d3.max([1000, targetWidth]),
      rect_h = 18,
      rect_pad = 2,
      top_pad = 50,
      bottom_pad = 200,
      pad = 20,
      left_pad = 250,
      right_pad = 150,
      num_tracks = data.groups.length,
      num_genes = get_track_length(data),
      h = num_tracks*30+bottom_pad+top_pad,
      min_x = d3.min(data.groups, function (group) {
        return d3.min(group.genes, function (gene) {
          return +gene.x;
        });
      }),
      max_x = d3.max(data.groups, function (group) {
        return d3.max(group.genes, function (gene) {
          return +gene.x;
        });
      });
  
  // define the scatter plot
  var viewer = d3.select("#"+container_id)
    .append("svg")
    .attr("width", w)
    .attr("height", h);
  
  // initialize the x and y scales
  var x = d3.scale.linear().domain([min_x, max_x])
        .range([left_pad, w-right_pad]),
      y = d3.scale.linear().domain([0, num_tracks-1])
        .range([top_pad, h-bottom_pad]);
  
  // for constructing the y-axis
  var tick_values = [];
  
  // add the tracks (groups)
  for (var i = 0; i < data.groups.length; i++) {
  	// add the group to the y-axis
  	tick_values.push(i);
  
  	// make svg groups for the genes
  	var selector = ".gene-"+i.toString();
  	var gene_groups = viewer.selectAll(selector)
  	  .data(data.groups[i].genes)
  	  .enter()
  	  .append("g")
  	  .attr("class", "gene")
  	  .attr("transform", function (d) {
  	    return "translate("+x(d.x)+", "+y(d.y)+")";
  	  });
  
  	// add genes to the svg groups
  	gene_groups.append("path")
  	  .attr("d", d3.svg.symbol().type("triangle-up").size(200))
  	  .attr("class", function (d) {
  	  	if (optionalParameters.focus !== undefined &&
            optionalParameters.focus == d.family) {
  	  	  return "point focus";
  	  	} else if (d.family == '') {
  	  	  return "point no_fam";
  	  	} else if (family_sizes[d.family] == 1 && 
                   optionalParameters.selectiveColoring !== undefined &&
                   optionalParameters.selectiveColoring == true) {
  	  	  return "point single";
  	  	} return "point";
      })
  	  .attr("transform", function (d) {
        return "rotate("+((d.strand == 1) ? "90" : "-90")+")";
      })
  	  .style("fill", function (d) {
  	  	if (d.family == '' ||
            (optionalParameters.selectiveColoring !== undefined &&
             optionalParameters.selectiveColoring == true &&
             family_sizes[d.family] == 1)) {
  	  	  return "#ffffff";
  	  	} return color(d.family);
  	  })
  	  .style("cursor", "pointer");
  
  	gene_groups.on("mouseover", function (d) {
		var selection = d3.selectAll(".gene").filter(function(e) {
		  return e.id == d.id;
		});
  	    showTips(selection);
  	  })
  	  .on("mouseout", function (d) {
		var selection = d3.selectAll(".gene").filter(function(e) {
		  return e.id == d.id;
		});
  	    hideTips(selection);
  	  })
  	  .on('click', function (d) {
        if (optionalParameters.geneClicked !== undefined) {
  	  	   optionalParameters.geneClicked(d);
        }
  	  });
  
  	// add the tooltips
  	gene_groups.append("text")
  	  .attr("class", "tip")
  	  .attr("transform", "translate(3, 14) rotate(45)")
  	  .attr("text-anchor", "left")
  	  .text(function (d) {
  	    return d.name+": "+d.fmin+" - "+d.fmax;
  	  });
  
  	// helper that draws lines between two given genes
    function draw_line(a, b) {
  	  var length = x(a.x)-x(b.x);
  	  var rail_group = viewer.append("g")
  	    .attr("class", "rail")
  	    .attr("transform", function () {
  	      return "translate("+x(b.x)+", "+y(b.y)+")";
  	    })
  	    .attr("y", b.y) // does nothing besides hold the datum
  	    .data(function () {
  	      if (a.fmin > b.fmax) {
  	        return [a.fmin-b.fmax];
  	      }
  	      return [b.fmin-a.fmax];
  	    });
  	  rail_group.append("line")
  	  	.attr("class", "line")
  	  	.attr("x1", 0)
  	  	.attr("x2", length)
  	  	.attr("y1", 0)
  	  	.attr("y2", y(a.y)-y(b.y));
  	  rail_group.append("text")
  	  	.attr("class", "tip")
  	  	.attr("transform", "translate("+(length/2)+", -10) rotate(-45)")
  	  	.attr("text-anchor", "left")
  	  	.text(function (d) {
  	      return rail_group.data();
  	  	});
  	  rail_group.moveToBack();
    }
  
  	// add rails to the tracks
    // this is all rather hacky
    var partition = false;
  	gene_groups.each(function (d) {
  	  var closest;
  	  var neighbors = gene_groups.filter(function (n) {
  	  	return n.y == d.y;
  	  });
  	  neighbors.each(function (n) {
  	  	if (n.x < d.x && (closest === undefined || n.x > closest.x)) {
  	  	  closest = n;
  	  	}
  	  });
  	  if (closest !== undefined) {
        // draw inter-track lines
        if (optionalParameters.interTrack !== undefined &&
            optionalParameters.interTrack == true) {
  	      if (end_genes[d.name] !== undefined && end_genes[d.name].y != d.y) {
            partition = true;
            draw_line(closest, end_genes[d.name]);
          }
          if (!partition && begin_genes[d.name] === undefined &&
              end_genes[closest.name] === undefined) {
            // inner-track line
            draw_line(d, closest);
          }
  	      if (begin_genes[closest.name] !== undefined &&
              begin_genes[closest.name].y != closest.y) {
            partition = false;
            draw_line(d, begin_genes[closest.name]);
  	      }
          if (partition) {
            // don't display genes that appear in other partitions
            d3.select(this).remove();
            // don't draw lines to genes that are no longer displayed
            if (end_genes[d.name] !== undefined) {
              delete end_genes[d.name];
            }
          } 
        } else {
          draw_line(d, closest);
        }
      }
  	});
  }
  
  // make global group selections
  var gene_groups = viewer.selectAll(".gene"),
  	  rail_groups = viewer.selectAll(".rail");
  
  // make thickness of lines a function of their "length"
  var max_width = d3.max(rail_groups.data());
  var min_width = d3.min(rail_groups.data());
  var width = d3.scale.linear()
    .domain([min_width, max_width])
    .range([.1, 5]);
  rail_groups.attr("stroke-width", function (d) { return width(d); });
  
  // construct the y-axes
  var yAxis_left = d3.svg.axis().scale(y).orient("left")
    .tickValues(tick_values) // we don't want d3 taking liberties
    .tickFormat(function (d, i) {
      var l = data.groups[d].genes.length;
      if (d > 0 && data.groups[d-1].id === data.groups[d].id) {
        return (l > 0 ?
          (data.groups[d].genes[0].fmin+"-"+data.groups[d].genes[l-1].fmax) :
          "");
      }
      return data.groups[d].chromosome_name +":"+(l > 0 ?
        (data.groups[d].genes[0].fmin+"-"+data.groups[d].genes[l-1].fmax) :
        "");
    });
  
  // draw the axes of the graph
  viewer.append("g")
    .attr("class", "axis axis_left")
    .attr("transform", "translate("+(left_pad-pad)+", 0)")
    .call(yAxis_left);
  
  if (optionalParameters.rightAxisClicked !== undefined) {
    var yAxis_right = d3.svg.axis().scale(y).orient("right")
      .tickValues(tick_values) // we don't want d3 taking liberties
      .tickFormat(function (d, i) {
        if (d > 0 && data.groups[d-1].id === data.groups[d].id) {
          return "";
        }
        return "plot";
      });
    viewer.append("g")
      .attr("class", "axis axis_right")
      .attr("transform", "translate("+(w-right_pad+pad)+", 0)")
      .call(yAxis_right);
    var yAxis_right = d3.svg.axis().scale(y).orient("right")
      .tickValues(tick_values) // we don't want d3 taking liberties
      .tickFormat("plot");
  }
  
  // interact with the y-axes
  d3.selectAll(".axis_left text")
    .style("font-weight", function(d, y) {
      if (optionalParameters.boldFirst !== undefined &&
          optionalParameters.boldFirst && y == 0) {
        return "bold";
      } return "normal"; })
  	.style("cursor", "pointer")
      .on("mouseover", function (d, y) {
  		var gene_selection = gene_groups.filter(function (e) {
  		  return e.y == y;
  		});
  		var rail_selection = rail_groups.filter(function (e) {
          // select lines only on the track (not inter-track lines)
  	      return (d3.select(this).attr("y") == y &&
          d3.select(this).select("line").attr("y1") == 0 &&
          d3.select(this).select("line").attr("y2") == 0);
  		});
  		showTips(gene_selection, rail_selection);
      })
      .on("mouseout",  function (d, y) {
  		var gene_selection = gene_groups.filter(function (e) {
  	      return e.y == y;
  		});
  		var rail_selection = rail_groups.filter(function (e) {
  		  return d3.select(this).attr("y") == y;
  		});
  		hideTips(gene_selection, rail_selection);
      })
      .on("click", function (d, y){
  		var gene_selection = gene_groups.filter(function (e) {
  		  return e.y == y;
  		});
  		var rail_selection = rail_groups.filter(function (e) {
  		  return d3.select(this).attr("y") == y;
  	    });
        if (optionalParameters.leftAxisClicked !== undefined) {
  		  optionalParameters.leftAxisClicked(data.groups[d].id,
            gene_selection, rail_selection);
        }
  	  });
  d3.selectAll(".axis_right text")
    .style("cursor", "pointer")
    .on("click", function (d, y) {
      var gene_selection = gene_groups.filter(function (e) {
      	return e.y == y;
      });
      var rail_selection = rail_groups.filter(function (e) {
      	return d3.select(this).attr("y") == y;
      });
      // called if optionalParameters.rightAxisClicked !== undefined
      optionalParameters.rightAxisClicked(data.groups[d].id);
    });
}
