// Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');
const apiKeyInput = document.getElementById('apiKey');
togglePassword.addEventListener('click', () => {
    const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyInput.setAttribute('type', type);
    togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

// Dark Mode Toggle
const toggleDarkMode = document.getElementById('toggleDarkMode');
toggleDarkMode.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    toggleDarkMode.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Save the API key
document.getElementById('settingsForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const apiKey = document.getElementById('apiKey').value;

    chrome.storage.sync.set({ apiKey: apiKey }, () => {
        const statusElement = document.getElementById('status');
        statusElement.style.display = 'block';
        statusElement.textContent = 'API Key saved successfully!';
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    });
});

// Load the saved API key on page load
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get('apiKey', (data) => {
        if (data.apiKey) {
            document.getElementById('apiKey').value = data.apiKey;
        }
    });
});
