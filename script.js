// Interactive Portfolio JavaScript

// Sound System using Web Audio API
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.isEnabled = true;
        this.volume = 0.4;
        this.init();
    }

    async init() {
        try {
            // Initialize AudioContext on first user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (error) {
            console.log('Web Audio API not supported:', error);
        }
    }

    createSounds() {
        // Create soft click sounds for all interactions
        this.sounds = {
            click: this.createSoftClickSound('standard'),
            hover: this.createSoftClickSound('subtle'),
            navigation: this.createSoftClickSound('navigation'),
            button: this.createSoftClickSound('button'),
            keypress: this.createSoftClickSound('standard'),
            success: this.createSoftClickSound('success'),
            notification: this.createSoftClickSound('notification')
        };
    }

    createSoftClickSound(type = 'standard') {
        return () => {
            if (!this.audioContext || !this.isEnabled) return;

            const currentTime = this.audioContext.currentTime;
            
            // Mellower sound configurations with warmer, lower frequencies
            const soundConfig = {
                'standard': { freq: 280, duration: 0.12, volume: 0.12 },
                'subtle': { freq: 240, duration: 0.10, volume: 0.06 },
                'navigation': { freq: 320, duration: 0.11, volume: 0.10 },
                'button': { freq: 360, duration: 0.13, volume: 0.14 },
                'success': { freq: 420, duration: 0.15, volume: 0.16 },
                'notification': { freq: 380, duration: 0.12, volume: 0.13 }
            };

            const config = soundConfig[type] || soundConfig['standard'];
            
            // Create main click oscillator with warmer tone
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const warmthFilter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(warmthFilter);
            warmthFilter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Warmer sine wave with slight triangle wave blend for mellowness
            oscillator.frequency.setValueAtTime(config.freq, currentTime);
            oscillator.type = 'sine';
            
            // Primary low-pass filter for softness
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(config.freq * 1.5, currentTime); // Lower cutoff for mellowness
            filter.Q.setValueAtTime(0.7, currentTime); // Gentle resonance for warmth
            
            // Secondary warmth filter to reduce any remaining harshness
            warmthFilter.type = 'lowpass';
            warmthFilter.frequency.setValueAtTime(config.freq * 2.5, currentTime);
            warmthFilter.Q.setValueAtTime(0.3, currentTime); // Very gentle
            
            // Much smoother envelope with gradual attack and extended release
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * config.volume * 0.3, currentTime + 0.008); // Slower attack
            gainNode.gain.linearRampToValueAtTime(this.volume * config.volume, currentTime + 0.015); // Peak
            gainNode.gain.exponentialRampToValueAtTime(this.volume * config.volume * 0.6, currentTime + config.duration * 0.4); // Sustain
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + config.duration); // Gentle release
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + config.duration);
            
            // Add warm sub-harmonic for depth and richness
            const subHarmonic = this.audioContext.createOscillator();
            const subGain = this.audioContext.createGain();
            const subFilter = this.audioContext.createBiquadFilter();
            
            subHarmonic.connect(subFilter);
            subFilter.connect(subGain);
            subGain.connect(this.audioContext.destination);
            
            subHarmonic.frequency.setValueAtTime(config.freq * 0.5, currentTime); // Sub-harmonic for warmth
            subHarmonic.type = 'triangle'; // Warmer waveform
            
            subFilter.type = 'lowpass';
            subFilter.frequency.setValueAtTime(config.freq * 1.2, currentTime);
            subFilter.Q.setValueAtTime(0.5, currentTime);
            
            subGain.gain.setValueAtTime(0, currentTime);
            subGain.gain.linearRampToValueAtTime(this.volume * config.volume * 0.2, currentTime + 0.012);
            subGain.gain.exponentialRampToValueAtTime(0.001, currentTime + config.duration * 0.8);
            
            subHarmonic.start(currentTime + 0.003);
            subHarmonic.stop(currentTime + config.duration);
            
            // Add gentle harmonic for richness (for all types, but very subtle)
            const harmonic = this.audioContext.createOscillator();
            const harmonicGain = this.audioContext.createGain();
            const harmonicFilter = this.audioContext.createBiquadFilter();
            
            harmonic.connect(harmonicFilter);
            harmonicFilter.connect(harmonicGain);
            harmonicGain.connect(this.audioContext.destination);
            
            harmonic.frequency.setValueAtTime(config.freq * 1.2, currentTime); // Closer harmonic for mellowness
            harmonic.type = 'sine';
            
            harmonicFilter.type = 'lowpass';
            harmonicFilter.frequency.setValueAtTime(config.freq * 2, currentTime);
            harmonicFilter.Q.setValueAtTime(0.4, currentTime);
            
            const harmonicVolume = type === 'success' || type === 'button' ? 0.25 : 0.15;
            harmonicGain.gain.setValueAtTime(0, currentTime);
            harmonicGain.gain.linearRampToValueAtTime(this.volume * config.volume * harmonicVolume, currentTime + 0.015);
            harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + config.duration * 0.6);
            
            harmonic.start(currentTime + 0.008);
            harmonic.stop(currentTime + config.duration);
            
            // Extremely subtle texture noise (much reduced)
            if (type !== 'subtle') {
                const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * config.duration, this.audioContext.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                
                for (let i = 0; i < noiseData.length; i++) {
                    noiseData[i] = (Math.random() * 2 - 1) * 0.02; // Even lower noise level
                }
                
                const noiseSource = this.audioContext.createBufferSource();
                const noiseGain = this.audioContext.createGain();
                const noiseFilter = this.audioContext.createBiquadFilter();
                
                noiseSource.buffer = noiseBuffer;
                noiseSource.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(this.audioContext.destination);
                
                noiseFilter.type = 'bandpass'; // Bandpass instead of highpass for mellowness
                noiseFilter.frequency.setValueAtTime(config.freq * 0.8, currentTime);
                noiseFilter.Q.setValueAtTime(2, currentTime); // Narrow band for subtlety
                
                noiseGain.gain.setValueAtTime(0, currentTime);
                noiseGain.gain.linearRampToValueAtTime(this.volume * 0.02, currentTime + 0.005);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + config.duration * 0.4);
                
                noiseSource.start(currentTime + 0.002);
            }
        };
    }



    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

