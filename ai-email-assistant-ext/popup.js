document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Load saved state
  chrome.storage.local.get(['extensionEnabled'], (result) => {
    // Default to true if not set
    const isEnabled = result.extensionEnabled !== false;
    enableToggle.checked = isEnabled;
    updateStatusUI(isEnabled);
  });

  // Handle toggle change
  enableToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ extensionEnabled: isEnabled });
    updateStatusUI(isEnabled);
  });

  function updateStatusUI(isEnabled) {
    if (isEnabled) {
      statusDot.classList.remove('disabled');
      statusText.textContent = 'Extension Active';
    } else {
      statusDot.classList.add('disabled');
      statusText.textContent = 'Extension Paused';
    }
  }
});
