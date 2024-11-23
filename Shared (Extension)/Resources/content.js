browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'replaceText') {
        // Copy the corrected text to the clipboard.
        navigator.clipboard.writeText(message.text)
            .then(() => {
                console.log('Text copied to clipboard:', message.text);
            })
            .catch(err => {
                console.error('Failed to copy text:', err);
            });

        // Check if the active element is a textarea or an input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'TEXTAREA' || (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))) {
            // Get the current selection range
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;

            // Replace the selected text with the corrected text
            if (start !== end) {
                const value = activeElement.value;
                activeElement.value = value.slice(0, start) + message.text + value.slice(end);

                // Move the cursor to the end of the inserted text
                activeElement.setSelectionRange(start + message.text.length, start + message.text.length);

                sendResponse({ success: true });
            } else {
                console.error('No text is selected to replace in the textarea/input');
                sendResponse({ success: false, error: 'No text is selected to replace in the textarea/input' });
            }
        } else {
            // Handle regular content selection on the page
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                if (!range.collapsed) {
                    range.deleteContents();
                    const textNode = document.createTextNode(message.text);
                    range.insertNode(textNode);

                    // Move the selection range to after the inserted text
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);

                    selection.removeAllRanges();
                    selection.addRange(range);

                    textNode.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    sendResponse({ success: true });
                } else {
                    console.error('No text is selected to replace');
                    sendResponse({ success: false, error: 'No text is selected to replace' });
                }
            } else {
                console.error('No valid selection found');
                sendResponse({ success: false, error: 'No valid selection found' });
            }
        }

        // Allow async response
        return true;
    }
});
