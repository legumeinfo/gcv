var slideSpeed= 350;

function hideHorizontalSlider(element) {
  $(element).hide(slideSpeed);
}

function showHorizontalSlider(element) {
  $(element).show(slideSpeed);
}

// add sliding functionality to buttons
$(':button.horizontal-slider').each(function() {
  $(this).on('click', function(e) {
    $($(this).attr('data-target')).animate({width:'toggle'}, slideSpeed);
  });
});

// add parameter-opening links
$('body').on('click', 'a.open-parameters', function(e) {
  showHorizontalSlider('#parameters');
  e.preventDefault();
});

// add left slider closing links
$('body').on('click', '.close-left-slider', function(e) {
  hideHorizontalSlider('.left-slider');
  e.preventDefault();
});

// add tab functionality
$('ul.tabs').each(function() {
  // For each set of tabs, we want to keep track of
  // which tab is active and it's associated content
  var $active, $content, $links = $(this).find('a');
  // If the location.hash matches one of the links, use that as the active tab.
  // If no match is found, use the first link as the initial active tab.
  $active = $($links.filter('[href="'+location.hash+'"]')[0] || $links[0]);
  $active.closest('li').addClass('active');
  $content = $($active[0].hash);
  // Hide the remaining content
  $links.not($active).each(function () {
    $(this.hash).hide();
  });
  // Bind the click event handler
  $(this).on('click', 'a', function(e) {
    // Make the old tab inactive.
    $active.closest('li').removeClass('active');
    $content.hide();
    // Update the variables with the new link and content
    $active = $(this);
    $content = $(this.hash);
    // Make the tab active.
    $active.closest('li').addClass('active');
    $content.show();
    // Prevent the anchor's default click action
    e.preventDefault();
  });
});

// what to do at the beginning and end of window resizing
var resizeTimeout;
var spinner = '<div class="grey-screen">'
            + '<div class="spinner"><img src="img/spinner.gif" /></div>'
            + '</div>';
$(window).on('resize', function() {
  if (resizeTimeout === undefined) {
    $('#main').append(spinner);
    $('#plot .inner-ratio').append(spinner);
  }
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = undefined;
    $('.grey-screen').remove();
  }, 1000);
});

// display alerts
var alertEnum = {SUCCESS: 0,
              INFO: 1,
              WARNING: 2,
              DANGER: 3},
    alertClasses = ["alert-success",
                    "alert-info",
                    "alert-warning",
                    "alert-danger"];
function showAlert(type, message, link) {
  var html = '<div class="alert '+alertClasses[type]+'" role="alert">'
           + message
           + (link ? ' (<a href="#" class="open-parameters">'
            + link+'</a>)' : '')+'</div>';
  $('#alerts').html(html);
}

// make the slide up/down w/ mouse over/out
$(function(){
  $("#bottom-nav").hide();
  $("#footer").hover( 
    function(){ $("#bottom-nav").slideDown(slideSpeed); },
    function(){ $("#bottom-nav").slideUp(slideSpeed); }
  );
});

// when the document has been loaded
$(document).ready(function() {
  // left sliders are hidden by default
  hideHorizontalSlider('#parameters');
});