// Initialize sound system
const soundSystem = new SoundSystem();

// Theme Management System
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        // Check for saved theme preference or default to 'light'
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.setupToggleButton();
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff');
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Play theme toggle sound
        soundSystem.play('button');
        
        // Add a subtle animation effect
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    setupToggleButton() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // Add keyboard support
            toggleButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeInteractiveElements();
    initializeNavigation();
    initializeAnimations();
    
    // Add sound effects to all clickable elements
    function addSoundEffects() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                soundSystem.play('navigation');
            });
            
            link.addEventListener('mouseenter', () => {
                soundSystem.play('hover');
            });
        });

        // Buttons
        document.querySelectorAll('button, .btn, .email-btn').forEach(button => {
            button.addEventListener('click', () => {
                soundSystem.play('button');
            });
            
            button.addEventListener('mouseenter', () => {
                soundSystem.play('hover');
            });
        });

        // Interactive cards and elements
        document.querySelectorAll('.info-card, .project-card, .contact-item').forEach(card => {
            card.addEventListener('click', () => {
                soundSystem.play('click');
            });
            
            card.addEventListener('mouseenter', () => {
                soundSystem.play('hover');
            });
        });

        // Logo click
        document.querySelector('.logo-text')?.addEventListener('click', () => {
            soundSystem.play('success');
        });

        // Form inputs
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('focus', () => {
                soundSystem.play('click');
            });
            
            input.addEventListener('input', () => {
                soundSystem.play('keypress');
            });
        });
    }

    // Keyboard event sounds
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'Enter':
                soundSystem.play('button');
                break;
            case 'Escape':
                soundSystem.play('notification');
                break;
            case 'Tab':
                soundSystem.play('navigation');
                break;
            case ' ': // Spacebar
                if (e.target.tagName === 'BUTTON' || e.target.classList.contains('btn')) {
                    soundSystem.play('button');
                }
                break;
            default:
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    soundSystem.play('keypress');
                }
        }
    });

    // Initialize sound effects after user interaction
    document.addEventListener('click', function initSounds() {
        if (soundSystem.audioContext && soundSystem.audioContext.state === 'suspended') {
            soundSystem.audioContext.resume();
        }
        addSoundEffects();
        document.removeEventListener('click', initSounds);
    }, { once: true });

    // Add sound toggle button to the page
    function createSoundToggle() {
        const soundToggle = document.createElement('button');
        soundToggle.innerHTML = '🔊';
        soundToggle.className = 'sound-toggle';
        soundToggle.title = 'Toggle Sound Effects';
        soundToggle.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #333;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        soundToggle.addEventListener('click', () => {
            const isEnabled = soundSystem.toggle();
            soundToggle.innerHTML = isEnabled ? '🔊' : '🔇';
            soundToggle.title = isEnabled ? 'Disable Sound Effects' : 'Enable Sound Effects';
            
            // Play a test sound when enabling
            if (isEnabled) {
                soundSystem.play('success');
            }
        });

        soundToggle.addEventListener('mouseenter', () => {
            soundToggle.style.transform = 'scale(1.1)';
            soundToggle.style.background = 'rgba(255, 255, 255, 1)';
        });

        soundToggle.addEventListener('mouseleave', () => {
            soundToggle.style.transform = 'scale(1)';
            soundToggle.style.background = 'rgba(255, 255, 255, 0.9)';
        });

        document.body.appendChild(soundToggle);
    }

    // Create sound toggle button
    createSoundToggle();
});

