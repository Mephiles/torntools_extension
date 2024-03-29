'use strict';
(async () => {
  console.log('Script is starting');
  const year = new Date().getUTCFullYear();
  const now = Date.now();

  if (!(Date.UTC(year, 2, 28, 12) > now || Date.UTC(year, 3, 5, 12) < now)) {
    console.log('Date check passed');
  } else {
    return;
  }
  featureManager.registerFeature(
    'Easter Eggs',
    'event',
    () => settings.pages.competitions.easterEggs,
    initialiseDetector,
    enableDetector,
    null,
    null,
    null,
  );

  const EGG_SELECTOR = '#easter-egg-hunt-root .eggAnim___ktpqQ';
  function initialiseDetector() {
    const container = document.find('#mainContainer');

    if (container) {
      new MutationObserver((mutations, observer) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            const egg = node.matches(EGG_SELECTOR)
              ? node
              : node.querySelector(EGG_SELECTOR);
            if (egg) {
              highlightEgg(egg);
              observer.disconnect(); // Disconnect after finding the egg if you only need to find it once
              break; // Exit the loop after finding and handling the egg
            }
          }
        }
      }).observe(container, { childList: true, subtree: true });
    }
  }

  function enableDetector() {
    document.body.classList.add('tt-easter-highlight');

    for (const egg of document.findAll(EGG_SELECTOR)) {
      highlightEgg(egg);
    }
  }
  async function highlightEgg(egg) {
    const img = egg.querySelector('img');
    try {
      // Make sure the egg has been loaded.
      if (img && !img.complete) {
        console.log(
          'Image inside egg not yet loaded, setting load event listener',
        );
        img.addEventListener('load', () => highlightEgg(egg));
        return;
      } else {
        console.log('Egg is already loaded or no image to load');
      }

      if (!isVisible(egg)) {
        console.log('Egg is not visible', egg);
        egg.classList.add('hidden-egg');
        return;
      } else {
        console.log('Egg is visible');
      }

      const locationText = await calculateLocation(
        await requireElement(EGG_SELECTOR + ' img'),
      );
      console.log('Location calculated: ', locationText);

      let overlay = document.find('.tt-overlay');
      if (overlay) {
        overlay.classList.remove('tt-hidden');
        overlay.style.zIndex = '999';
      } else {
        console.error('Overlay element not found');
      }

      try {
        const popup = document.newElement({
          type: 'div',
          id: 'tt-easter-popup',
          class: 'tt-overlay-item',
          events: {}, // No click event here
          children: [
            document.newElement({
              type: 'div',
              text: 'Detected an easter egg!',
            }),
            document.newElement({
              type: 'div',
              text: `It's located near the ${locationText} of your screen.`,
            }),
            document.newElement({
              type: 'div',
              text: 'NOTE: Clicking on invisible eggs is a bad idea. It will decrease your spawn rates going forward. We try to detect and ignore them, occasionally one might still be highlighted.',
            }),
            document.newElement({
              type: 'button',
              class: 'tt-button-link',
              text: 'Close',
            }),
          ],
        });

        console.log('Popup created', popup);
        document.body.appendChild(popup);
        console.log('Popup appended to body');

        // Add event listener to close button in the popup
        popup.querySelector('.tt-button-link').addEventListener('click', () => {
          console.log('Close button clicked');
          popup.remove(); // Remove the popup
        });
      } catch (err) {
        console.error('Error creating or appending popup: ', err);
      }

      window.addEventListener('beforeunload', (event) => {
        if (egg.isConnected) {
          console.log('Egg is still connected on beforeunload');
          event.preventDefault();
          event.returnValue = 'Egg present.';
        }
      });

      // Add event listener to egg for click
      egg.addEventListener('click', () => {
        console.log('Egg clicked');
        let overlay = document.find('.tt-overlay');
        if (overlay) {
          overlay.classList.add('tt-hidden'); // Hide the overlay
          overlay.style = '';
        }
      });
    } catch (err) {
      console.error('Error in highlightEgg: ', err);
    }
  }

  alert('TornTools detected an easter egg on this page.');

  function isVisible(egg) {
    console.log('Checking visibility for egg', egg);

    // Find the 'img' element inside the 'egg' which is a button in this context
    const img = egg.querySelector('img');
    if (!img) {
      return false;
    }
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const context = canvas.getContext('2d');
    // Ensure the image has loaded before trying to draw it on the canvas
    if (img.complete && img.naturalHeight > 0) {
      context.drawImage(img, 0, 0);
      const imageData = context.getImageData(0, 0, img.width, img.height);
      return imageData.data.some((channel) => channel !== 0);
    } else {
      return false;
    }
  }

  async function calculateLocation(element) {
    if (!(element instanceof Element)) {
      console.error('calculateLocation called with a non-element', element);
      return 'unknown location'; // Return a default or error value
    }

    try {
      const { left, top, width, height } = element.getBoundingClientRect();
      console.log(
        `Element position - left: ${left}, top: ${top}, width: ${width}, height: ${height}`,
      );

      const centerX = left + width / 2;
      const centerY = top + height / 2;

      console.log(`Element center - X: ${centerX}, Y: ${centerY}`);

      const innerHeight = window.innerHeight;
      const innerWidth = window.innerWidth;

      const relativeHeight = centerY / innerHeight;
      const relativeWidth = centerX / innerWidth;

      console.log(
        `Relative position - Width: ${relativeWidth}, Height: ${relativeHeight}`,
      );

      let verticalText =
        relativeHeight < 0.25
          ? 'top'
          : relativeHeight > 0.75
          ? 'bottom'
          : 'center';
      let horizontalText =
        relativeWidth < 0.3 ? 'left' : relativeWidth > 0.7 ? 'right' : 'center';

      let text =
        verticalText === horizontalText
          ? verticalText
          : `${verticalText} ${horizontalText}`;

      if (
        relativeWidth > 1 ||
        relativeWidth < 0 ||
        relativeHeight > 1 ||
        relativeHeight < 0
      ) {
        text += ' (offscreen)';
      }

      console.log(`Calculated location text: ${text}`);
      return text;
    } catch (error) {
      console.error('Error calculating element location', error);
      return 'error in location calculation';
    }
  }
})();
