window.addEventListener('keydown', function(event) {
  if ('key' in event) {
    console.log('KeyboardEvent.key:', event.key);
  } else {
    console.setStatus('KeyboardEvent.key is not supported.');
  }
});