// Initialize all interactive desk elements
function initializeInteractiveElements() {
    // Laptop interaction
    const laptop = document.getElementById('laptop');
    if (laptop) {
        laptop.addEventListener('click', function() {
            showSection('about');
            addClickEffect(this);
        });
    }

    // Coffee cup interaction
    const coffee = document.getElementById('coffee');
    if (coffee) {
        coffee.addEventListener('click', function() {
            showNotification('☕ Coffee break! Perfect for coding sessions.');
            addClickEffect(this);
            animateSteam();
        });
    }

    // Plant interaction
    const plant = document.getElementById('plant');
    if (plant) {
        plant.addEventListener('click', function() {
            showNotification('🌱 A little greenery makes everything better!');
            addClickEffect(this);
            animateLeaves();
        });
    }

    // Books interaction
    const books = document.getElementById('books');
    if (books) {
        books.addEventListener('click', function() {
            showSection('projects');
            addClickEffect(this);
        });
    }

    // Mouse interaction
    const mouse = document.getElementById('mouse');
    if (mouse) {
        mouse.addEventListener('click', function() {
            showNotification('🖱️ Click, scroll, code, repeat!');
            addClickEffect(this);
        });
    }

    // Notepad interaction
    const notepad = document.getElementById('notepad');
    if (notepad) {
        notepad.addEventListener('click', function() {
            showNotification('📝 Ideas and solutions start with notes.');
            addClickEffect(this);
        });
    }

    // Phone interaction
    const phone = document.getElementById('phone');
    if (phone) {
        phone.addEventListener('click', function() {
            showSection('contact');
            addClickEffect(this);
        });
    }

    // Info cards interactions
    const experienceCard = document.getElementById('experience-card');
    if (experienceCard) {
        experienceCard.addEventListener('click', function() {
            showSection('experience');
            addClickEffect(this);
        });
    }

    const projectsCard = document.getElementById('projects-card');
    if (projectsCard) {
        projectsCard.addEventListener('click', function() {
            showNotification('🚀 50+ successful cloud migration projects completed!');
            addClickEffect(this);
        });
    }

    const certificationsCard = document.getElementById('certifications-card');
    if (certificationsCard) {
        certificationsCard.addEventListener('click', function() {
            showNotification('🏆 Oracle Certified Professional with multiple cloud certifications!');
            addClickEffect(this);
        });
    }
}

