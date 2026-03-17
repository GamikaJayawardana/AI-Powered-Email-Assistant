document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const customInstructionsInput = document.getElementById('popupCustomInstructions');

  // Load saved state
  chrome.storage.local.get(['extensionEnabled', 'customInstructions'], (result) => {
    // Default to true if not set
    const isEnabled = result.extensionEnabled !== false;
    enableToggle.checked = isEnabled;
    updateStatusUI(isEnabled);

    if (result.customInstructions) {
      customInstructionsInput.value = result.customInstructions;
    }
  });

  // Handle toggle change
  enableToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ extensionEnabled: isEnabled });
    updateStatusUI(isEnabled);
  });

  // Handle custom instructions save on typing (debounce not strictly needed for local storage, but good practice. using blur/input here)
  let timeoutId;
  customInstructionsInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      chrome.storage.local.set({ customInstructions: e.target.value });
    }, 500); // Save half a second after user stops typing
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
