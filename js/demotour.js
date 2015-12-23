
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
	}
     }
	}
	)(jQuery);
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
	      title: "Context Viewer",
	      content: "The context viewer displays corresponding regions around a selected gene or set of genes in a subtree. It makes easy to find functional gene groups as well as help make hypotheses about species' phylogenies.",
	      target: ".rail",
	      placement: "bottom",
	     },	  
        {
	      title: "Dot Plots",
      	      content: "Dot plots are useful in identifying interspersed, lost, or gained repeat motifs. Clicking 'plot' will show that tracks' specific alignment with the query track. Try it out!",
	      target: ".axis_right",
	      placement: "top",
	      multipage: true,
              onNext: function() {
		$('#plots').trigger('rightAxisClicked');
  		$(document).ready(waitForplot);
			function waitForplot() {
		if (! $('#plot').is(':visible')) {
		setTimeout(waitForplot, 900);	
		} 
		else { return hopscotch.startTour(tour, 4)}
					}}
           	     },    
      	{
	     title: "The Plot Thickens",
     	     content: "The main diagonal shows the sequence's alignment with itself, while patterns off the main diagonal indicate structural similarities among different parts of the sequences. Lines off the main diagonal imply different regions with a high similarity.", 
	     target: "local-plot",
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
		return hopscotch.startTour(tour, 6);
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
	     title: "Algorithms",
     	     content: "Synteny between tracks is determined via a modified Smith-Waterman or Repeat alignment algorithm. For Smith-Waterman, the orientation with the higher score is displayed. For the Repeat algorithm, all alignments are kept and displayed as related tracks. This has the advantage of nicely capturing inversions.",
	     target: "algpar",
	     placement: "right",
	    }
	]
}	