// Initialize navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            if (targetId === 'home') {
                showHeroSection();
            } else {
                showSection(targetId);
            }
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Show specific content section
function showSection(sectionId) {
    // Hide hero section
    const heroSection = document.querySelector('.hero-desk');
    if (heroSection) {
        heroSection.style.display = 'none';
    }

    // Hide all content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.classList.add('hidden');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.style.display = 'block';
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Add entrance animation
        targetSection.style.opacity = '0';
        targetSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            targetSection.style.transition = 'all 0.5s ease';
            targetSection.style.opacity = '1';
            targetSection.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Show hero section (home)
function showHeroSection() {
    // Hide all content sections
    const contentSections = document.querySelectorAll('.content-section');
    contentSections.forEach(section => {
        section.classList.add('hidden');
        section.style.display = 'none';
    });

    // Show hero section
    const heroSection = document.querySelector('.hero-desk');
    if (heroSection) {
        heroSection.style.display = 'flex';
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Function to open sections from buttons
function openSection(sectionId) {
    showSection(sectionId);
}

// Add click effect to elements
function addClickEffect(element) {
    element.style.transform = element.style.transform + ' scale(0.95)';
    
    setTimeout(() => {
        element.style.transform = element.style.transform.replace(' scale(0.95)', '');
    }, 150);
}

// Show notification
function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification-popup');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(37, 99, 235, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        z-index: 1000;
        font-weight: 500;
        max-width: 300px;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Animate steam from coffee cup
function animateSteam() {
    const steamElements = document.querySelectorAll('.steam span');
    steamElements.forEach((steam, index) => {
        steam.style.animation = 'none';
        setTimeout(() => {
            steam.style.animation = `steam 2s ease-in-out infinite`;
            steam.style.animationDelay = `${index * 0.3}s`;
        }, 100);
    });
}

// Animate plant leaves
function animateLeaves() {
    const leaves = document.querySelectorAll('.leaf');
    leaves.forEach((leaf, index) => {
        leaf.style.animation = 'none';
        setTimeout(() => {
            leaf.style.animation = 'leafSway 2s ease-in-out infinite';
            leaf.style.animationDelay = `${index * 0.2}s`;
        }, 100);
    });
}

// Initialize animations and interactions
function initializeAnimations() {
    // Parallax effect for desk elements
    window.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        // Subtle parallax for desk items
        const deskItems = document.querySelectorAll('.coffee-cup, .plant, .books-stack, .mouse, .notepad, .phone');
        deskItems.forEach((item, index) => {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            
            item.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Floating animation for info cards
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.5}s`;
        card.style.animation = 'float 6s ease-in-out infinite';
    });

    // Add floating keyframes if not already defined
    if (!document.querySelector('#floating-keyframes')) {
        const style = document.createElement('style');
        style.id = 'floating-keyframes';
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effects
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // ESC key to return to home
    if (e.key === 'Escape') {
        showHeroSection();
    }
    
    // Number keys for quick navigation
    const keyMap = {
        '1': 'home',
        '2': 'about',
        '3': 'experience',
        '4': 'contact'
    };
    
    if (keyMap[e.key]) {
        if (keyMap[e.key] === 'home') {
            showHeroSection();
        } else {
            showSection(keyMap[e.key]);
        }
    }
});

// Add loading animation
window.addEventListener('load', function() {
    const loadingScreen = document.createElement('div');
    loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    
    loadingScreen.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="font-size: 1.2rem; font-weight: 600;">Loading Portfolio...</p>
        </div>
    `;
    
    // Add spin animation
    const spinStyle = document.createElement('style');
    spinStyle.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(spinStyle);
    
    document.body.appendChild(loadingScreen);
    
    // Remove loading screen after a short delay
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            if (loadingScreen.parentNode) {
                loadingScreen.remove();
            }
        }, 500);
    }, 1500);
});

// Add resize handler for responsive behavior
window.addEventListener('resize', function() {
    // Adjust desk perspective on mobile
    const deskSurface = document.querySelector('.desk-surface');
    if (deskSurface && window.innerWidth <= 768) {
        deskSurface.style.transform = 'rotateX(30deg) rotateY(0deg)';
    } else if (deskSurface) {
        deskSurface.style.transform = 'rotateX(45deg) rotateY(-5deg)';
    }
});

// Initialize everything when script loads
// Email Contact Functions
function openDirectEmail() {
    const email = 'sgyanmot@yahoo.com';
    const subject = 'Hello from your portfolio website';
    const body = 'Hi Surender,\n\nI visited your portfolio website and would like to get in touch.\n\nBest regards,';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Try to open the email client
    window.location.href = mailtoLink;
    
    // Show a notification
    showNotification('Opening your default email client...');
    
    // Add click effect
    const button = event.target.closest('.email-btn');
    if (button) {
        addClickEffect(button);
    }
}

