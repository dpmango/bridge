$(document).ready(function(){

  //////////
  // Global variables
  //////////

  var _window = $(window);
  var _document = $(document);

  ////////////
  // READY - triggered when PJAX DONE
  ////////////
  function pageReady(){
    legacySupport();
    initPreloader();
    updateHeaderActiveClass();
    initWrapText();
    initHeaderScroll();

    initSliders();
    initTeleport();
    _window.on('resize', debounce(setBreakpoint, 200))
  }

  // this is a master function which should have all functionality
  pageReady();

  //////////
  // COMMON
  //////////

  function legacySupport(){
    // svg support for laggy browsers
    svg4everybody();

    // Viewport units buggyfill
    window.viewportUnitsBuggyfill.init({
      force: true,
      refreshDebounceWait: 150,
      appendToBody: true
    });
  }


  // Prevent # behavior
	_document
    .on('click', '[href="#"]', function(e) {
  		e.preventDefault();
  	})
    .on('click', 'a[href^="#section"]', function() { // section scroll
      var el = $(this).attr('href');
      $('body, html').animate({
          scrollTop: $(el).offset().top}, 1000);
      return false;
    })


  function initPreloader(){
    setTimeout(function(){
      $('.preloader').addClass('is-loaded')
    }, 1500)
  }

  // HEADER SCROLL
  // add .header-static for .page or body
  // to disable sticky header
  function initHeaderScroll(){
    _window.on('scroll', throttle(function(e) {
      var vScroll = _window.scrollTop();
      var header = $('.header').not('.header--static');
      var headerHeight = header.height();
      var firstSection = _document.find('.page__content div:first-child()').height() - headerHeight;
      var visibleWhen = Math.round(_document.height() / _window.height()) >  2.5

      if (visibleWhen){
        if ( vScroll > headerHeight ){
          header.addClass('is-fixed');
        } else {
          header.removeClass('is-fixed');
        }
        if ( vScroll > firstSection ){
          header.addClass('is-fixed-visible');
        } else {
          header.removeClass('is-fixed-visible');
        }
      }
    }, 10));
  }


  // HAMBURGER TOGGLER
  _document.on('click', '[js-hamburger]', function(){
    $(this).toggleClass('is-active');
    $('.mobile-navi').toggleClass('is-active');
  });

  function closeMobileMenu(){
    $('[js-hamburger]').removeClass('is-active');
    $('.mobile-navi').removeClass('is-active');
  }

  // SET ACTIVE CLASS IN HEADER
  // * could be removed in production and server side rendering when header is inside barba-container
  function updateHeaderActiveClass(){
    $('.header__menu li').each(function(i,val){
      if ( $(val).find('a').attr('href') == window.location.pathname.split('/').pop() ){
        $(val).addClass('is-active');
      } else {
        $(val).removeClass('is-active')
      }
    });
  }

  // function wrapLine(that) {
  //   var a = $(that).html().replace(/\n/g, " \n<br/> ").split(" ");
  //   $.each(a, function(i, val) {
  //     if(!val.match(/\n/) && val!="") a[i] = '<span>' + val + '</span>';
  //   });
  //   $(that).html(a.join(" "));
  // };


  function initWrapText(){
    $('.slide-home__title').each(function(i,title){
      // wrapLine(title);
      $(title).lines()

    })
  }


  //////////
  // SLIDERS
  //////////

  function initSliders(){
    // https://codepen.io/dangodev/pen/bpjrRg

    // HOMEPAGE SLIDER
    var $slider = $('[js-home-slider]');
    var $slides = $slider.find('.home__slide');
    var numberOfSlides = $slides.length
    var activeSlide = 0 // first is the default
    var sensitivity = 25
    var transitionDuration = 400 // ms
    var timer

    // set widths
    function setSizes(){
      var containerWidth = $slider.parent().width()

      $slider.css({ 'width': containerWidth * numberOfSlides })
      $slides.css({ 'width': containerWidth })
    }

    setSizes();
    _window.on('resize', debounce(setSizes, 200))


    // hammer.js instance
    var sliderManager = new Hammer.Manager($slider.get(0));
    sliderManager.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
    sliderManager.on('pan', function(e) {
      var movePower = (e.deltaX * 1.2)
      var percentage = 100 / numberOfSlides * movePower / window.innerWidth;
      var transformPercentage = percentage - 100 / numberOfSlides * activeSlide;

      $slider.css({
        'transform': 'translate3d(' + transformPercentage + '%,0,0)'
      });

      if(e.isFinal) {
        if (e.velocityX > 1) {
          goToSlide(activeSlide - 1);
        } else if (e.velocityX < -1) {
          goToSlide(activeSlide + 1)
        } else {
          if (percentage <= -(sensitivity / numberOfSlides)) {
            goToSlide(activeSlide + 1);
          } else if (percentage >= (sensitivity / numberOfSlides)) {
            goToSlide(activeSlide - 1);
          } else {
            goToSlide(activeSlide );
          }
        }
      }
    });

    function goToSlide(number) {
      if (number < 0) {
        activeSlide = 0;
      } else if (number > numberOfSlides - 1) {
        activeSlide = numberOfSlides - 1
      } else {
        activeSlide = number;
      }

      $slider.addClass('is-animating');

      var percentage = -(100 / numberOfSlides) * activeSlide;
      $slider.css({
        'transform': 'translate3d(' + percentage + '%,0,0)'
      });

      clearTimeout( timer );
      timer = setTimeout( function() {
        $slider.removeClass('is-animating');
      }, transitionDuration );

      triggerBody();

    };

  }


  ////////////
  // TELEPORT PLUGIN
  ////////////
  function initTeleport(){
    $('[js-teleport]').each(function (i, val) {
      var self = $(val)
      var objHtml = $(val).html();
      var target = $('[data-teleport-target=' + $(val).data('teleport-to') + ']');
      console.log($(val))
      var conditionMedia = $(val).data('teleport-condition').substring(1);
      var conditionPosition = $(val).data('teleport-condition').substring(0, 1);

      if (target && objHtml && conditionPosition) {

        function teleport() {
          var condition;

          if (conditionPosition === "<") {
            condition = _window.width() < conditionMedia;
          } else if (conditionPosition === ">") {
            condition = _window.width() > conditionMedia;
          }

          if (condition) {
            target.html(objHtml)
            self.html('')
          } else {
            self.html(objHtml)
            target.html("")
          }
        }

        teleport();
        _window.on('resize', debounce(teleport, 100));


      }
    })
  }


  //////////
  // BARBA PJAX
  //////////
  var easingSwing = [.02, .01, .47, 1]; // default jQuery easing for anime.js

  Barba.Pjax.Dom.containerClass = "page";

  var FadeTransition = Barba.BaseTransition.extend({
    start: function() {
      Promise
        .all([this.newContainerLoading, this.fadeOut()])
        .then(this.fadeIn.bind(this));
    },

    fadeOut: function() {
      var deferred = Barba.Utils.deferred();

      anime({
        targets: this.oldContainer,
        opacity : .5,
        easing: easingSwing, // swing
        duration: 300,
        complete: function(anim){
          deferred.resolve();
        }
      })

      return deferred.promise
    },

    fadeIn: function() {
      var _this = this;
      var $el = $(this.newContainer);

      $(this.oldContainer).hide();

      $el.css({
        visibility : 'visible',
        opacity : .5
      });

      anime({
        targets: "html, body",
        scrollTop: 1,
        easing: easingSwing, // swing
        duration: 150
      });

      anime({
        targets: this.newContainer,
        opacity: 1,
        easing: easingSwing, // swing
        duration: 300,
        complete: function(anim) {
          triggerBody()
          _this.done();
        }
      });
    }
  });

  // set barba transition
  Barba.Pjax.getTransition = function() {
    return FadeTransition;
  };

  Barba.Prefetch.init();
  Barba.Pjax.start();

  Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container, newPageRawHTML) {

    pageReady();
    closeMobileMenu();

  });

  // some plugins get bindings onNewPage only that way
  function triggerBody(){
    _window.scrollTop(0);
    $(window).scroll();
    $(window).resize();
  }

  //////////
  // DEVELOPMENT HELPER
  //////////
  function setBreakpoint(){
    var wHost = window.location.host.toLowerCase()
    var displayCondition = wHost.indexOf("localhost") >= 0 || wHost.indexOf("surge") >= 0
    if (displayCondition){
      var wWidth = _window.width();

      var content = "<div class='dev-bp-debug'>"+wWidth+"</div>";

      $('.page').append(content);
      setTimeout(function(){
        $('.dev-bp-debug').fadeOut();
      },1000);
      setTimeout(function(){
        $('.dev-bp-debug').remove();
      },1500)
    }
  }

});


// JQUERY CUSTOM HELPER FUNCTIONS
$.fn.lines = function () {
  var content = $(this).html().split("\n");
  var buildStr = ""
  $.each(content, function(i, line){
    buildStr += "<span>" + line + "</span>"
  })

  $(this).html(buildStr)
};
