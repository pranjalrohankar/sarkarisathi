// Shared Navbar and Footer injection
const navbarHTML = `
<header id="header">
    <div class="container">
        <nav>
            <a href="index.html" class="logo">
                <span>🇮🇳</span> SarkariDost
            </a>

            <button class="hamburger" id="hamburger" aria-label="Menu">
                <i data-lucide="menu" style="width:24px;height:24px;"></i>
            </button>

            <div class="nav-right" id="navRight">
                <ul class="nav-links">
                    <li><a href="index.html" id="nav-home">Home</a></li>
                    <li><a href="assistant.html" id="nav-assistant">AI Assistant</a></li>
                    <li><a href="schemes.html" id="nav-schemes">Schemes</a></li>
                </ul>
                
                <div class="lang-selector">
                    <button class="lang-btn" id="langBtn">
                        <i data-lucide="globe" style="width:18px;height:18px;"></i> Language
                    </button>
                    <div class="lang-dropdown" id="langDropdown">
                        <div class="lang-item" data-lang="en">🇬🇧 English</div>
                        <div class="lang-item" data-lang="hi">🇮🇳 Hindi (हिंदी)</div>
                        <div class="lang-item" data-lang="mr">🟠 Marathi (मराठी)</div>
                        <div class="lang-item" data-lang="bn">🟢 Bengali (বাংলা)</div>
                        <div class="lang-item" data-lang="ta">🔴 Tamil (தமிழ்)</div>
                        <div class="lang-item" data-lang="te">🟡 Telugu (తెలుగు)</div>
                        <div class="lang-item" data-lang="gu">🟤 Gujarati (ગુજરાતી)</div>
                        <div class="lang-item" data-lang="kn">🟣 Kannada (ಕನ್ನಡ)</div>
                        <div class="lang-item" data-lang="ml">🔵 Malayalam (മലയാളം)</div>
                        <div class="lang-item" data-lang="pa">🟠 Punjabi (ਪੰਜਾਬੀ)</div>
                        <div class="lang-item" data-lang="or">⚪ Odia (ଓଡ଼ିଆ)</div>
                        <div class="lang-item" data-lang="as">🟢 Assamese (অসমীয়া)</div>
                        <div class="lang-item" data-lang="ur">🌙 Urdu (اردو)</div>
                    </div>
                </div>
                
                <div class="nav-cta" id="authSection">
                    <a href="login.html" class="btn btn-primary" style="padding: 10px 20px; font-size: 0.9rem;">Login / Signup</a>
                </div>

            </div>
        </nav>
    </div>
</header>
`;

const footerHTML = `
<footer>
    <div class="container">
        <div class="footer-content">
            <div class="footer-info">
                <div class="footer-logo">🇮🇳 SarkariDost</div>
                <p>Empowering every Indian citizen with easy access to government schemes through AI.</p>
            </div>
            <div class="footer-links">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="assistant.html">AI Assistant</a></li>
                    <li><a href="schemes.html">Schemes Catalog</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>Support</h4>
                <ul>
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">FAQs</a></li>
                    <li><a href="#">Contact Us</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 SarkariDost. Made with ❤️ for India.</p>
        </div>
    </div>
</footer>
`;

const initApp = () => {
    // Inject Navbar
    if (!document.getElementById('header')) {
        document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    }
    
    // Inject Footer
    if (!document.querySelector('footer')) {
        document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    // ... (rest of the logic)

    // Update Auth Section
    const authSection = document.getElementById('authSection');
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
        authSection.innerHTML = `
            <div class="user-profile-nav">
                <div class="user-info-text">
                    <span class="user-name">Hi, ${user.name.split(' ')[0]}</span>
                    <span class="user-plan-badge">${user.currentPlan} Plan</span>
                </div>
                <button id="logoutBtn" class="logout-link" title="Logout">
                    <i data-lucide="log-out" style="width:18px;height:18px;"></i>
                </button>
            </div>
        `;
        

    }

    // Inject Accessibility Panel
    const a11yHTML = `
    <div class="a11y-panel">
        <button class="a11y-btn" id="toggleLargeText" title="Toggle Large Text">
            <i data-lucide="type" style="width:24px;height:24px;"></i>
        </button>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', a11yHTML);

    // Initialize Lucide Icons in navbar/footer
    if (window.lucide) lucide.createIcons();

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const navRight = document.getElementById('navRight');
    hamburger.addEventListener('click', () => {
        navRight.classList.toggle('open');
    });

    // ====== Google Translate logic ... (kept same as before) ======
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'hi,mr,bn,ta,te,gu,kn,ml,pa,or,as,ur',
            autoDisplay: false
        }, 'google_translate_element');
    };

    const gtScript = document.createElement('script');
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(gtScript);

    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langItems = document.querySelectorAll('.lang-item');

    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (langDropdown) langDropdown.classList.remove('show');
    });

    langItems.forEach(item => {
        item.addEventListener('click', () => {
            const langCode = item.getAttribute('data-lang');
            langBtn.innerHTML = `<i data-lucide="globe" style="width:18px;height:18px;"></i> ${item.textContent}`;
            langDropdown.classList.remove('show');
            triggerTranslation(langCode);
            if (window.lucide) lucide.createIcons();
        });
    });

    function triggerTranslation(lang) {
        if (lang === 'en') {
            document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            window.location.reload();
            return;
        }
        document.cookie = `googtrans=/en/${lang}; path=/`;
        window.location.reload();
    }

    // Set active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const activeLink = document.querySelector(`.nav-links a[href="${currentPath}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Large Text Toggle Logic
    const toggleLargeText = document.getElementById('toggleLargeText');
    const isLargeText = localStorage.getItem('largeText') === 'true';
    
    if (isLargeText) {
        document.body.classList.add('large-text');
        toggleLargeText.classList.add('active');
    }

    if (toggleLargeText) {
        toggleLargeText.addEventListener('click', () => {
            const active = document.body.classList.toggle('large-text');
            toggleLargeText.classList.toggle('active');
            localStorage.setItem('largeText', active);
        });
    }
    // Expose functions to window for module support
    window.triggerTranslation = triggerTranslation;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
