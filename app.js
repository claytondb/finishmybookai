// FinishMyBookAI - AI-powered story completion

// State
let apiKey = '';
let currentStory = '';
let savedStories = [];

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const storyInput = document.getElementById('story-input');
const wordCountEl = document.getElementById('word-count');
const generateBtn = document.getElementById('generate-btn');
const apiKeyInput = document.getElementById('api-key');
const apiStatus = document.getElementById('api-status');
const outputSection = document.getElementById('output-section');
const outputText = document.getElementById('output-text');
const outputWords = document.getElementById('output-words');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingTip = document.getElementById('loading-tip');
const savedStoriesEl = document.getElementById('saved-stories');

// Loading tips
const loadingTips = [
    'Analyzing your narrative style...',
    'Understanding character voices...',
    'Building on your plot threads...',
    'Crafting the next scene...',
    'Maintaining narrative consistency...',
    'Adding emotional depth...',
    'Weaving in foreshadowing...',
    'Polishing the prose...'
];

// Initialize
function init() {
    loadApiKey();
    loadSavedStories();
    setupEventListeners();
    updateGenerateButton();
}

function setupEventListeners() {
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Story input
    storyInput.addEventListener('input', () => {
        updateWordCount();
        updateGenerateButton();
    });

    // API key
    document.getElementById('save-key-btn').addEventListener('click', saveApiKey);

    // Generate
    generateBtn.addEventListener('click', generateContinuation);

    // Output controls
    document.getElementById('copy-output').addEventListener('click', copyOutput);
    document.getElementById('regenerate').addEventListener('click', generateContinuation);
    document.getElementById('continue-more').addEventListener('click', continueMore);
}

function handleFileDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) readFile(file);
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        storyInput.value = e.target.result;
        updateWordCount();
        updateGenerateButton();
    };
    reader.readAsText(file);
}

function updateWordCount() {
    const text = storyInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCountEl.textContent = words.toLocaleString();
}

function updateGenerateButton() {
    const hasText = storyInput.value.trim().length > 50;
    const hasKey = apiKey.length > 0;
    generateBtn.disabled = !(hasText && hasKey);
    
    if (!hasKey) {
        generateBtn.textContent = '🔑 Add API Key to Continue';
    } else if (!hasText) {
        generateBtn.textContent = '📝 Add More Story Text (min 50 chars)';
    } else {
        generateBtn.textContent = '✨ Continue My Story';
    }
}

function saveApiKey() {
    apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('finishmybook-apikey', apiKey);
        apiStatus.textContent = '✅ API key saved';
        apiStatus.classList.add('connected');
        apiKeyInput.value = '••••••••••••••••';
        updateGenerateButton();
    }
}

function loadApiKey() {
    const saved = localStorage.getItem('finishmybook-apikey');
    if (saved) {
        apiKey = saved;
        apiKeyInput.value = '••••••••••••••••';
        apiStatus.textContent = '✅ API key loaded';
        apiStatus.classList.add('connected');
    }
}

async function generateContinuation() {
    if (!apiKey || !storyInput.value.trim()) return;

    // Get settings
    const genre = document.getElementById('genre').value;
    const tone = document.getElementById('tone').value;
    const length = document.getElementById('length').value;
    const direction = document.getElementById('direction').value;
    const maintainPov = document.getElementById('maintain-pov').checked;
    const matchStyle = document.getElementById('match-style').checked;

    // Build prompt
    const prompt = buildPrompt(storyInput.value, {
        genre, tone, length, direction, maintainPov, matchStyle
    });

    // Show loading
    showLoading();

    try {
        const response = await callOpenAI(prompt);
        displayOutput(response);
    } catch (error) {
        alert('Error generating continuation: ' + error.message);
        console.error(error);
    } finally {
        hideLoading();
    }
}

function buildPrompt(story, options) {
    const lengthGuides = {
        paragraph: '100 words',
        section: '500 words',
        chapter: '1500 words',
        ending: 'until a satisfying conclusion'
    };

    let systemPrompt = `You are a skilled creative writer helping to continue an unfinished story. Your task is to write a seamless continuation that:

- Maintains the same narrative voice and writing style
- Keeps character personalities consistent
- Follows established plot threads
- Uses similar sentence structure and vocabulary
- Matches the tone and pacing of the original`;

    if (options.maintainPov) {
        systemPrompt += '\n- Maintains the same point of view throughout';
    }

    if (options.genre !== 'auto') {
        systemPrompt += `\n- Fits within the ${options.genre} genre`;
    }

    if (options.tone !== 'match') {
        systemPrompt += `\n- Has a ${options.tone} tone`;
    }

    let userPrompt = `Continue the following story for approximately ${lengthGuides[options.length]}. Pick up exactly where it leaves off, maintaining all established elements.

${options.direction ? `Direction: ${options.direction}\n\n` : ''}STORY SO FAR:
${story.slice(-8000)}

CONTINUATION:`;

    return { systemPrompt, userPrompt };
}

async function callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt.systemPrompt },
                { role: 'user', content: prompt.userPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.8
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function displayOutput(text) {
    outputText.textContent = text;
    outputSection.style.display = 'block';
    const words = text.trim().split(/\s+/).length;
    outputWords.textContent = words.toLocaleString();
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

function copyOutput() {
    navigator.clipboard.writeText(outputText.textContent);
    const btn = document.getElementById('copy-output');
    const original = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = original, 2000);
}

function continueMore() {
    // Append generated text to input and generate more
    storyInput.value += '\n\n' + outputText.textContent;
    updateWordCount();
    generateContinuation();
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
    let tipIndex = 0;
    loadingTip.textContent = loadingTips[0];
    
    window.loadingInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % loadingTips.length;
        loadingTip.textContent = loadingTips[tipIndex];
    }, 2000);
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    if (window.loadingInterval) {
        clearInterval(window.loadingInterval);
    }
}

// Saved stories
function saveCurrentStory() {
    const title = prompt('Name this story:', 'Untitled Story');
    if (!title) return;

    const story = {
        id: Date.now(),
        title,
        content: storyInput.value,
        continuation: outputText.textContent,
        date: new Date().toLocaleDateString()
    };

    savedStories.push(story);
    localStorage.setItem('finishmybook-stories', JSON.stringify(savedStories));
    renderSavedStories();
}

function loadSavedStories() {
    const saved = localStorage.getItem('finishmybook-stories');
    if (saved) {
        savedStories = JSON.parse(saved);
        renderSavedStories();
    }
}

function renderSavedStories() {
    if (savedStories.length === 0) {
        savedStoriesEl.innerHTML = '<p class="empty-state">No saved projects yet</p>';
        return;
    }

    savedStoriesEl.innerHTML = savedStories.map(s => `
        <div class="saved-story" onclick="loadStory(${s.id})">
            <span class="title">📖 ${s.title}</span>
            <span class="date">${s.date}</span>
            <button class="delete-btn" onclick="deleteStory(${s.id}); event.stopPropagation();">✕</button>
        </div>
    `).join('');
}

function loadStory(id) {
    const story = savedStories.find(s => s.id === id);
    if (story) {
        storyInput.value = story.content;
        if (story.continuation) {
            outputText.textContent = story.continuation;
            outputSection.style.display = 'block';
        }
        updateWordCount();
        updateGenerateButton();
    }
}
window.loadStory = loadStory;

function deleteStory(id) {
    savedStories = savedStories.filter(s => s.id !== id);
    localStorage.setItem('finishmybook-stories', JSON.stringify(savedStories));
    renderSavedStories();
}
window.deleteStory = deleteStory;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
