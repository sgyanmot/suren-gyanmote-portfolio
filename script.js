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
        // Create heavy metal keyboard sounds
        this.sounds = {
            click: this.createHeavyMetalSound([220, 440, 880], 0.15, 'aggressive'),
            hover: this.createHeavyMetalSound([165, 330], 0.08, 'subtle'),
            navigation: this.createHeavyMetalSound([110, 220, 440, 880], 0.2, 'power'),
            button: this.createHeavyMetalSound([146, 293, 587], 0.18, 'punch'),
            keypress: this.createHeavyMetalSound([196, 392, 784], 0.12, 'strike'),
            success: this.createMetalChord([82, 110, 146, 196], 0.3),
            notification: this.createHeavyMetalSound([330, 660, 1320], 0.15, 'alert')
        };
    }

    createHeavyMetalSound(frequencies, duration, style) {
        return () => {
            if (!this.audioContext || !this.isEnabled) return;

            // Create multiple oscillators for heavy metal sound
            frequencies.forEach((freq, index) => {
                // Main heavy tone
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const distortion = this.createDistortion();
                const filter = this.audioContext.createBiquadFilter();

                oscillator.connect(distortion);
                distortion.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                // Heavy metal frequency settings
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = index === 0 ? 'sawtooth' : 'square';

                // Aggressive filtering for metal sound
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(freq * 4, this.audioContext.currentTime);
                filter.Q.setValueAtTime(15, this.audioContext.currentTime);

                // Heavy metal envelope - powerful attack
                const startTime = this.audioContext.currentTime + (index * 0.01);
                gainNode.gain.setValueAtTime(0, startTime);
                
                if (style === 'power' || style === 'aggressive') {
                    gainNode.gain.linearRampToValueAtTime(this.volume * (1.2 - index * 0.2), startTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(this.volume * 0.3, startTime + duration * 0.3);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                } else {
                    gainNode.gain.linearRampToValueAtTime(this.volume * (0.8 - index * 0.15), startTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                }

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });

            // Add heavy metal noise and harmonics
            this.addMetalNoise(duration, style);
            this.addHarmonics(frequencies[0], duration, style);
        };
    }

    createDistortion() {
        const waveShaperNode = this.audioContext.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        // Heavy distortion curve for metal sound
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + 20) * x * 20 * deg) / (Math.PI + 20 * Math.abs(x));
        }

        waveShaperNode.curve = curve;
        waveShaperNode.oversample = '4x';
        return waveShaperNode;
    }

    addMetalNoise(duration, style) {
        if (!this.audioContext || !this.isEnabled) return;

        // Create aggressive noise for metal sound
        const bufferSize = this.audioContext.sampleRate * duration;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Generate heavy noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (style === 'power' ? 0.8 : 0.4);
        }

        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        const noiseDistortion = this.createDistortion();

        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(noiseDistortion);
        noiseDistortion.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        // Heavy bandpass filter for aggressive noise
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        noiseFilter.Q.setValueAtTime(10, this.audioContext.currentTime);

        // Aggressive noise envelope
        noiseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        noiseGain.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration * 0.4);

        noiseSource.start(this.audioContext.currentTime);
        noiseSource.stop(this.audioContext.currentTime + duration);
    }

    addHarmonics(baseFreq, duration, style) {
        if (!this.audioContext || !this.isEnabled) return;

        // Add heavy metal harmonics
        const harmonics = [2, 3, 4, 5, 7];
        
        harmonics.forEach((harmonic, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(baseFreq * harmonic, this.audioContext.currentTime);
            oscillator.type = 'sawtooth';

            // Heavy filtering for harmonics
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(baseFreq * harmonic, this.audioContext.currentTime);
            filter.Q.setValueAtTime(8, this.audioContext.currentTime);

            // Harmonic envelope
            const startTime = this.audioContext.currentTime + (index * 0.003);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * (0.2 / (harmonic * 0.5)), startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    createMetalChord(frequencies, duration) {
        return () => {
            if (!this.audioContext || !this.isEnabled) return;

            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    // Create heavy metal chord sound
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const distortion = this.createDistortion();

                    oscillator.connect(distortion);
                    distortion.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'sawtooth';

                    // Heavy metal chord filtering
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(freq * 6, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(12, this.audioContext.currentTime);

                    // Powerful chord envelope
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + duration * 0.4);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + duration);
                }, index * 20);
            });

            // Add heavy noise and harmonics for chord
            this.addMetalNoise(duration, 'power');
            this.addHarmonics(frequencies[0], duration, 'power');
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

console.log('🚀 Interactive Portfolio Loaded Successfully!');