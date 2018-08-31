$(document).ready(function(){

  //////////
  // Global variables
  //////////

  var _window = $(window);
  var _document = $(document);
  var easingSwing = [.02, .01, .47, 1]; // default jQuery easing for anime.js
  var moveEasing = [0.77, 0, 0.175, 1];

  ////////////
  // READY - triggered when PJAX DONE
  ////////////
  function pageReady(){
    legacySupport();
    initPreloader();
    updateHeaderActiveClass();
    initWrapText();
    // initHeaderScroll();

    initSliders();
    initCustomScroll();
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
	$(document)
    .on('click', '[href="#"]', function(e) {
  		e.preventDefault();
  	})
    .on('click', '[js-scroll-to]', function() { // section scroll
      var el = $('[data-scroll="'+$(this).data('target')+'"]')
      var offset = $(el).offset().top - 30

      anime({
        targets: "html, body",
        scrollTop: offset,
        easing: moveEasing, // swing
        duration: 800
      });

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

  ///////////
  // WRAP LONG TEXT TO EACH LINE SPAN
  //////////
  function initWrapText(){
    $('.hero__title').each(function(i,title){
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

    if ( $slider.length === 0 ){ return }

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
    var sliderManager = new Hammer.Manager(document.querySelector('[js-home-slider]'), {
      // domEvents: true
    });
    sliderManager.add(
      new Hammer.Pan({
        direction: Hammer.DIRECTION_HORIZONTAL,
        threshold: 0,
        // domEvents: true,
        pointers: 0 }
      )
    );

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
  function initCustomScroll(){

    var $scrollable = $('[js-page-scroll]');
    var calcTransform = 0
    $scrollable.css({

    })
  }

  ////////////
  // TELEPORT PLUGIN
  ////////////
  function initTeleport(){
    $('[js-teleport]').each(function (i, val) {
      var self = $(val)
      var objHtml = $(val).html();
      var target = $('[data-teleport-target=' + $(val).data('teleport-to') + ']');
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

  // project transition
  var ProjectTransition = Barba.BaseTransition.extend({
    start: function() {
      Promise
        .all([this.newContainerLoading, this.startAnimation()])
        .then(this.landAnimation.bind(this));
    },

    startAnimation: function() {
      console.log('startAnimation triggered', this)
      var originalEl = $(this.oldContainer).find(lastClickEl);
      originalEl.closest('.home').addClass('is-transitioning');

      this._newContainerPromise
        .then(function(res){
          var $newContainer = $(res);
          $newContainer.css({
            'position': 'absolute',
            'top': 0,
            'left': 0,
            'right': 0,
            'visibility': 'visible',
            'opacity': 0
          });
        })



      var deferred = Barba.Utils.deferred();
      setTimeout(function(){
        deferred.resolve();
      }, 500) // timeout for moveout animation
      return deferred.promise
    },

    landAnimation: function() {
      console.log('landAnimation triggered')
      var _this = this;

      var $newContainer = $(this.newContainer);
      $newContainer.css({
        'position': 'absolute',
        'top': 0,
        'left': 0,
        'right': 0,
        'visibility': 'visible',
        'opacity': 0
      });

      // var originalEl = $(this.oldContainer).find(lastClickEl);

      // TODO - do some kind of image preloading ?

      // scroll body
      anime({
        targets: "html, body",
        scrollTop: 200,
        easing: moveEasing, // swing
        duration: 800
      });

      // fadeOut oldContainer
      anime({
        targets: this.oldContainer,
        opacity : 0,
        easing: easingSwing, // swing
        duration: 300
      })

      // show new Container
      // (kind of blending should happens)
      // TODO - might be workable with .show / .hide toggle also
      anime({
        targets: $newContainer.get(0),
        opacity: 1,
        easing: easingSwing, // swing
        duration: 300,
        complete: function(anim) {
          // triggerBody()
          _this.done();
        }
      });

    }
  });

  // transition logic
  var lastClickEl;
  Barba.Pjax.getTransition = function() {
    var transitionObj = FadeTransition; // default transition

    // route specific transitions
    if ( $(lastClickEl).attr('href') === 'project.html' ){
      transitionObj = ProjectTransition;
    }
    return transitionObj;
  };

  Barba.Prefetch.init();
  Barba.Pjax.start();

  // event handlers
  Barba.Dispatcher.on('initStateChange', function(currentStatus){
    var container = Barba.Pjax.Dom.getContainer()
    var haveContainer = $(container).find('.page__content').length > 0

    if ( !haveContainer){
      // handle error - redirect ot page regular way
      window.location.href = currentStatus.url
    }

  });

  Barba.Dispatcher.on('linkClicked', function(el) {
    lastClickEl = el; // save last click to detect transition type
  });

  Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container, newPageRawHTML) {
    pageReady();
    closeMobileMenu();
  });

  // some plugins get bindings onNewPage only that way
  function triggerBody(){
    // _window.scrollTop(0);
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
  if ( $(this).is('.is-wrapped') === false ) { // prevent double wrapping
    $(this).addClass('is-wrapped')
    var content = $(this).html().split("\n");
    var buildStr = ""
    $.each(content, function(i, line){
      buildStr += "<span>" + line + "</span>"
    })

    $(this).html(buildStr)
  }

};
