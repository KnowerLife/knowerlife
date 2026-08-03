let toolsPromise;
const loadTools = () => {
  toolsPromise ||= import('./tools.js').catch((error) => {
    console.error('Tools failed to load:', error);
    document.documentElement.dataset.toolsError = 'true';
  });
  return toolsPromise;
};
const intentEvents = ['pointerdown', 'focusin', 'keydown', 'touchstart'];
const loadOnIntent = () => {
  intentEvents.forEach((eventName) => document.removeEventListener(eventName, loadOnIntent, true));
  loadTools();
};
intentEvents.forEach((eventName) => document.addEventListener(eventName, loadOnIntent, { capture: true, once: true, passive: eventName !== 'keydown' }));
window.addEventListener('load', () => {
  if ('requestIdleCallback' in window) requestIdleCallback(loadTools, { timeout: 1200 });
  else setTimeout(loadTools, 500);
}, { once: true });
