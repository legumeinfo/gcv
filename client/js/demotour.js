
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
	title: "Need Help?",
	content: "Click \
	<a href='https://github.com/ncgr/lis_context_viewer/wiki/User-help' \
	target='_blank' style='text-decoration: underline'>here</a> to view detailed help documentation, or click 'Next' to continue this introductory tour.",
	target: "helpbtn",
	placement: "bottom",
		},	
	 {
	      title: "Welcome!",
	      content: "The Genome Context Viewer allows you to view regions of genomes considered primarily with respect to the ordering and orientation of their annotated gene content.",
	      target: "viewer-button",
 	      placement: "bottom",
	      },
       {
  	     title: "Gene Family Legend",
	     content: "Each gene in a Context View is colored by the gene family it belongs to as indicated in the legend (genes belonging to families with no other representatives in a view are left uncolored, while genes not belonging to families are uncolored and have dotted outlines). In the case where a single gene is used to invoke the viewer, that gene's context track will be used as a query to find other tracks annotated with similar gene family content in the database. If a set of genes from a gene family was used to request a view, these genes will be centered in each context but no alignment of the tracks will be performed.",
	      target: "legend",
	     placement: "left"
	     }, 
       {
	      title: "Gene Families",
	      content: "Since genes in a family tend to have relatively similar sequences, we can use them to predict the functions of newly identified genes based on their relations to other known genes, especially in cases where the genes are found in similar syntenic contexts. Gene family colors in the legend will display all representatives of the family in the current view when moused-over, or when clicked will list those genes with the option to view them in the context of the family's phylogenetic tree. ",
	      target: ".legend",
	      placement: "left"
 	      },	
       {
	      title: "Context Viewer",
	      content: "The context viewer displays corresponding regions around a selected gene or set of genes in a subtree. It makes it easy to find functional gene groups as well as help make hypotheses about their evolutionary histories. Gene glyphs have mouse over and click interactivity. If a glyph is moused over its name and genomic position are shown. If a gene is clicked a widget will appear with a variety of links related to the gene, such as a link to the source of the gene annotation. The thicker the connecting line between the genes, the longer the intergenic distance on the chromosome; intergenic distances and gene identities for tracks can also be displayed by mousing over the track labels to the left of the tracks.",
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
		else { return hopscotch.startTour(tour, 6)}
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
		else { return hopscotch.startTour(tour, 7)}
					}}
	    },	     
	{   
	     title: "Global Plots",
	     content: "Just like the local plot but instead of focusing only on the matched syntenic segment, the global plot displays all instances of genes from the families of the query track in across the chromosome from which the matched syntenic segment was taken. This gives a better sense for the frequency with which members of these families occur outside the matched context and can reveal wider syntenic properties.",
     	     target: "#global-plot",
	     placement: "left"
	    },	     
	{  
             title: "Parameters",
     	     content: "These parameters allow you to fine-tune the candidate tracks retrieved and the alignments produced from them.",
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
		return hopscotch.startTour(tour, 9);
			}}
               	     },
	     multipage: true
	    },
   	{
	     title: "Neighbors",
	     content: "The 'Neighbor' value controls the number of genes that surround the central gene. By default, the regions extend out by 8 genes upstream and down from the selected genes. Increasing this value will give you longer contexts with more sensitivity for finding distant matches, but will increase retrieval times and may make the display harder to interpret.",
   	     target: "neighborpane", //Should point to the field input, but depends on the size/shape of the window.
	     placement: "right",	   
	    },
	{
	     title: "Scroll Control",
	     content: "The scroll input is used to scroll in either direction on the query track's chromosome. In other words, given a scroll distance and direction from the current focus gene, a new query is made with the track built around the new focus found with these parameters. The allowed scroll values are constrained so that the new focus gene after scrolling is present in the context before scrolling.",
	     target: "form-wrapper",
	     placement: "right"
            },	
	{
	     title: "Algorithms",
     	     content: "Synteny between tracks is determined via a modified Smith-Waterman or Repeat alignment algorithm. For Smith-Waterman, the orientation (forward/reverse) with the higher score is displayed. For the Repeat algorithm, all alignments are kept and displayed as related tracks. This has the advantage of nicely capturing inversions.",
	     target: "algpar",
	     placement: "right",
	    },
	{
	     title: "Alerts",
             content: "A context search is performed by querying a database for tracks with similar gene family content to a query track. The result tracks found are then aligned to the query track using alignment based on common family memberships. The search view displays the query track and the alignments that meet the specified alignment criteria. If the number of tracks returned exceeds the number aligned, you may consider altering the Alignment Parameters to see if you are missing out on some more complex syntenic relationships.",
	     target: "alerts",
 	     placement: "bottom",
	     arrowOffset: "center"
	    },
	{
	     title: "Want to know more?",
	     content: "This\
	     documentation <a href='http://legumeinfo.org' \
		    target='_blank'>link</a> will take you back to the LIS homepage.",
	     target: "helpbtn",
	     placement: "bottom"
 	    }
	],
	showPrevButton: true,
}	





