const navToggle = document.getElementById('nav-toggle');
const navList = document.getElementById('nav-list');
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatWidget = document.querySelector('.chat-widget');
const chatForm = document.querySelector('.chat-form');
const chatStatus = document.querySelector('.chat-status');
const flowTabs = document.querySelectorAll('.flow-tab');
const flowPanels = document.querySelectorAll('.flow-panel');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
const flowTargetLinks = document.querySelectorAll('[data-flow-target]');
const actionButtons = document.querySelectorAll('[data-action]');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const setNavState = (isOpen) => {
    if (!navList || !navToggle) return;
    navList.classList.toggle('show', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
};

const handleToggle = () => {
    if (!navList || !navToggle) return;
    const isOpen = !navList.classList.contains('show');
    setNavState(isOpen);
};

const handleResize = () => {
    if (!navList || !navToggle) return;
    if (window.innerWidth > 768) {
        setNavState(true);
    } else {
        setNavState(false);
    }
};

const handleLinkClick = (event) => {
    if (
        window.innerWidth <= 768 &&
        event.target instanceof HTMLAnchorElement &&
        navList.contains(event.target)
    ) {
        setNavState(false);
    }
};

const setChatState = (isOpen) => {
    if (!chatPanel || !chatToggle) return;
    chatPanel.classList.toggle('open', isOpen);
    chatPanel.setAttribute('aria-hidden', String(!isOpen));
    chatToggle.setAttribute('aria-expanded', String(isOpen));
};

const handleChatToggle = () => {
    if (!chatPanel) return;
    const isOpen = chatPanel.classList.contains('open');
    const nextIsOpen = !isOpen;
    setChatState(nextIsOpen);
    if (nextIsOpen) {
        cycleChatAccent();
        document.getElementById('chat-name')?.focus();
    }
};

const cycleChatAccent = () => {
    if (!chatWidget) return;
    const isPink = chatWidget.classList.contains('accent-pink');
    const isPurple = chatWidget.classList.contains('accent-purple');
    if (!isPink && !isPurple) {
        chatWidget.classList.add('accent-purple');
        return;
    }
    chatWidget.classList.toggle('accent-pink');
    chatWidget.classList.toggle('accent-purple');
};

const handleChatSubmit = (event) => {
    event.preventDefault();
    if (!chatStatus) return;
    chatStatus.textContent = 'Thanks! Our team will reach out shortly.';
    chatForm?.reset();
    setTimeout(() => {
        chatStatus.textContent = '';
    }, 4000);
    setChatState(false);
};

const closeDropdowns = () => {
    dropdownToggles.forEach((toggle) => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.closest('.dropdown')?.classList.remove('open');
    });
};

const toggleDropdown = (button) => {
    const parent = button.closest('.dropdown');
    if (!parent) return;
    const isOpen = parent.classList.contains('open');
    closeDropdowns();
    if (!isOpen) {
        parent.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
    }
};

const handleDocumentClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (chatPanel?.classList.contains('open')) {
        if (
            target !== chatToggle &&
            !chatToggle?.contains(target) &&
            !chatPanel.contains(target)
        ) {
            setChatState(false);
        }
    }

    if (dropdownToggles.length && !target.closest('.dropdown')) {
        closeDropdowns();
    }
};

const handleKeydown = (event) => {
    if (event.key !== 'Escape') return;

    if (window.innerWidth <= 768 && navList?.classList.contains('show')) {
        setNavState(false);
        navToggle?.focus();
    }

    if (chatPanel?.classList.contains('open')) {
        setChatState(false);
        chatToggle?.focus();
    }

    const openDropdown = document.querySelector('.dropdown.open');
    if (openDropdown) {
        closeDropdowns();
        openDropdown.querySelector('.dropdown-toggle')?.focus();
    }
};

const setActiveFlow = (flowId) => {
    if (!flowTabs.length || !flowPanels.length) return;

    flowTabs.forEach((tab) => {
        const isActive = tab.dataset.flow === flowId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
    });

    flowPanels.forEach((panel) => {
        const isActive = panel.dataset.flowPanel === flowId;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
    });
};

if (navToggle && navList) {
    if (!navToggle.hasAttribute('aria-expanded')) {
        navToggle.setAttribute('aria-expanded', 'false');
    }

    navToggle.addEventListener('click', handleToggle);
    window.addEventListener('resize', handleResize);
    navList.addEventListener('click', handleLinkClick);

    handleResize();
}

if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', handleChatToggle);
}

chatForm?.addEventListener('submit', handleChatSubmit);
document.addEventListener('keydown', handleKeydown);
document.addEventListener('click', handleDocumentClick);

if (dropdownToggles.length) {
    dropdownToggles.forEach((toggle) => {
        if (!toggle.hasAttribute('aria-expanded')) {
            toggle.setAttribute('aria-expanded', 'false');
        }
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleDropdown(toggle);
        });
    });

    document.querySelectorAll('.dropdown-menu a').forEach((link) => {
        link.addEventListener('click', () => {
            closeDropdowns();
        });
    });
}

if (flowTabs.length) {
    flowTabs.forEach((tab) => {
        tab.addEventListener('click', () => setActiveFlow(tab.dataset.flow));
    });

    const initialFlow = document.querySelector('.flow-tab.active')?.dataset.flow || flowTabs[0].dataset.flow;
    setActiveFlow(initialFlow);
}

flowTargetLinks.forEach((link) => {
    link.addEventListener('click', () => {
        const targetFlow = link.dataset.flowTarget;
        if (targetFlow) {
            setActiveFlow(targetFlow);
        }
        closeDropdowns();
    });
});

const handleFeatureAction = (action) => {
    const smoothScrollTo = (selector) => {
        const el = document.querySelector(selector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    switch (action) {
        case 'choose-payment':
            smoothScrollTo('#pay-collect');
            alert('Select card, QR, wallet, or cashless options inside Pay & Collect.');
            break;
        case 'merchant-login':
            smoothScrollTo('#merchant-portal');
            alert('Use the Merchant Portal to log in or register your store.');
            break;
        case 'connect-wifi':
            smoothScrollTo('#wifi-access');
            alert('Open your device WiFi settings to join the nearest eJuuz hotspot.');
            break;
        default:
            break;
    }
};

if (actionButtons.length) {
    actionButtons.forEach((button) => {
        button.addEventListener('click', () => handleFeatureAction(button.dataset.action));
    });
}

const currentYearEl = document.getElementById('current-year');
if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
}

if (!prefersReducedMotion.matches) {
    document.documentElement.style.setProperty('scroll-behavior', 'smooth');
}

// Header scroll functionality
const header = document.querySelector('header');
let lastScrollTop = 0;

const handleScroll = () => {
    if (!header) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
};

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll(); // Check initial scroll position
