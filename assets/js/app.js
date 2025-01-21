jQuery(document).ready(function ( $ ) {
    "use strict";
    $('.mobile-nav-btn').click(function () {
        $('nav').fadeToggle('fast');
        $(this).toggleClass('open');

    });

    $(window).on('resize', function () {

        if ($(window).width() >= 992) {

            $('nav').css('display', 'block');
            $('.mobile-nav-btn').removeClass('open');

        } else if ($(window).width() <= 991) {
            $('nav').css('display', 'none');
        }
    });
});