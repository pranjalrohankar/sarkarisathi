const micBtn = document.getElementById('micBtn');
const recognizedDiv = document.getElementById('recognizedText');
const chatMessages = document.getElementById('chatMessages');
const textInput = document.getElementById('textInput');
const submitBtn = document.getElementById('submitText');

const API_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:8081/api/ask' 
    : '/api/ask';

let voiceEnabled = true;
const synth = window.speechSynthesis;

// Format AI response: bold, bullet points, line breaks, emojis
function formatResponse(text) {
    let html = text
        // Bold: **text** → <strong>text</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Bullet points: lines starting with • 
        .replace(/^• (.+)$/gm, '<span class="ai-bullet">• $1</span>')
        // Numbered points: 1. text
        .replace(/^(\d+)\. (.+)$/gm, '<span class="ai-step"><span class="step-num">$1</span> $2</span>')
        // Line breaks
        .replace(/\n/g, '<br>');
    return html;
}

// Utility to add message to UI
function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    if (isUser) {
        msgDiv.textContent = text;
    } else {
        msgDiv.innerHTML = formatResponse(text);
        
        // Add Tools (Repeat Button)
        const tools = document.createElement('div');
        tools.className = 'message-tools';
        tools.innerHTML = `
            <button class="tool-btn repeat-btn" title="Listen Again">
                <i data-lucide="volume-2" style="width:14px;height:14px;"></i> Suniye
            </button>
        `;
        msgDiv.appendChild(tools);
        
        // Tool Events
        tools.querySelector('.repeat-btn').addEventListener('click', () => speakText(text));
        
        // Auto-speak if enabled
        if (voiceEnabled) speakText(text);
    }
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (window.lucide) lucide.createIcons();
}

function speakText(text) {
    if (!synth) return;
    
    // Stop any current speech
    synth.cancel();
    
    // Clean text for speech (remove markdown symbols and emojis)
    const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/•/g, '')
        .replace(/\n/g, '. ')
        // This regex removes emojis
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a good Indian English or Hindi voice
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('en-IN')) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.pitch = 1.1; // Slightly warmer pitch
    utterance.rate = 0.95; // Slightly slower for elderly
    
    synth.speak(utterance);
}

// Voice Toggle logic
const toggleVoice = document.getElementById('toggleVoice');
const voiceStatus = document.getElementById('voiceStatus');
const voiceIcon = document.getElementById('voiceIcon');

toggleVoice.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    if (voiceEnabled) {
        voiceStatus.textContent = 'Voice: ON';
        voiceIcon.setAttribute('data-lucide', 'volume-2');
    } else {
        voiceStatus.textContent = 'Voice: OFF';
        voiceIcon.setAttribute('data-lucide', 'volume-x');
        synth.cancel();
    }
    if (window.lucide) lucide.createIcons();
});

// Check speech recognition support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.classList.add('listening');
        recognizedDiv.textContent = 'Listening...';
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        recognizedDiv.textContent = 'You said: ' + transcript;
        micBtn.classList.remove('listening');
        addMessage(transcript, true);
        askAI(transcript);
    };

    recognition.onerror = (event) => {
        recognizedDiv.textContent = 'Mic issue, please type instead.';
        micBtn.classList.remove('listening');
    };
} else {
    micBtn.style.display = 'none';
    recognizedDiv.textContent = 'Your browser does not support voice, please type.';
}

// Typing mode
submitBtn.addEventListener('click', () => {
    const typed = textInput.value.trim();
    if (typed) {
        addMessage(typed, true);
        textInput.value = '';
        askAI(typed);
    }
});

// Handle Enter key
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitBtn.click();
});

async function askAI(query) {
    recognizedDiv.textContent = 'SarkariDost is thinking...';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const token = localStorage.getItem('token');

    // Get current language from cookie (set by our language selector)
    const cookies = document.cookie.split('; ');
    const langCookie = cookies.find(row => row.startsWith('googtrans='));
    const currentLang = langCookie ? langCookie.split('/').pop() : 'en';

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ 
                query: query,
                lang: currentLang 
            })
        });
        
        const data = await res.json();
        
        // Remove typing indicator
        typingDiv.remove();

        if (res.status === 401) {
            addMessage('Beta, pehle login kar lo tabhi main sahi se madad kar paunga. [Login Here](login.html)', false);
            recognizedDiv.textContent = 'Please login.';
            return;
        }

        if (res.status === 403 && data.limitReached) {
            addMessage(data.response, false);
            recognizedDiv.textContent = 'Daily limit reached.';
            updateQueryBadge(0, 'Basic');
            return;
        }

        let answer = data.response;
        recognizedDiv.textContent = 'Response ready!';
        addMessage(answer, false);
        updateQueryBadge(data.remaining, data.plan);

    } catch (err) {
        if (typingDiv) typingDiv.remove();
        console.error('Fetch error:', err);
        addMessage('Something went wrong, please try again.', false);
    }
}

function updateQueryBadge(remaining, plan) {
    const badge = document.getElementById('queryBadge');
    if (!badge) return;

    if (plan === 'Basic') {
        badge.style.display = 'inline-block';
        badge.textContent = `Queries Left: ${remaining}/5`;
        badge.style.background = remaining === 0 ? 'rgba(255, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)';
    } else {
        badge.style.display = 'inline-block';
        badge.textContent = `${plan} Plan (Unlimited)`;
        badge.style.background = 'rgba(255, 255, 255, 0.2)';
    }
}

// Auto-ask if redirected from schemes page with ?scheme= parameter
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const scheme = params.get('scheme');
    if (scheme) {
        const query = `Tell me everything about ${scheme}`;
        addMessage(query, true);
        askAI(query);
    }
});
