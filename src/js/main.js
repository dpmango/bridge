$(document).ready(function(){

  //////////
  // Global variables
  //////////

  var _window = $(window);
  var _document = $(document);
  var easingSwing = [.02, .01, .47, 1]; // default jQuery easing
  var moveEasing = [0.77, 0, 0.175, 1];
  var preloaderActive = true

  // globals for scroll
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

  // slider globals
  var winW = $(window).outerWidth(),
      winH = $(window).outerHeight();

  // Interaction
  var sliderN = 0, // Initial slide
      sliderQ = ($(".carousel .hero").length) - 1,
      sliderW = (winW);
      mouseInit = 0,
      mouseX = 0,
      swiping = false,
      mouseDist = 0,
      mouseDistAbs = 0,
      mouseThreshold = 200,
      movingLeft = false,
      movingRight = false,
      displacementX = 1500,
      displacementY = 0,
      transitioning = false,
      transitioningTime = 1
  ;

  ////////////
  // READY - triggered when PJAX DONE
  ////////////

  // Functions that should be called once only
  legacySupport();
  initPreloader();
  _window.on('resize', debounce(function(){initWrapText(true)}, 200))

  // functions called separatelly on transitionCompleted
  initAutoScroll();

  // onNewPageReady trigger
  function pageReady(fromPjax){
    initHeaderScroll();
    updateHeaderActiveClass();
    setBodyClass();
    initWrapText();
    initSliders(fromPjax);
    initScrollMonitor(fromPjax);
    closeMobileMenu();
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

  // GENERIC CLICK HANDLERS
	$(document)
    // Prevent # behavior
    .on('click', '[href="#"]', function(e) {
  		e.preventDefault();
  	})
    .on('click', 'a[data-href]', function(){
      Barba.Pjax.goTo($(this).data('href'))
    })
    // dissallow same link hard refresh for pjax
    .on('click', 'a[href]', function(e){
      if ( Barba.Pjax.transitionProgress ){
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.currentTarget.href === window.location.href) {
        e.preventDefault();
        e.stopPropagation();
      }
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
      $('.preloader').addClass('is-loaded');
      preloaderActive = false
    }, 1500)
  }

  // SCROLL DOCUMENT
  function scrollDocumentTo(to, cb){
    // should still trigger custom scroll functions
    // TODO - check
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

      // fixed kinetic scroll hiding header
      if ( vScroll <= 2 ){
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
    var headerDiffInPaddings = 0 // depreciated
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
  function updateHeaderActiveClass(){
    _document.find('.header__menu li').each(function(i,val){
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
  function initWrapText(resized){
    $('[js-wrap-spans]').each(function(i,title){
      $(title).lines(resized)
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

        if ( $this.data('scroll-to-viewport') === false ){
          return
        }

        // scroll to the viewport
        scrollDocumentTo(scrollTarget, function(){
          // pause on exiting viewport
          window.addEventListener('scroll', scrollListener, false);
        })
      }

      $this.addClass('is-playing');

      return false
    })


  // VIDEO HOVER
  _document
    .on('mouseover', '[js-video-hover]', function(){
      var $this = $(this);
      var video = $this.find('video').get(0);

      video.play()
    })
    .on('mouseout', '[js-video-hover]', function(){
      var $this = $(this);
      var video = $this.find('video').get(0);

      video.currentTime = 0;
      video.pause()
    })


  //////////
  // SLIDERS
  //////////

  function initSliders(fromPjax){

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

    var gallerySwiperInst = $('[js-swiper-gallery]');
    if ( fromPjax ){
      gallerySwiperInst = $('[js-swiper-gallery]')[1]
    }

    // cases slider
    if ( gallerySwiperInst && gallerySwiperInst.length > 0 ){
      var gallerySwiper = new Swiper(gallerySwiperInst.get(0), {
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
    }

    var casesSwiperInst = $('[js-swiper-extra]')
    if ( fromPjax ){
      casesSwiperInst = $('[js-swiper-extra]')[1]
    }

    if ( casesSwiperInst && casesSwiperInst.length > 0 ){
      // extra swiper
      var casesSwiper = new Swiper(casesSwiperInst.get(0), {
        slideClass: "s-extra__slide",
        slidesPerView: 'auto',
        spaceBetween: 75,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
        freeMode: true,
        // grabCursor: true,
        resistanceRatio: 0.85,
        freeModeMomentumRatio: 0.7,
        freeModeMomentumVelocityRatio: 0.8,
        freeModeMomentumBounceRatio: 0.6,
        freeModeSticky: true,
        breakpoints: {
          1440: {
            slidesOffsetBefore: 0,
            spaceBetween: 45
          },
        }
      });

    }

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



  // Swiping events
  $("body").on("mousedown", function(e) {
      e.preventDefault();
      swiping = true;
      mouseInit = e.clientX;
  }).on("touchstart", function(e) {
      swiping = true;
      mouseInit = e.originalEvent.touches[0].clientX;
  }).on("touchmove", function(e) {
      if (swiping) {
          mouseX = e.originalEvent.touches[0].clientX;
          slideIt();
      }
  }).on("mousemove", function(e) {
      if (swiping) {
          mouseX = e.clientX;
          slideIt();
      }
  }).on("mouseup touchend", function(e) {
      e.preventDefault();
      if (swiping) {
          slideEnd();
      }
  })

  // Scrolling events
  $(".carousel").on("mousewheel", function(event) {
      if (event.deltaY == -1) {
          if (sliderN < sliderQ && !transitioning) {
              transitioningTime = 2;
              transitioning = true;
              sliderN += 1;
              TweenMax.set(window, {
                  transitioning: false,
                  delay: 1
              })
          }
      } else if (event.deltaY == 1) {
          if (sliderN > 0 && !transitioning) {
              transitioningTime = 2;
              transitioning = true;
              sliderN -= 1;
              TweenMax.set(window, {
                  transitioning: false,
                  delay: 1
              })
          }
      }
  })

  function slideIt() {
      if (swiping) {
          transitioningTime = 1;
          // Swiping calculations
          mouseDist = mouseInit - mouseX;
          mouseDistAbs = Math.abs(mouseDist);

          // Detect Direction
          if (mouseDist < 0) {
              movingLeft = true;
              movingRight = false;
          } else if (mouseDist > 0) {
              movingRight = true;
              movingLeft = false;
          }
      }
  }

  function slideEnd() {
      swiping = false;
      if (mouseDistAbs > mouseThreshold && movingRight) {
          if (sliderN != sliderQ) {
              sliderN += 1;
          }
      } else if (mouseDistAbs > mouseThreshold && movingLeft) {
          if (sliderN != 0) {
              sliderN -= 1;
          }
      }
      movingLeft = false;
      movingRight = false;
      mouseDistAbs = 0;
      mouseDist = 0;
  }

  PIXI.utils.skipHello();
  var app = new PIXI.Application(winW, winH, {backgroundColor: 0x000000});
  document.getElementById("heroCanvas").appendChild(app.view);
  app.stage.interactive = true;

  // Global container
  var container = new PIXI.Container();
  app.stage.addChild(container);

  // Arrays
  var videoTexture = [];
  var video = [];
  var displacementSprite = [];
  var mask = [];
  var displacementFilter = [];
  var slide = [];

  $(".carousel .hero").each(function(i, el) {
      // Video texture
      videoTexture[i] = PIXI.Texture.fromVideo($(el).find("video source").attr("src"));
      videoTexture[i].baseTexture.source.loop = true;
      videoTexture[i].baseTexture.source.muted = true;
      videoTexture[i].wrapMode = PIXI.WRAP_MODES.REPEAT;

      // Video box
      video[i] = new PIXI.Sprite(videoTexture[i]);
      video[i].width = sliderW;
      video[i].height = sliderW * (9 / 16);
      video[i].x = i * sliderW;

      // Displacement maps
      displacementSprite[i] = PIXI.Sprite.fromImage('img/sliderDM.jpg');
      displacementSprite[i].width = sliderW;
      displacementSprite[i].wrapMode = PIXI.WRAP_MODES.REPEAT;

      // Masking wrap
      mask[i] = new PIXI.Graphics();
      mask[i].beginFill(0x808080);
      mask[i].drawRect(0, 0, sliderW, sliderW * (9 / 16) + 100);
      container.addChild(mask[i])

      slide[i] = new PIXI.Container();
      container.addChild(slide[i]);

      slide[i].addChild(video[i]);
      slide[i].addChild(displacementSprite[i]);
      slide[i].addChild(mask[i]);

      // Displacement Filter
      displacementFilter[i] = new PIXI.filters.DisplacementFilter(displacementSprite[i]);
      displacementFilter[i].scale.x = 0;
      displacementFilter[i].scale.y = 0;

      video[i].filters = [displacementFilter[i]]

      slide[i].mask = mask[i];
  })

  // Animate
  app.ticker.add(function() {
      $.each(video, function(i, el) {
          // Limits
          if (i == 0 && movingLeft && sliderN == 0 || i == sliderQ && movingRight && sliderN == sliderQ) {
              TweenMax.to(slide[i], transitioningTime, {
                  x: i * sliderW - (mouseDist / 10) - sliderW * sliderN,
              })
              TweenMax.to(video[i], transitioningTime, {
                  x: -(sliderW / 2) * (i - sliderN) + mouseDist / 20,
              })
              TweenMax.to(displacementSprite[i], transitioningTime, {
                  x: -(sliderW / 2) * (i - sliderN) + mouseDist / 20,
              })
          } else {
              TweenMax.to(slide[i], transitioningTime, {
                  x: i * sliderW - mouseDist - sliderW * sliderN,
              })
              if (winH > winW * 9 / 16) {

              } else {
                  TweenMax.to(video[i], transitioningTime, {
                      x: -(sliderW / 2) * (i - sliderN) + mouseDist / 2,
                  })
              }
              TweenMax.to(displacementSprite[i], transitioningTime, {
                  x: -(sliderW / 2) * (i - sliderN) + mouseDist / 2,
              })

              if (i == sliderN) { // Current Page
                  TweenMax.to(displacementFilter[i].scale, transitioningTime, {
                      x: 0 + mouseDist * displacementX / sliderW,
                  })
              } else if (i > sliderN) { // Next Page
                  TweenMax.to(displacementFilter[i].scale, transitioningTime, {
                      x: -displacementX + mouseDistAbs * displacementX / sliderW
                  })
              } else if (i < sliderN) { // Previous Page
                  TweenMax.to(displacementFilter[i].scale, transitioningTime, {
                      x: displacementX - mouseDistAbs * displacementX / sliderW
                  })
              }
          }
      })
      $(".carousel .hero").each(function(i, el) {
          // Limits
          if (i == 0 && movingLeft && sliderN == 0 || i == sliderQ && movingRight && sliderN == sliderQ) {
              TweenMax.to($(el), transitioningTime, {
                  x: i * sliderW - mouseDist / 10 - sliderW * sliderN,
              })
          } else {
              TweenMax.to($(el), transitioningTime, {
                  x: i * sliderW - mouseDist - sliderW * sliderN,
              })
          }
      })
  });

  // Responsive behavior
  $(window).on("resize", function() {
      resizing();
  })

  resizing();

  function resizing() {
      winW = $(window).outerWidth();
      sliderW = winW;
      winH = $(window).outerHeight();

      app.renderer.resize(window.innerWidth, window.innerHeight);

      $.each(video, function(i, el) {
          mask[i].height = winH;
          mask[i].width = sliderW;
          if (winH > winW * 9 / 16) {
              video[i].height = winH;
              video[i].width = winH * 16 / 9;
              video[i].x = winW / 2 - video[i].width / 2;
              video[i].y = winH / 2 - video[i].height / 2;
          } else {
              video[i].width = sliderW;
              video[i].height = sliderW * 9 / 16;
              video[i].x = winW / 2 - video[i].width / 2;
              video[i].y = winH / 2 - video[i].height / 2;
              mask[i].drawRect(0, 0, sliderW, sliderW * (9 / 16) + 100);
          }
      })
  }

  //Remove the base slider videos after extracting data to avoid extra load
  $(".carousel video").remove();

  ////////////
  // CUSTOM SCROLL
  ////////////

  var scrollInterval // store timeout session for autoscroll
  function initAutoScroll(){

    // AUTO SCROLL FOR THE ABOUT PAGE
    if ( $('[js-auto-scroll]').length > 0 ) {
      scrollInterval = setInterval(function(){
        window.scrollBy(0, 1);
      }, 60);
    } else {
      clearTimeout(scrollInterval)
    }

  }



  window.addEventListener("load", onLoad);

  function onLoad() {
    updateScroller();
    window.focus();
    window.addEventListener("resize", onResizeScroller);
    document.addEventListener("scroll", onScrollScroller);
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

  function onScrollScroller(e) {
    // TODO
    // decrease speed

    scroller.scrollRequest++;
    if (!requestId) {
      requestId = requestAnimationFrame(updateScroller);
    }
  }

  function onResizeScroller() {
    scroller.resizeRequest++;
    if (!requestId) {
      requestId = requestAnimationFrame(updateScroller);
    }
  }



  ////////////
  // REVEAL FUNCTIONS
  ////////////
  function initScrollMonitor(fromPjax){
    $('[js-reveal]').each(function(i, el){
      var type = $(el).data('type') || "enterViewport"

      if ( type === "onload" ){
        var interval = setInterval(function(){
          if (!preloaderActive){
            if ( fromPjax ){
              // wait till transition overlay is fullyanimated
              setTimeout(function(){
                $(el).addClass('is-animated');
                clearInterval(interval)
              }, 600)
            } else {
              $(el).addClass('is-animated');
              clearInterval(interval)
            }
          }
        }, 100)
        return
      }

      if ( type === "halflyEnterViewport"){
        var scrollListener = throttle(function(){
          var vScrollBottom = _window.scrollTop() + _window.height();
          var elTop = $(el).offset().top
          var triggerPoint = elTop + ( $(el).height() / 2)

          console.log(vScrollBottom, triggerPoint, vScrollBottom > triggerPoint )

          if ( vScrollBottom > triggerPoint ){
            $(el).addClass('is-animated');
            window.removeEventListener('scroll', scrollListener, false); // clear debounce func
          }
        }, 100)

        window.addEventListener('scroll', scrollListener, false);
        return
      }

    });
  }


  //////////
  // BARBA PJAX
  //////////

  Barba.Pjax.Dom.containerClass = "page";

  var OverlayTransition = Barba.BaseTransition.extend({
    start: function() {
      Promise
        .all([this.newContainerLoading, this.fadeOut()])
        .then(this.fadeIn.bind(this));
    },

    fadeOut: function() {
      var deferred = Barba.Utils.deferred();

      // store overlay globally to access in fadein
      this.$overlay = $('<div class="js-transition-overlay"></div>')
      this.$overlay.insertAfter(".header");
      $('.header').removeClass('is-dark').removeClass('is-scrolling-down')

      TweenLite.fromTo(this.$overlay, .6, {
        x: "0%"
      }, {
        x: "100%",
        ease: Quart.easeIn,
        onComplete: function() {
          deferred.resolve()
        }
      })

      return deferred.promise
    },

    fadeIn: function() {
      var _this = this; // copy to acces inside animation callbacks
      var $el = $(this.newContainer);

      $(this.oldContainer).hide();

      $el.css({
        'visibility': 'visible'
      })

      anime({
        targets: "html, body",
        scrollTop: 1,
        easing: easingSwing, // swing
        duration: 150
      });

      TweenLite.fromTo(this.$overlay, 1, {
        x: "100%",
        overwrite: "all"
      }, {
        x: "200%",
        ease: Expo.easeOut,
        delay: .2,
        onComplete: function(){
          _this.$overlay.remove()
          triggerBody()
          _this.done();
        }
      })

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
    var transitionObj = OverlayTransition; // default transition

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


  // The new container has been loaded and injected in the wrapper.

  Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container, newPageRawHTML) {
    pageReady(true);
  });

  // The transition has just finished and the old Container has been removed from the DOM.
  Barba.Dispatcher.on('transitionCompleted', function(currentStatus, oldStatus) {
    initAutoScroll()

    // scroller update on pjax
    var newScroller = document.querySelector("#scroller-js");
    scroller.target = newScroller;
    onResizeScroller()
  });

  // some plugins get bindings onNewPage only that way
  function triggerBody(){
    // _window.scrollTop(0);
    $(window).scroll();
    $(window).resize();
  }

});

function wrapByLine(el, content){
  var $cont = el

  // $cont.text()
  var text_arr = content.split(' ');

  for (i = 0; i < text_arr.length; i++) {
    text_arr[i] = '<span>' + text_arr[i] + ' </span>';
  }

  $cont.html(text_arr.join(''));

  $wordSpans = $cont.find('span');

  var lineArray = [],
      lineIndex = 0,
      lineStart = true

  $wordSpans.each(function(idx) {
    var pos = $(this).position();
    var top = pos.top;

    if (lineStart) {
      lineArray[lineIndex] = [idx];
      lineStart = false;
    } else {
      var $next = $(this).next();

      if ($next.length) {
        var isBreak = $next.html().indexOf("\n") !== -1
        if ($next.position().top > top || isBreak) {
          lineArray[lineIndex].push(idx);
          lineIndex++;
          lineStart = true
        }
      } else {
        lineArray[lineIndex].push(idx);
      }
    }
  });

  for (i = 0; i < lineArray.length; i++) {
    var start = lineArray[i][0],
        end = lineArray[i][1] + 1;

    if (!end) {
      $wordSpans.eq(start).wrap('<span class="line_wrap">')
    } else {
      $wordSpans.slice(start, end).wrapAll('<span class="line_wrap">');
    }
  }
}

// JQUERY CUSTOM HELPER FUNCTIONS
$.fn.lines = function (resized) {
  if ( $(this).is('.is-wrapped') === false || resized) { // prevent double wrapping
    var buildStr = ""

    if ( !resized ){
      $(this).addClass('is-wrapped')
      // backup content
      $(this).attr('data-text-original', $(this).html())

      // var content = $(this).html().split("\n");
      var content = $(this).text()
      wrapByLine($(this), content)
    } else {
      // assume that's in wrapped onReady
      // var content = $(this).attr('data-text-original').split("\n")
      var content = $(this).attr('data-text-original')
      wrapByLine($(this), content)
    }

    // $.each(content, function(i, line){
    //   buildStr += "<span>" + line + "</span>"
    // })
    //
    // $(this).html(buildStr)
  }
};
