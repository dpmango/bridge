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
    initHeaderScroll();

    initSliders();
    // development helper
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
      force: false,
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

  //////////
  // SLIDERS
  //////////

  function initSliders(){

    // HOMEPAGE SLIDER


  }


  ////////////
  // UI
  ////////////

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
