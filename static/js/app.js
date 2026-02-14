$(document).ready(function(){
    $('.food-slider').slick({
         autoplay:true,
         slidesToShow: 3,
         slidesToScroll: 1,
         prevArrow:".prev-btn",
         nextArrow:".next-btn",
         responsive:[
            {
                breakpoint:1199.9,
                settings:{
                    slidesToShow: 2,
                }
            },
            {
                breakpoint:768,
                settings:{
                    slidesToShow: 1,
                }
            }
         ]


    });

   function closeMenu(){
    $('.site-content-wrapper').removeClass('scaled');
    $('body').removeClass('menu-open');
}

$('.nav-trigger').click(function(){
    $('.site-content-wrapper').toggleClass('scaled');
    $('body').toggleClass('menu-open');
});

/* 🔥 EMPTY AREA CLICK CLOSE */
$('#menuOverlay').click(function(){
    closeMenu();
});

/* 🔥 BACK BUTTON / PAGE LOAD FIX */
$(window).on('pageshow', function(){
    closeMenu();
});

/* 🔥 MENU ITEM CLICK PAR BHI CLOSE */
$('.mobile-nav a').click(function(){
    closeMenu();
});

    
});



