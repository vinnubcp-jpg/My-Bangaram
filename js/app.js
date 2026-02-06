document.addEventListener('DOMContentLoaded', () => {
    // Smooth Scroll Reveal
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Floating Memories Background Logic
    const memoryContainer = document.getElementById('floating-memories');
    
    // Real images
    const memoryImages = [
        'Images/1.jpg', 'Images/2.jpg', 'Images/3.jpg', 
        'Images/4.jpg', 'Images/5.jpg', 'Images/6.jpg', 'Images/7.jpg'
    ];
    
    // Configuration
    const maxPhotos = 6; 
    const activePhotos = []; // Stores {id, left, top, width, height}

    if (memoryContainer) {
        // Initial spawn
        for (let i = 0; i < maxPhotos; i++) {
            // Stagger initial spawns so they don't all pop overlap/disappear at once
            setTimeout(() => spawnPhoto(), i * 2000);
        }
    }

    function spawnPhoto() {
        const img = document.createElement('img');
        
        // Smart Selection: Pick an image that isn't currently active
        const activeSrcs = activePhotos.map(p => p.src);
        const availableImages = memoryImages.filter(src => !activeSrcs.includes(src));
        
        // If we have unused images, pick one of them. Otherwise (rare backup), pick any.
        const pool = availableImages.length > 0 ? availableImages : memoryImages;
        const randomSrc = pool[Math.floor(Math.random() * pool.length)];
        
        img.src = randomSrc;
        img.classList.add('floating-photo');
        
        // Responsive Image Size
        const isMobile = window.innerWidth < 768;
        const minSize = isMobile ? 60 : 150; // Smaller on mobile (was 80)
        const maxSize = isMobile ? 110 : 250; // Smaller on mobile (was 140)
        const pixelSize = Math.random() * (maxSize - minSize) + minSize;
        
        const widthVW = (pixelSize / window.innerWidth) * 100;
        const heightVH = (pixelSize / window.innerHeight) * 100;

        img.style.width = `${pixelSize}px`;
        img.style.height = 'auto';

        // Find Safe Position
        let bestPos = null;
        
        // Try to find a non-overlapping spot
        for (let attempt = 0; attempt < 100; attempt++) {
            const potentialLeft = Math.random() * (95 - widthVW);
            const potentialTop = Math.random() * (90 - heightVH);
            
            let overlap = false;
            for (const other of activePhotos) {
                const margin = 5; // buffer
                if (potentialLeft < other.left + other.width + margin &&
                    potentialLeft + widthVW + margin > other.left &&
                    potentialTop < other.top + other.height + margin &&
                    potentialTop + heightVH + margin > other.top) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                bestPos = { left: potentialLeft, top: potentialTop };
                break;
            }
        }

        // Keep fallback if strict check fails (rare with 6 items on big screen)
        if (!bestPos) bestPos = { left: Math.random() * 80, top: Math.random() * 80 };

        img.style.left = `${bestPos.left}vw`;
        img.style.top = `${bestPos.top}vh`;

        // Random Duration
        const duration = Math.random() * 5 + 10; // 10s-15s (Slower, relaxed)
        img.style.animationDuration = `${duration}s`;
        
        // Track this photo including its source
        const photoId = Date.now() + Math.random();
        const photoData = { 
            id: photoId, 
            src: randomSrc, 
            left: bestPos.left, 
            top: bestPos.top, 
            width: widthVW, 
            height: heightVH 
        };
        activePhotos.push(photoData);

        memoryContainer.appendChild(img);

        // Cleanup after animation
        setTimeout(() => {
            img.remove();
            // Remove from active tracker
            const idx = activePhotos.findIndex(p => p.id === photoId);
            if (idx > -1) activePhotos.splice(idx, 1);
            
            // Spawn a replacement immediately
            spawnPhoto();
        }, duration * 1000);
    }

    const heartContainer = document.getElementById('heart-container');

    // --- DYNAMIC HEART GENERATOR ---
    
    // Configuration State
    let heartIntervalTime = 500;
    let heartDurationBase = 5; // Base duration in seconds
    let heartTimer = null;

    function createHeart() {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.innerText = '❤️'; 
        
        // Randomize position
        const leftPos = Math.random() * 100;
        
        // DYNAMIC DURATION: Use the mutable heartDurationBase
        const variation = Math.random() * 2; 
        const animDuration = Math.max(0.5, heartDurationBase + variation); 
        
        const size = Math.random() * 30 + 15; // 15-45px (1.5x Bigger)
        const rotation = Math.random() * 360; // Random angle
        
        heart.style.left = `${leftPos}vw`;
        heart.style.animationDuration = `${animDuration}s`;
        heart.style.setProperty('--r', `${rotation}deg`);
        heart.style.fontSize = `${size}px`;

        // RANDOM DEPTH: 50% behind images (z=5), 50% in front (z=15)
        // Images are at z=10. Text is at z=100.
        heart.style.zIndex = Math.random() > 0.5 ? 5 : 15;
        
        heartContainer.appendChild(heart);
        
        // Remove after animation
        setTimeout(() => {
            heart.remove();
        }, animDuration * 1000);
    }

    // Function to update the heart generator loop
    function updateHeartLoop() {
        if (heartTimer) clearInterval(heartTimer);
        heartTimer = setInterval(createHeart, heartIntervalTime);
    }
    
    // Start initial loop
    updateHeartLoop();

    // --- SCROLL INTERACTION ---
    
    // Constants for modes
    const NORMAL_INTERVAL = 100;
    const NORMAL_TICK_RATE = 1; // 1 heart per tick
    const NORMAL_DURATION = 5;
    
    // 500x Rate Check:
    // Normal = 10 hearts/sec (1 per 100ms)
    // 300x = 3000 hearts/sec (User requested reduction from 500x)
    // To achieve 3000/sec: Run at 10ms interval (100 ticks/sec) * 30 hearts/tick
    const HYPER_INTERVAL = 10; 
    const HYPER_TICK_RATE = 5; // 30 hearts per tick (300x rate) 
    const HYPER_DURATION = 1.0; 
    
    let heartsPerTick = 1;
    let resetTimer = null;

    // Function to update the heart generator loop
    function updateHeartLoop() {
        if (heartTimer) clearInterval(heartTimer);
        heartTimer = setInterval(() => {
            // Batch spawn for performance/density
            for(let i=0; i<heartsPerTick; i++) {
                createHeart();
            }
        }, heartIntervalTime);
    }
    
    // Start initial loop
    updateHeartLoop();

    function intensifyHearts() {
        // 1. Activate HYPER Mode immediately (Massive Burst)
        if (heartIntervalTime !== HYPER_INTERVAL || heartsPerTick !== HYPER_TICK_RATE) {
            heartIntervalTime = HYPER_INTERVAL;
            heartsPerTick = HYPER_TICK_RATE;
            heartDurationBase = HYPER_DURATION;
            updateHeartLoop();
            // console.log("HYPER MODE 500X 🔥");
        }

        // 2. Debounce the reset (Temporary effect)
        if (resetTimer) clearTimeout(resetTimer);
        
        resetTimer = setTimeout(() => {
            // Revert to NORMAL Mode
            heartIntervalTime = NORMAL_INTERVAL;
            heartsPerTick = NORMAL_TICK_RATE;
            heartDurationBase = NORMAL_DURATION;
            updateHeartLoop();
            // console.log("Back to Normal 😌");
        }, 200); 
    }

    // Listen for Scroll (Desktop)
    window.addEventListener('wheel', () => {
        intensifyHearts();
    });

    // Listen for Drag/Touch (Mobile)
    window.addEventListener('touchmove', () => {
        intensifyHearts();
    });
    // Title Heart Interaction
    const titleHeart = document.getElementById('title-heart');
    if(titleHeart) {
        titleHeart.addEventListener('click', () => {
            // Mini explosion for the title heart
            for(let i=0; i<20; i++) {
                setTimeout(() => {
                    const heart = document.createElement('div');
                    heart.classList.add('heart');
                    heart.innerText = '❤️'; 
                    // Burst from top center area
                    heart.style.left = `${40 + Math.random() * 20}vw`;
                    heart.style.top = `${20 + Math.random() * 20}vh`; // Start near title
                    heart.style.animationDuration = `${Math.random() * 2 + 1}s`;
                    heart.style.fontSize = `${Math.random() * 20 + 10}px`;
                    
                    document.getElementById('heart-container').appendChild(heart);
                    setTimeout(() => heart.remove(), 2000);
                }, i * 50);
            }
        });
    }
});
