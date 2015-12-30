
var tourId = "not-a-tour";
	(function($) {
	     var tourState = hopscotch.getState(tourId);
             if(tourState !== null && tourState != undefined) {
	return;
	     }
     //Wait for dom
     $(document).ready(waitFord3);
	function waitFord3()    {
	if (! $('svg').length || ! $('g').length) {
	   setTimeout(waitFord3, 200);
           return;
	}}}(jQuery));

//d3 =/= jquery
jQuery.fn.d3Click = function () {
  this.eq(1).each(function (i, e) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    e.dispatchEvent(evt);
  });
};

var nextOnCallback = function(callback) {
    var currentStep = window.hopscotch.getCurrStepNum();
    callback(function() {
        window.hopscotch.startTour(theTour, currentStep);
    });
};

var tour = {
	id: tourId,

	steps: [
	 {
	      title: "Welcome!",
	      content: "The Genome Context Viewer allows you to view a region of a genome considered only with respect to the ordering and orientation of its annotated gene content.",
	      target: "viewer-button",
 	      placement: "bottom",
	      },
       {
  	     title: "Legend",
	     content: "Each gene in a Context View is colored by the gene family it belongs to as indicated in the legend. In the case where a single gene is used as the selection, that gene's context track will be used as a query to find other tracks annotated with similar gene family content in the database.",
	      target: "legend",
	     placement: "left"
	     }, 
       {
	      title: "Gene Families",
	      content: "Since genes in a family tend to have relatively similar nucleotide sequences, we can use them to predict the functions of newly identified genes as their relations to other known genes. Gene glyphs have mouse over and click interactivity. If a glyph is moused over its name and genomic position are shown. If a gene is clicked a widget will appear with a variety of links related to the gene, such as a link to the source of the gene annotation.",
	      target: ".legend",
	      placement: "left"
 	      },	
       {
	      title: "Context Viewer",
	      content: "The context viewer displays corresponding regions around a selected gene or set of genes in a subtree. It makes it easy to find functional gene groups as well as help make hypotheses about species' phylogenies.",
	      target: ".rail",
	      placement: "bottom",
	     },	  
        {
	      title: "Dot Plots",
      	      content: "Dot plots are useful in identifying interspersed, lost, or gained repeat motifs.",
	      target: ".axis_right",
	      placement: "top",
	      multipage: true,
              onNext: function() {
		$('.axis_right text').d3Click();	
	 	$(document).ready(waitForplot);
			function waitForplot() {
		if (! $('#plot').is(':visible')) {
		setTimeout(waitForplot, 900);	
		} 
		else { return hopscotch.startTour(tour, 5)}
					}}
             },    
      	{
	     title: "The Plot Thickens",
     	     content: "The main diagonal shows the sequence's alignment with itself, while patterns off the main diagonal indicate structural similarities among different parts of the sequences. Lines off the main diagonal imply different regions with a high similarity.", 
	     target: "local-plot",
	     placement: "left",
	     onNext: function() {
		     $('#gloplot').trigger("click");
		     	$('.axis_right text').d3Click();
		     $(document).ready(waitForglobal);
			function waitForglobal() {
		if (! $('#global-plot').is(':visible')) {
		setTimeout(waitForglobal, 900);
					} 
		else { return hopscotch.startTour(tour, 6)}
					}}
	    },	     
	{   
	     title: "Global Plots",
	     content: "Just like the local plot but instead of focusing on segments the global plot compares much longer alignments and presents the one with fewest gaps and the most matches. ",
     	     target: "#global-plot",
	     placement: "left"
	    },	     
	{  
             title: "Parameters",
     	     content: "These parameters allow you to fine-tune your alignment.",
	     target: "top-nav",	
	     placement: "bottom",
	     arrowOffset: "100",
	     onNext: function() {
		$('#parambtn').trigger('click');
		$(document).ready(waitForslider);
		function waitForslider()   {

		if (! $('#left-slider').is(':visible')) {
		setTimeout(waitForslider, 1000);
		}
		else {
		return hopscotch.startTour(tour, 8);
			}}
               	     },
	     multipage: true
	    },
   	{
	     title: "Neighbors",
	     content: "The 'Neighbor' value controls the number of genes that surround the central gene. By default, the regions extend out by 8 genes upstream and down from the selected genes.",
   	     target: "neighborpane", //Should point to the field input, but depends on the size/shape of the window.
	     placement: "right",	   
	    },
	{
	     title: "Scroll Control",
	     content: "The scroll input is used to scroll in either direction on the query track's chromosome. In other words, given a scroll distance and direction from the current focus gene, a new query is made with the track built around the new focus found with these parameters.",
	     target: "form-wrapper",
	     placement: "right"
            },	
	{
	     title: "Algorithms",
     	     content: "Synteny between tracks is determined via a modified Smith-Waterman or Repeat alignment algorithm. For Smith-Waterman, the orientation with the higher score is displayed. For the Repeat algorithm, all alignments are kept and displayed as related tracks. This has the advantage of nicely capturing inversions.",
	     target: "algpar",
	     placement: "right",
	    },
	{
	     title: "Alerts",
             content: "A context search is performed by querying a database for tracks with similar gene family content to a query track. The result tracks found are then aligned to the query track using a sequence alignment. The search view displays the query track and the result track alignments.",
	     target: "alerts",
 	     placement: "bottom",
	     arrowOffset: "center"
	    },
	{
	     title: "Want to know more?",
	     content: "You can view additional\
	     documentation <a href='https://github.com/ncgr/lis_context_viewer/wiki/User-help' \
		    target='_blank'> \
		    by clicking this link</a>.",
	     target: "helpbtn",
	     placement: "bottom"
 	    }

	]
}	