function toggleContactForm() {
    const form = document.getElementById('quickContactForm');
    const button = event.target.closest('.email-btn');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        showNotification('Contact form opened');
        
        // Scroll to form
        setTimeout(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } else {
        form.classList.add('hidden');
        showNotification('Contact form closed');
    }
    
    if (button) {
        addClickEffect(button);
    }
}

function sendQuickEmail(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const senderName = formData.get('senderName');
    const senderEmail = formData.get('senderEmail');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    // Create email content
    const emailSubject = `Portfolio Contact: ${subject}`;
    const emailBody = `Name: ${senderName}\nEmail: ${senderEmail}\n\nMessage:\n${message}\n\n---\nSent from your portfolio website contact form`;
    
    // Create mailto link
    const mailtoLink = `mailto:sgyanmot@yahoo.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    showNotification('Opening email client with your message...');
    
    // Reset form and hide it
    form.reset();
    setTimeout(() => {
        toggleContactForm();
    }, 1000);
}

// Add email validation helper
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced notification for email actions
function showEmailNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `email-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 0.9rem;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            opacity: 0.8;
        }
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Resume Data Loading and Synchronization
async function loadResumeData() {
    try {
        const response = await fetch('./resume-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const resumeData = await response.json();
        updateWebsiteContent(resumeData);
        console.log('✅ Resume data loaded and synchronized successfully!');
        showNotification('Resume data synchronized successfully!', 'success');
    } catch (error) {
        console.error('❌ Error loading resume data:', error);
        showNotification('Failed to load latest resume data. Using cached content.', 'error');
    }
}

function updateWebsiteContent(data) {
    // Update personal information
    updatePersonalInfo(data.personalInfo);
    
    // Update experience section
    updateExperienceSection(data.experience);
    
    // Update projects section
    updateProjectsSection(data.projects);
    
    // Update about section with latest data
    updateAboutSection(data);
    
    // Update stats
    updateStats(data.stats);
}

function updatePersonalInfo(personalInfo) {
    // Update page title
    document.title = `${personalInfo.name} - ${personalInfo.title}`;
    
    // Update name and title in hero section
    const nameElement = document.querySelector('.name');
    const titleElement = document.querySelector('.title');
    const descriptionElement = document.querySelector('.description');
    
    if (nameElement) nameElement.textContent = personalInfo.name;
    if (titleElement) titleElement.textContent = personalInfo.title;
    if (descriptionElement) descriptionElement.textContent = personalInfo.summary;
    
    // Update contact details in about section
    const contactDetails = document.querySelector('.contact-details');
    if (contactDetails) {
        contactDetails.innerHTML = `
            <p><i class="fas fa-envelope"></i> ${personalInfo.email.join(' | ')}</p>
            <p><i class="fas fa-phone"></i> ${personalInfo.phone}</p>
            <p><i class="fab fa-linkedin"></i> ${personalInfo.linkedin.replace('https://', '')}</p>
        `;
    }
    
    // Update about intro
    const aboutIntro = document.querySelector('.about-intro h3');
    const aboutTitle = document.querySelector('.about-intro h4');
    const aboutDescription = document.querySelector('.about-intro p');
    
    if (aboutIntro) aboutIntro.textContent = personalInfo.name;
    if (aboutTitle) aboutTitle.textContent = personalInfo.title;
    if (aboutDescription) aboutDescription.textContent = personalInfo.summary;
}

function updateExperienceSection(experience) {
    const timelineContainer = document.querySelector('.experience-timeline');
    if (!timelineContainer || !experience.length) return;
    
    timelineContainer.innerHTML = '';
    
    experience.forEach(exp => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        const achievementsList = exp.achievements.map(achievement => 
            `<li>${achievement}</li>`
        ).join('');
        
        timelineItem.innerHTML = `
            <div class="timeline-date">${exp.period}</div>
            <div class="timeline-content">
                <h3>${exp.title}</h3>
                <h4>${exp.company}</h4>
                <div class="role-description">
                    <p>${exp.description}</p>
                    <ul class="achievements">
                        ${achievementsList}
                    </ul>
                </div>
            </div>
        `;
        
        timelineContainer.appendChild(timelineItem);
    });
}

