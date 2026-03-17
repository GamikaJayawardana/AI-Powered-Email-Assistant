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
 * Creates the AI Reply button with Gmail-native styling.
 */
function createAIButton() {
    const button = document.createElement('div');
    // Using Gmail's native button classes for a seamless look
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-btn';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
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
    const existingButton = document.querySelector('.ai-reply-btn');
    if (existingButton) {
        existingButton.remove();
    }

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Compose toolbar not found. Retrying...");
        return;
    }

    const button = createAIButton();
    
    button.addEventListener('click', async () => {
        console.log("AI Reply button clicked");
        try {
            const originalText = button.innerHTML;
            button.innerHTML = 'Generating...';
            // Note: 'div' buttons don't have a 'disabled' property like <button>, 
            // so we manage state visually or via pointer-events.
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';

            const emailContent = getEmailContent();
            
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    emailContent: emailContent,
                    tone: "professional"
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
            button.innerHTML = 'AI Reply';
            button.style.pointerEvents = 'auto';
            button.style.opacity = '1';
        }
    });

    // Insert at the beginning of the toolbar
    toolbar.insertBefore(button, toolbar.firstChild);
    console.log("AI button injected successfully");
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

observer.observe(document.body, { 
    childList: true, 
    subtree: true 
});