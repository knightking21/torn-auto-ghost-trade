// ==UserScript==
// @name     		TopAreaNav
// @namespace   top.areaNav
// @version  		1.1.0
// @description Places Area Navigation Menu on top
// @grant    		none
// @run-at   		document-end
// @match    		https://www.torn.com/*
// @author   		AndersAngstrom [3690608]
// @license  		Private to AndersAngstrom [3690608] – cannot be used or duplicated in any form
// @icon     		https://www.google.com/s2/favicons?sz=64&domain=torn.com
// ==/UserScript==

(() => {
  'use strict';
  
  // Configuration options
  const config = {
    scrollAmount: 400,       // Pixels to scroll on arrow click
    arrowWidth: '24px',      // Width of navigation arrows
    arrowColor: 'white',     // Color of arrow text
    borderColor: '#000',     // Border color between nav elements
    buttonBgColor: '#1a1a1a', // Background color for arrow buttons
    safetyTimeout: 10000     // Maximum time to wait for elements before stopping observation (ms)
  };
  
  // Create the UI components once the target element is found
  const setupNavigationUI = () => {
    const wrapper = document.querySelector('.areasWrapper');
    if (!wrapper) return false;
    
    const content = wrapper.querySelector('.toggle-content___BJ9Q9');
    if (!content) return false;
    
    // Clone the original content
    const clonedContent = content.cloneNode(true);
    
    // Style the cloned content container
    Object.assign(clonedContent.style, {
      display: 'flex',
      overflowX: 'auto', // 'auto' is more cross-browser compatible than 'scroll'
      width: '100%',
      flex: '1',
      msOverflowStyle: 'none', // IE and Edge
      scrollbarWidth: 'thin', // Firefox
      WebkitOverflowScrolling: 'touch' // Smooth scrolling for iOS Safari
    });
    
    // Hide the scrollbar in WebKit browsers while keeping functionality
    clonedContent.classList.add('custom-scrollbar');
    
    // Style all navigation elements
    const navElements = clonedContent.querySelectorAll('[id^="nav-"]');
    navElements.forEach(nav => {
      Object.assign(nav.style, {
        flex: '0 0 auto',
        width: 'auto',
        height: 'auto',
        boxSizing: 'border-box',
        borderRight: `2px solid ${config.borderColor}`
      });
      
      // Style area rows
      const areaRow = nav.querySelector('[class^="area-row"]');
      if (areaRow) {
        areaRow.style.borderRadius = '0';
        
        // Style desktop links
        const desktopLink = areaRow.querySelector('.desktopLink___SG2RU');
        if (desktopLink) {
          desktopLink.style.flexDirection = 'column';
          desktopLink.style.padding = '8px';
        }
      }
    });
    
    // Create parent container with flex layout
    const parentContainer = document.createElement('div');
    Object.assign(parentContainer.style, {
      position: 'relative',
      //marginTop: '2px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });
    
    // Create navigation arrows with improved styling
    const createArrowButton = (text, direction) => {
      // Use button for semantic correctness but also create a div for Safari compatibility
      const button = document.createElement('button');
      button.setAttribute('type', 'button'); // Explicitly set type for accessibility
      button.setAttribute('aria-label', direction < 0 ? 'Scroll left' : 'Scroll right');
      button.textContent = text;
      
      // Apply styles that work across browsers
      Object.assign(button.style, {
        cursor: 'pointer',
        height: '100%',
        width: config.arrowWidth,
        color: config.arrowColor,
        backgroundColor: config.buttonBgColor,
        border: 'none',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        fontSize: '16px',
        fontWeight: 'bold',
        userSelect: 'none',      // Prevent text selection
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none',    // Firefox
        msUserSelect: 'none',     // IE/Edge
        webkitAppearance: 'none', // Remove default styling in WebKit browsers
        appearance: 'none'        // Remove default styling in modern browsers
      });
      
      // Add click event listener
      button.addEventListener('click', () => {
        // Cross-browser smooth scrolling
      if ('scrollBehavior' in document.documentElement.style) {
        // Modern browsers that support smooth scrolling
        clonedContent.scrollBy({
          left: direction * config.scrollAmount,
          behavior: 'smooth'
        });
      } else {
        // Fallback for browsers that don't support ScrollToOptions with behavior
        smoothScrollPolyfill(clonedContent, direction * config.scrollAmount);
      }
      });
      
      return button;
    };
    
    // Create left and right navigation buttons
    const leftArrow = createArrowButton('◀', -1);
    const rightArrow = createArrowButton('▶', 1);
    
    // Assemble the components
    parentContainer.appendChild(leftArrow);
    parentContainer.appendChild(clonedContent);
    parentContainer.appendChild(rightArrow);
    
    // Add the custom navigation to the page
    const targetElement = document.querySelector('.content');
    if (targetElement) {
      targetElement.insertAdjacentElement('beforebegin', parentContainer);
      
      // Hide the original wrapper to avoid duplication
      wrapper.style.display = 'none';
      
      // Add keyboard navigation support with cross-browser event handling
      const handleKeydown = (e) => {
        // Get the event object in a cross-browser way
        const event = e || window.event;
        const key = event.key || event.keyCode;
        
        // Only handle keyboard events when our element is visible
        if (parentContainer.offsetParent !== null) {
          // Check for arrow keys by key name or keyCode (for older browsers)
          if (key === 'ArrowLeft' || key === 'Left' || key === 37) {
            leftArrow.click();
            // Prevent default browser scrolling behavior
            if (event.preventDefault) event.preventDefault();
            return false;
          } else if (key === 'ArrowRight' || key === 'Right' || key === 39) {
            rightArrow.click();
            // Prevent default browser scrolling behavior
            if (event.preventDefault) event.preventDefault();
            return false;
          }
        }
      };
      
      // Add event listener with cross-browser support
      if (document.addEventListener) {
        document.addEventListener('keydown', handleKeydown, false);
      } else if (document.attachEvent) {
        // For older IE versions
        document.attachEvent('onkeydown', handleKeydown);
      }
      
      // Also add touch swipe support for mobile browsers
      let touchStartX = 0;
      let touchEndX = 0;
      
      clonedContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      clonedContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
      
      const handleSwipe = () => {
        const swipeThreshold = 100; // Minimum distance for a swipe
        if (touchEndX < touchStartX - swipeThreshold) {
          // Swipe left, scroll right
          rightArrow.click();
        } else if (touchEndX > touchStartX + swipeThreshold) {
          // Swipe right, scroll left
          leftArrow.click();
        }
      };
      
      return true;
    }
    
    return false;
  };
  
  // Polyfill for smooth scrolling in browsers that don't support scrollBy with behavior option
  const smoothScrollPolyfill = (element, amount) => {
    const startTime = performance.now();
    const startScrollLeft = element.scrollLeft;
    const duration = 300; // Duration of animation in milliseconds
    
    const animateScroll = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime < duration) {
        // Easing function - easeInOutQuad
        let progress = elapsedTime / duration;
        progress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const newScrollLeft = startScrollLeft + amount * progress;
        element.scrollLeft = newScrollLeft;
        
        window.requestAnimationFrame(animateScroll);
      } else {
        // Ensure we end at the exact destination
        element.scrollLeft = startScrollLeft + amount;
      }
    };
    
    window.requestAnimationFrame(animateScroll);
  };
  
  // Add custom CSS to the page
  const addCustomStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide scrollbar while maintaining functionality - cross-browser approach */
      .custom-scrollbar {
        scrollbar-width: thin; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
      }
      .custom-scrollbar::-webkit-scrollbar {
        height: 4px; /* Chrome, Safari, newer versions of Opera */
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #222;
      }
      /* For older browsers and Safari - hide scrollbar visually */
      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        .custom-scrollbar {
          overflow-y: overlay;
        }
      }
    `;
    document.head.appendChild(style);
  };
  
  // Use a more efficient observer setup with safety timeout
  const setupObserver = () => {
    // Add custom styles first
    addCustomStyles();
    
    // Feature detection for MutationObserver
    const MutationObserverImpl = window.MutationObserver || 
                                window.WebKitMutationObserver || 
                                window.MozMutationObserver;
    
    if (!MutationObserverImpl) {
      console.warn('Torn Navigation Enhancer: MutationObserver not supported. Falling back to interval check.');
      // Fallback for older browsers that don't support MutationObserver
      const checkInterval = setInterval(() => {
        if (setupNavigationUI()) {
          clearInterval(checkInterval);
          console.log('Torn Navigation Enhancer: Navigation UI created through interval check');
        }
      }, 500);
      
      // Safety timeout to avoid infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('Torn Navigation Enhancer: Timed out waiting for elements');
      }, config.safetyTimeout);
      
      return;
    }
    
    // Create an observer instance
    const observer = new MutationObserverImpl((mutations, obs) => {
      if (setupNavigationUI()) {
        // Disconnect observer once the navigation is set up
        obs.disconnect();
        console.log('Torn Navigation Enhancer: Navigation UI successfully created');
      }
    });
    
    // Safety timeout to prevent infinite observation
    const safetyTimer = setTimeout(() => {
      observer.disconnect();
      console.warn('Torn Navigation Enhancer: Timed out waiting for elements');
    }, config.safetyTimeout);
    
    // Start observing with optimized settings
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    // Attempt to set up navigation immediately in case the elements are already loaded
    if (setupNavigationUI()) {
      clearTimeout(safetyTimer);
      observer.disconnect();
      console.log('Torn Navigation Enhancer: Navigation UI created immediately');
    }
  };
  
  // Check browser compatibility and initialize the script
  const isBrowserCompatible = () => {
    // Feature detection for essential features
    const hasQuerySelector = !!document.querySelector;
    const hasEventListener = !!window.addEventListener;
    const hasCreateElement = !!document.createElement;
    
    return hasQuerySelector && hasEventListener && hasCreateElement;
  };
  
  // Run the script only if browser is compatible
  if (isBrowserCompatible()) {
    // Handle older browsers that don't have console.log
    if (typeof console === 'undefined') {
      window.console = { 
        log: function(){},
        warn: function(){},
        error: function(){}
      };
    }
    
    // Wait for DOM to be ready in a cross-browser way
    if (document.readyState === 'loading') {
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', setupObserver);
      } else {
        window.attachEvent('onload', setupObserver);
      }
    } else {
      // DOM already loaded
      setupObserver();
    }
  } else {
    // Log error for incompatible browsers
    if (window.console && console.error) {
      console.error('Torn Navigation Enhancer: Your browser lacks required features to run this script.');
    }
  }
})();
