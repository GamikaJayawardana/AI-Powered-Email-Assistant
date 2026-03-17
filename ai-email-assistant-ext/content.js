console.log("AI Email Reply Extension: Content script loaded");

/**
 * Finds the Gmail compose toolbar using multiple known selectors.
 */
function findComposeToolbar() {
    // Gmail often uses .btC (bottom bar) or .aDH (toolbar container)
    const selectors = ['.btC', '.aDH', '.gU.Up', '[role="toolbar"]'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            console.log(`Toolbar found with selector: ${selector}`);
            return toolbar;
        }
    }
    return null;
}

/**
 * Creates the AI UI container with Tone Select and Reply button.
 */
function createUIContainer() {
    const container = document.createElement('div');
    container.className = 'ai-reply-container';

    // Tone Selector
    const select = document.createElement('select');
    select.className = 'ai-tone-select';
    
    const options = [
        { value: '', label: 'Default' },
        { value: 'formal', label: 'Formal' },
        { value: 'casual', label: 'Casual' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'professional', label: 'Professional' }
    ];
    
    options.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        select.appendChild(optionEl);
    });

    // AI Button
    const button = document.createElement('div');
    button.className = 'ai-reply-btn';
    button.innerHTML = `
        <span class="ai-btn-icon">✨</span>
        <span class="ai-btn-text">AI Reply</span>
    `;
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');

    container.appendChild(select);
    container.appendChild(button);

    return { container, button, select };
}

/**
 * Scrapes the email content from the thread.
 */
function getEmailContent() {
    const selectors = ['.h7', '.a3s.ail', '.gmail_quote', '[role="presentation"]'];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content && content.innerText.trim()) {
            return content.innerText.trim();
        }
    }
    return '';
}

/**
 * Injects the AI button into the toolbar.
 */
async function injectButton() {
    const existingContainer = document.querySelector('.ai-reply-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Compose toolbar not found. Retrying...");
        return;
    }

    const { container, button, select } = createUIContainer();
    
    button.addEventListener('click', async () => {
        console.log("AI Reply button clicked");
        try {
            button.innerHTML = `
                <span class="ai-btn-icon loading-spin">⏳</span>
                <span class="ai-btn-text">Generating...</span>
            `;
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.8';

            const emailContent = getEmailContent();
            const tone = select.value || "professional"; // Default to professional if empty string
            
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    emailContent: emailContent,
                    tone: tone
                })
            });

            if (!response.ok) {
                throw new Error('API Request Failed');
            }

            const generatedReply = await response.text();
            
            // Find the Gmail compose text area
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('Compose Box was not found');
            }

        } catch (error) {
            console.error("Error generating reply:", error);
            alert('Failed to generate reply. Check if your local server is running at http://localhost:8080');
        } finally {
            button.innerHTML = `
                <span class="ai-btn-icon">✨</span>
                <span class="ai-btn-text">AI Reply</span>
            `;
            button.style.pointerEvents = 'auto';
            button.style.opacity = '1';
        }
    });

    // Insert at the beginning of the toolbar
    toolbar.insertBefore(container, toolbar.firstChild);
    console.log("AI container injected successfully");
}

/**
 * Observe the DOM for the appearance of the compose window.
 */
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDH, .btC, [role="dialog"]') || 
             node.querySelector('.aDH, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose window detected in DOM");
            // Gmail takes a moment to render the toolbar inside the window
            setTimeout(injectButton, 1000);
        }
    }
});

// State Management
let isExtensionEnabled = true;

function initExtension() {
    chrome.storage.local.get(['extensionEnabled'], (result) => {
        isExtensionEnabled = result.extensionEnabled !== false;
        
        if (isExtensionEnabled) {
            observer.observe(document.body, { childList: true, subtree: true });
            // Check if compose is already open
            if (document.querySelector('.aDH, .btC')) {
                injectButton();
            }
        }
    });

    // Listen for toggle changes from popup
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.extensionEnabled) {
            isExtensionEnabled = changes.extensionEnabled.newValue;
            if (isExtensionEnabled) {
                console.log("AI Extension enabled");
                observer.observe(document.body, { childList: true, subtree: true });
                if (document.querySelector('.aDH, .btC')) {
                    injectButton();
                }
            } else {
                console.log("AI Extension disabled");
                observer.disconnect();
                const existingContainer = document.querySelector('.ai-reply-container');
                if (existingContainer) {
                    existingContainer.remove();
                }
            }
        }
    });
}

initExtension();