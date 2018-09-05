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
    setBodyClass();
    initWrapText();
    initHeaderScroll();

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

      scrollDocumentTo(offset);

      return false;
    })


  // PRELOADER FUNCTION
  function initPreloader(){
    setTimeout(function(){
      $('.preloader').addClass('is-loaded')
    }, 1500)
  }

  // SCROLL DOCUMENT
  function scrollDocumentTo(to, cb){
    // var $scrollable = $('[js-page-scroll]');
    //
    // $scrollable.css({
    //   'transform': 'translate3d(0,-'+to+'px,0)'
    // }, function(){
    //
    // })

    var scrollAnime = anime({
      targets: "html, body",
      scrollTop: to,
      easing: moveEasing, // swing
      duration: 800
    });

    if ( cb !== undefined ){
      scrollAnime.complete = cb
    }
  }

  // HEADER SCROLL
  // add .header-static for .page or body
  // to disable sticky header
  function initHeaderScroll(){

    var prevScroll = 0; // store to check delta
    _window.on('scroll', throttle(function(e) {
      var vScroll = _window.scrollTop();
      var header = $('[js-header-scroll]');
      var isDown

      isDown = vScroll >= prevScroll ? true : false

      if ( isDown ){
        header.addClass('is-scrolling-down');
      } else {
        header.removeClass('is-scrolling-down');
      }

      // BACKGROUND COLOR DETECTOR
      controlHeaderColor(vScroll);

      prevScroll = vScroll
    }, 50));
  }

  function controlHeaderColor(vScroll){
    // Cache selectors
    var sections = $('[data-nav-color]');
    var headerHeight = $('.header').height();
    var headerDiffInPaddings = 25
    // Collect arr of past scroll elements
    var cur = sections.map(function(){
      var elTop = $(this).offset().top - parseInt($(this).css('marginTop'))
      if (elTop < vScroll + ((headerHeight + headerDiffInPaddings) / 2)){
        return this
      }
    });

    // Get current element
    cur = $(cur[cur.length-1]);
    var headerClass = cur && cur.length ? cur.data('nav-color') : ""

    if ( headerClass === "black" ){
      $('.header').addClass('is-dark')
    } else if ( headerClass === "white" ) {
      $('.header').removeClass('is-dark')
    }
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

  // UPDATE BODY CLASS ON PJAX
  function setBodyClass(){
    var source = $('[js-set-body-class]').last();
    var sourceClass = source.data("class");
    var body = $('body');
    var bodyClasses = body.attr('class').split(" ")
    var possibleClasses = ["homepage", "page-dark"]

    // console.log('sourceClass', sourceClass)
    // console.log('bodyClasses', bodyClasses)

    if ( source ){
      if ( bodyClasses.indexOf(sourceClass) === -1 ){
        body.addClass(sourceClass) // append new class if not present
      }
      // remove old
      $.each(bodyClasses, function(i, c){
        // remove if not a source and included in possibles
        if ( c !== sourceClass
             && possibleClasses.indexOf(c) !== - 1
           ){
             // console.log('removing', c)
          body.removeClass(c)
        }
      })

    }

  }

  ///////////
  // WRAP LONG TEXT TO EACH LINE SPAN
  //////////
  function initWrapText(){
    $('.hero__title').each(function(i,title){
      $(title).lines()
    })
  }

  ///////////////
  // VIDEO PLAYER
  ///////////////

  _document
    .on('click', '[js-video-player]', function(){
      var $this = $(this);
      var video = $this.find('video').get(0);

      var thisHeight = $this.outerHeight()
      var wHeight = _window.height()
      var offsetTop = $this.offset().top
      var offsetBottom = offsetTop + thisHeight

      var calcHeightOffset = ((offsetTop - offsetBottom) + wHeight) / 2
      // don't offset when viewport is smaller
      var moveOffset = calcHeightOffset >= 0 ? calcHeightOffset : 0
      var scrollTarget = offsetTop - moveOffset

      var scrollListener = debounce(function(){
        var wScroll = _window.scrollTop();
        // stops on 20% before viewport exit
        var sPastTop = wScroll < (offsetTop - wHeight + (offsetTop * 0.2))
        var sPastBottom = wScroll > (offsetBottom - (offsetBottom * 0.2))

        if ( sPastTop || sPastBottom ){
          video.pause();
          window.removeEventListener('scroll', scrollListener, false); // clear debounce func
        }
      }, 200)

      // functions bindings
      if ( !$this.is('.is-playing') ){
        playVideo();
      }  else {
        // a.k.a second click
        if ( video.paused ){
          playVideo();
        } else {
          window.removeEventListener('scroll', scrollListener, false); // clear debounce func
          video.pause();
        }
      }

      function playVideo(){
        video.play();

        // scroll to the viewport
        scrollDocumentTo(scrollTarget, function(){
          // pause on exiting viewport
          window.addEventListener('scroll', scrollListener, false);
        })
      }

      $this.addClass('is-playing');

      return false
    })


  //////////
  // SLIDERS
  //////////

  function initSliders(){

    // cases slider
    var casesSwiper = new Swiper('[js-cases-swiper]', {
      slideClass: "cases__slide",
      slidesPerView: 'auto',
      freeMode: true,
      // grabCursor: true,
      resistanceRatio: 0.85,
      freeModeMomentumRatio: 0.7,
      freeModeMomentumVelocityRatio: 0.8,
      freeModeMomentumBounceRatio: 0.6,
      freeModeSticky: true,
      scrollbar: {
        el: '.swiper-scrollbar',
        draggable: true,
      },
    });

    // cases slider
    var gallerySwiper = new Swiper('[js-swiper-gallery]', {
      slideClass: "media-wrapper",
      slidesPerView: 'auto',
      freeMode: true,
      // grabCursor: true,
      resistanceRatio: 0.85,
      freeModeMomentumRatio: 0.7,
      freeModeMomentumVelocityRatio: 0.8,
      freeModeMomentumBounceRatio: 0.6,
      freeModeSticky: true,
      navigation: {
        nextEl: '.image-gallery__next',
        prevEl: '.image-gallery__prev',
      },
      speed: 500,

    });

    gallerySwiper.on('slideChange', function(){
      if ( gallerySwiper.isEnd ){
        $('[js-swiper-gallery]').addClass('is-last-active');
      } else {
        $('[js-swiper-gallery]').removeClass('is-last-active');
      }
    })

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
    var scrollDistance = 0
    var minScrollDistance = 0
    var maxScrollDistane = $scrollable.height() - _window.height();

    $scrollable.on('mousewheel DOMMouseScroll', function(e){
      var delta = (e.originalEvent.wheelDelta || -e.originalEvent.detail);

      scrollDistance += e.originalEvent.deltaY * 0.8 // slow down by 20%
      if ( scrollDistance < minScrollDistance ){ scrollDistance = minScrollDistance }
      if ( scrollDistance > maxScrollDistane ){ scrollDistance = maxScrollDistane }

      // scrollDocumentTo(scrollDistance)

      // var page = document.querySelector('[js-page-scroll]')
      // TweenLite.to(page, 1, {
      //   // y: scrollDistance
      //   left: 200
      // });

      // anime({
      //   targets: $scrollable.get(0),
      //   translateY: '-' + scrollDistance,
      //   easing: 'easeInOutCubic',
      //   duration: 10
      // });

      return false
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


// SCROLL FUNCTION
// https://codepen.io/osublake/pen/QqPqbN

var html = document.documentElement;
var body = document.body;

var scroller = {
  target: document.querySelector("#scroller-js"),
  ease: 0.05, // <= scroll speed
  endY: 0,
  y: 0,
  resizeRequest: 1,
  scrollRequest: 0,
};

var requestId = null;

TweenLite.set(scroller.target, {
  rotation: 0.01,
  force3D: true
});

window.addEventListener("load", onLoad);

function onLoad() {
  updateScroller();
  window.focus();
  window.addEventListener("resize", onResize);
  document.addEventListener("scroll", onScroll);
}

function updateScroller() {

  var resized = scroller.resizeRequest > 0;

  if (resized) {
    var height = scroller.target.clientHeight;
    body.style.height = height + "px";
    scroller.resizeRequest = 0;
  }

  var scrollY = window.pageYOffset || html.scrollTop || body.scrollTop || 0;

  scroller.endY = scrollY;
  scroller.y += (scrollY - scroller.y) * scroller.ease;

  if (Math.abs(scrollY - scroller.y) < 0.05 || resized) {
    scroller.y = scrollY;
    scroller.scrollRequest = 0;
  }

  TweenLite.set(scroller.target, {
    y: -scroller.y
  });

  requestId = scroller.scrollRequest > 0 ? requestAnimationFrame(updateScroller) : null;
}

function onScroll(e) {
  // TODO
  // decrease speed

  scroller.scrollRequest++;
  if (!requestId) {
    requestId = requestAnimationFrame(updateScroller);
  }
}

function onResize() {
  scroller.resizeRequest++;
  if (!requestId) {
    requestId = requestAnimationFrame(updateScroller);
  }
}
