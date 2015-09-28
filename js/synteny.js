function context_synteny( container_id, color, data, i, optional_parameters ) {

    // get the optional parameters
    var gene_clicked = function( selection ) { },
        brush_callback = function( selected_group ) { },
        selective_coloring = true,
        w = document.getElementById(container_id).offsetWidth;
    if( optional_parameters !== undefined ) {
        if( optional_parameters.gene_clicked !== undefined ) {
            gene_clicked = optional_parameters.gene_clicked;
        }
        if( optional_parameters.brush_callback !== undefined ) {
            brush_callback = optional_parameters.brush_callback;
        }
        if( optional_parameters.selective_coloring !== undefined ) {
            selective_coloring = optional_parameters.selective_coloring;
        }
        if( optional_parameters.width !== undefined ) {
            w = optional_parameters.width;
        }
    }

	// set some variables
	var p = 75,
        l = w-2*p,
        h = l;

	// get the family size map
	var family_sizes = get_family_size_map( data );

	// clear the contents of the target element first
	document.getElementById(container_id).innerHTML = "";

	// the plot matrix svg
	var matrix = d3.select("#"+container_id).append("svg")
	    .attr("width", w )
	    .attr("height", w )
	  .append("g")
	    .attr("transform", "translate(" + 0 + ",0)");
	
    d = data.groups[ i ]; // there must be a better way to do this

	// where is the plot located?
	//var plot_x = p,
	//    plot_y = Math.ceil((1/3)*(l+p));
    var plot_x = p,
        plot_y = p;
	
	// the x axis
	var min_x = d3.min(d.genes, function(e) { return e.x; }),
	    max_x = d3.max(d.genes, function(e) { return e.x; }),
		x_pad = (max_x - min_x)/10;
	
	min_x = min_x-x_pad;
	max_x = max_x+x_pad;
	
	var x = d3.scale.linear()
	    .domain([min_x, max_x])
	    .range([plot_x, plot_x+l]);
	
	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .tickValues([min_x, max_x]);
	
	var xAxis_selection = matrix.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + (plot_y+l) + ")")
	    .call(xAxis)
	
	xAxis_selection.append("text")
	    .attr("class", "label")
	    .attr("x", (p+(l/2)))
	    .attr("y", 15)
	    .style("text-anchor", "middle")
	    .text(d.chromosome_name);
	
	// the y axis
    var outliers = false;
	var min_y = d3.min(d.genes.filter(function(e, i) { if( e.y >= 0 ) { outliers = true; }; return e.y >= 0; }), function(e) { return e.y; }),
	    max_y = d3.max(d.genes, function(e) { return e.y; });
	
	var y = d3.scale.linear()
	    .domain([max_y, min_y])
	    .range([p, p+l]);
	
	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .tickValues([min_y, max_y]);
	
	matrix.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+plot_x+", 0)")
	    .call(yAxis)
	  .append("text")
	    .attr("class", "label")
	    .attr("transform", "translate(-10,"+((l/2)+p)+") rotate(-90)")
	    .style("text-anchor", "end")
	    .text(data.groups[0].chromosome_name);

    if( outliers ) {
        matrix.append('text')
	        .attr("class", "label")
	        .attr("y", (p-16))
	        .attr("x", p-9)
	        .text("Outliers")
	        .style("text-anchor", "end");
    }

    // bind the chromosome's data to an element that doesn't... and never will exist
	var ch_data = matrix.selectAll("chr_"+d.chromosome_id)
	    .data(d.genes);
	
	// the plot's brush
	var brush = d3.svg.brush().x(x).y(y)
	    .on("brush", brushmove)
	    .on("brushend", brushend);
	
	var brush_g = matrix.append("g")
	    .attr("class", "brush")
	    .call(brush);
	
	// plot the points
	var groups = ch_data.enter().append('g').attr("class", "gene")
		.attr("transform", function(e) {
            if( e.y == -1 ) {
			    return "translate("+x(e.x)+", "+(p-20)+")";
            }
			return "translate("+x(e.x)+", "+y(e.y)+")" })
		.on("mouseover", function(e) {
			show_tips( d3.select(this) );
		})
		.on("mouseout", function(e) {
			hide_tips( d3.select(this) );
		})
		.on("click", function(e) {
			gene_clicked(e);
		});
		
	groups.append("circle")
	    .attr("r", 3.5)
	    .style("fill", function(e) { return color(e.family); })
		.style("stroke", "#000")
		.style("cursor", "pointer")
		.attr("class", function(e) {
			if ( e.family == '' ) {
				return "no_fam";
			} return ""; })
		.style("fill", function(e) {
			if( e.family == '' || ( selective_coloring && family_sizes[ e.family ] == 1 ) ) {
				return "#ffffff";
			} return color(e.family);
		});
	
	groups.append("text")
	    .attr("class", "tip")
		.attr("transform", "translate(0, -10) rotate(-45)")
	    .attr("text-anchor", "middle")
	    .text(function(e) { return e.name+": "+e.fmin+" - "+e.fmax; });
	
	var extent;
	function brushmove() {
	    extent = brush.extent();
		extent[0][1] = min_y;
		extent[1][1] = max_y;
		brush.extent(extent);
		brush_g.call(brush);
	    groups.classed("selected", function(e) {
	        is_brushed = extent[0][0] <= e.x && e.x <= extent[1][0];
	        return is_brushed;
	    });
	}
	
	var clear_button;
	function brushend() {
	    get_button = d3.selectAll(".clear-button").filter(function() {
			if( clear_button ) {
				return this == clear_button[0][0];
			} return false; });
	    if(get_button.empty() === true) {
	        clear_button = matrix.append('text')
	            .attr("y", (l+p+30))
	            .attr("x", (p+(l/2)))
	            .attr("class", "clear-button")
	            .text("Clear Brush")
	            .style("text-anchor", "middle")
				.style("cursor", "pointer");
	    }
	    
	    x.domain([extent[0][0], extent[1][0]]);
	    
	    transition_data();
	    reset_axis();
		call_brush_callback();
	    
	    groups.classed("selected", false);
		brush_g.call(brush.clear());
	    
	    clear_button.on('click', function(){
	        x.domain([min_x, max_x]);
	        transition_data();
	        reset_axis();
	        clear_button.remove();
	    });
	}
	
	function transition_data() {
		var domain = x.domain();
		groups.transition()
			.duration(500)
			.attr("transform", function(e) {
				return "translate("+x(e.x)+", "+y(e.y)+")";
			})
			.attr("visibility", function(e) {
				if( e.x < domain[0] || e.x > domain[1] ) {
					return "hidden";
				} return "visible";
			});
	}
	
	function reset_axis() {
		xAxis.tickValues(x.domain());
	    matrix.transition().duration(500)
	        .selectAll(".x.axis").filter(function() { return this == xAxis_selection[0][0]; })
	        .call(xAxis);
	}

	function call_brush_callback() {
		// make a selection containing the selected genes
		var domain = x.domain();
		var added = {};
		var selected = groups.filter(function(e) {
			if( e.x >= domain[0] && e.x <= domain[1] ) {
				// no need for redundant families
				if( !(e.id in added ) ) {
					added[e.id] = 0;
					return true;
				}
			} return false;;
		});
        // sort the selection
        selected.sort(function(a, b) {
            return a.x-b.x;
        });
        // mung genes selection data into list
        var selected_genes = [];
        selected.each(function(e) {
            selected_genes.push(e);
        });
        // create a duplicate of the current group object to return
        var duplicate_group = clone(d);
        // give the duplicate the selected genes
        duplicate_group.genes = selected_genes;
        // hand the group object to the callback
		brush_callback( duplicate_group );
	}
}