function updateProjectsSection(projects) {
    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid || !projects.length) return;
    
    projectsGrid.innerHTML = '';
    
    projects.forEach((project, index) => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        
        const techTags = project.technologies.map(tech => 
            `<span class="tech-tag">${tech}</span>`
        ).join('');
        
        projectCard.innerHTML = `
            <div class="project-header">
                <i class="fas fa-${index === 0 ? 'cloud' : 'database'}"></i>
                <h3>${project.title}</h3>
                <span class="project-year">2020-2024</span>
            </div>
            <div class="project-content">
                <p>${project.description}</p>
                <div class="project-tech">
                    ${techTags}
                </div>
            </div>
        `;
        
        projectsGrid.appendChild(projectCard);
    });
}

function updateAboutSection(data) {
    // Update professional summary
    const professionalSummary = document.querySelector('.professional-summary p');
    if (professionalSummary) {
        professionalSummary.textContent = data.personalInfo.summary;
    }
    
    // Update expertise areas with skills from resume data
    const expertiseGrid = document.querySelector('.expertise-grid');
    if (expertiseGrid && data.skills) {
        expertiseGrid.innerHTML = `
            <div class="expertise-item">
                <i class="fas fa-database"></i>
                <h5>Oracle Database Administration</h5>
                <p>Expert in ${data.skills.databases.join(', ')}</p>
            </div>
            <div class="expertise-item">
                <i class="fas fa-cloud"></i>
                <h5>Multi-Cloud Architecture</h5>
                <p>Specialized in ${data.skills.cloud.join(', ')}</p>
            </div>
            <div class="expertise-item">
                <i class="fas fa-shield-alt"></i>
                <h5>Security & Compliance</h5>
                <p>Security Program Manager with expertise in risk compliance and security teams</p>
            </div>
            <div class="expertise-item">
                <i class="fas fa-tachometer-alt"></i>
                <h5>Performance & Migration</h5>
                <p>${data.skills.specialties.join(', ')}</p>
            </div>
        `;
    }
}

function updateStats(stats) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid || !stats) return;
    
    statsGrid.innerHTML = `
        <div class="stat-item">
            <span class="stat-number">${stats.experience.replace(' Years', '+')}</span>
            <span class="stat-label">Years Experience</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${stats.migrations.replace(' Customer Migrations', '+')}</span>
            <span class="stat-label">Customer Migrations</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${stats.customers.replace(' Customers Supported', '+')}</span>
            <span class="stat-label">Customers Supported</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${stats.uptime.replace(' Uptime Achieved', '')}</span>
            <span class="stat-label">Uptime Achieved</span>
        </div>
    `;
}

// Load resume data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadResumeData();
});

// Enhanced Global click sound effect for all elements
document.addEventListener('click', function(event) {
    // Ensure sound system is initialized
    if (!soundSystem.audioContext) {
        soundSystem.init();
    }
    
    // Play keyboard click sound on every click
    soundSystem.play('click');
    
    // Add visual click effect for all clickable elements
    const clickEffect = document.createElement('div');
    clickEffect.className = 'click-effect';
    clickEffect.style.left = event.clientX + 'px';
    clickEffect.style.top = event.clientY + 'px';
    document.body.appendChild(clickEffect);
    
    // Remove effect after animation
    setTimeout(() => {
        if (clickEffect.parentNode) {
            clickEffect.parentNode.removeChild(clickEffect);
        }
    }, 300);
}, true); // Use capture phase to ensure it catches all clicks

// Additional event listener for touch devices
document.addEventListener('touchstart', function(event) {
    if (!soundSystem.audioContext) {
        soundSystem.init();
    }
    soundSystem.play('click');
}, true);

// Ensure click sounds work on dynamically added elements
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
                // Add click sound to any new clickable elements
                const clickableElements = node.querySelectorAll ? 
                    node.querySelectorAll('button, a, [onclick], [role="button"], .btn, .card, .nav-link, input[type="submit"], input[type="button"]') : [];
                
                clickableElements.forEach(element => {
                    element.addEventListener('click', function() {
                        soundSystem.play('click');
                    });
                });
            }
        });
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('🚀 Interactive Portfolio Loaded Successfully!');