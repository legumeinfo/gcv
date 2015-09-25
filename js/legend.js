
//function context_legend( container_id, color, data, legendClick, selective_coloring ) {
function contextLegend( container_id, color, data, optional_parameters ) {
    // make sure optional parameters is at least defined
    if( optional_parameters === undefined ) {
        optional_parameters = {};
    }
	// clear the contents of the target element first
	document.getElementById(container_id).innerHTML = "";

	// get the family id name map
	var family_names = getFamilyNameMap( data );


    // omit any family that don't have a name
    var fams = [];
	// determine how many families will be in the legend
	var family_size_map = getFamilySizeMap( data );
	var num_fams = 0;
    if( optional_parameters.selective_coloring === undefined || optional_parameters.selective_coloring !== undefined && optional_parameters.selective_coloring ) {
	    for( fam in family_size_map ) {
	    	if( fam != '' && family_size_map[ fam ] > 1 ) {
	    		num_fams++;
                fams.push( fam );
	    	}
	    }
    } else {
        for( var fam in family_names ) {
            if( fam != '' ) {
                fams.push( fam );
            }
        }
        num_fams = data.families.length;
    }

	// helpful variables
	var rect_h = 18,
		rect_p = 2,
		pad = 20,
		w = document.getElementById(container_id).offsetWidth-pad,
		h = num_fams*(rect_h+rect_p)+(2*pad);

	// add the legend
	var legend = d3.select("#"+container_id)
		.append("svg")
		.attr("width", w)
		.attr("height", h)
		.append("g");

	// add the legend groups
	var legend_groups = legend.selectAll(".legend")
	    //.data(color.domain())
        .data(fams)
	    .enter().append("g")
	    .attr("class", "legend")
	    .attr("transform", function(d, i) {
			return "translate(0," + i * 20 + ")";
		})
		.style("cursor", "pointer")
	    .on("mouseover", function(d) {
			// fade the legend
	        d3.selectAll(".legend").filter(function(e) {
				return e != d;
			})
			.style("opacity", .1);

			// call the callback
			var selection = d3.selectAll(".gene").filter(function(e) {
				return e.family == d;
			});
			show_tips( selection );
	    })
	    .on("mouseout",  function(d) {
			// fade the legend
	        d3.selectAll(".legend").filter(function(e) {
				return e != d;
			})
			.style("opacity", 1);

			// call the callback
			var selection = d3.selectAll(".gene").filter(function(e) {
				return e.family == d;
			});
			hide_tips( selection );
		})
	    .on('click', function (d) {
			// call the callback
			var selection = d3.selectAll(".gene").filter(function(e) {
				return e.family == d;
			});
			var family = d3.select(this);
            if( optional_parameters.legendClick !== undefined ) {
			    optional_parameters.legendClick( d, selection );
            }
		});
	
	// add the colored rectangles
	legend_groups.append("rect")
	    .attr("x", w-rect_h-pad)
	    .attr("y", 10+pad)
	    .attr("width", rect_h)
	    .attr("height", rect_h)
	    .style("fill", color);
	
	// add then labels
	legend_groups.append("text")
	    .attr("x", w-rect_h-6-pad)
	    .attr("y", 20+pad)
	    .attr("dy", ".35em")
	    .style("text-anchor", "end")
	    .text(function(d) {
			return family_names[ d ];
	    });
}
