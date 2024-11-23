// Create context menu on installation.
browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
        id: 'spellCheck',
        title: 'Check Spelling',
        contexts: ['selection'] // Show only when text is highlighted
    });
});

// Handle context menu click
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'spellCheck' && info.selectionText) {
        const selectedText = info.selectionText;

        // Retrieve the API key from storage
        browser.storage.sync.get('apiKey', (data) => {
            const apiKey = data.apiKey;

            if (!apiKey) {
                // Notify the user to set the API key.
                browser.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'API Key Missing',
                    message: 'Please set your OpenAI API key in the extension settings.'
                });

                browser.runtime.openOptionsPage();

                return;
            }

            // Proceed with API request if the key exists
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: `Correct spelling: ${selectedText}` }]
                })
            })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error('Invalid API Key');
                        } else if (response.status === 429) {
                            throw new Error('Rate Limit Exceeded');
                        } else {
                            throw new Error(`API Error: ${response.status} ${response.statusText}`);
                        }
                    }

                    return response.json();
                })
                .then(data => {
                    const correctedText = data.choices[0].message.content;

                    // Send corrected text to content script.
                    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (browser.runtime.lastError) {
                            console.error('Error querying active tab:', browser.runtime.lastError);
                            return;
                        }

                        if (tabs && tabs.length > 0) {
                            browser.tabs.sendMessage(tabs[0].id, {
                                action: 'replaceText',
                                text: correctedText
                            }, (response) => {
                                if (browser.runtime.lastError) {
                                    console.error('Error sending message to content script:', browser.runtime.lastError);
                                    return;
                                }

                                if (response && response.success) {
                                    console.log('Text successfully replaced.');
                                } else {
                                    console.warn('Failed to replace text in content script.', response ? response.error : 'No response received.');
                                }
                            });
                        } else {
                            console.error('No active tab found to send the corrected text to.');
                        }
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    let errorMessage = 'An error occurred. Please try again.';
                    if (error.message.includes('Invalid API Key')) {
                        errorMessage = 'Invalid API Key. Please check your settings.';
                    } else if (error.message.includes('Rate Limit Exceeded')) {
                        errorMessage = 'Rate limit exceeded. Please wait and try again later.';
                    }

                    browser.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon.png',
                        title: 'Error',
                        message: errorMessage
                    });
                });
        });
    }
});
