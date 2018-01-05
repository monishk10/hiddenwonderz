var welcomeText = "Welcome to Hidden Wonderz";
$(".image-header").hover(
  // While entering the area
  function() {
    // Make the text's opacity to 1 to animate
    anime.timeline({loop: false})  
      .add({
      targets: '.animated-index-header',
      opacity: 1,
    });
    // Assign the text the welcomeText Value
    $('.animated-index-header').html(welcomeText);
    // Wrap every letter in a span
    $('.animated-index-header').each(function(){
      $(this).html($(this).text().replace(/([^\x00-\x80]|\w)/g, "<span class='letter'>$&</span>"));
    });
    // Start the actual animation
    anime.timeline({loop: false})
      .add({
        targets: '.animated-index-header .letter',
        scale: [4,1],
        opacity: [0,1],
        translateZ: 0,
        easing: "easeOutExpo",
        duration: 950,
        delay: function(el, i) {
          return 70*i;
        }
      });
    },
  // While exiting
  function() {
    anime.timeline({loop: false})  
      .add({
      targets: '.animated-index-header',
      opacity: 0,
      duration: 500,
      easing: "easeOutExpo"
    });
  }
);