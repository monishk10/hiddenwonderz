// Wrap every letter in a span
$('.anime-text .letters').each(function(){
  $(this).html($(this).text().replace(/([^\x00-\x80]|\w)/g, "<span class='letter'>$&</span>"));
});

$(".index-header").hover(
  function() {
    anime.timeline({loop: false})
    .add({
      targets: '.anime-text .letter',
      translateY: ["1.1em", 0],
      translateZ: 0,
      duration: 1200,
      delay: function(el, i) {
        return 50 * i;
      }
    });
  },
  // While exiting
  function() {
  }
);