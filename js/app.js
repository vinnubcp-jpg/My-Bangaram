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
    // Landing Page Images (1-8)
    const landingImages = [
        'Images/1.jpg', 'Images/2.jpg', 'Images/3.jpg', 
        'Images/4.jpg', 'Images/5.jpg', 'Images/6.jpg', 
        'Images/7.jpg', 'Images/8.png'
    ];
    
    // Reveal Page Images (Only 9)
    const revealImages = ['Images/9.jpg'];
    
    // Configuration
    const maxPhotos = 6; 
    const activePhotos = []; // Stores {id, left, top, width, height}
    let isRevealActive = false; // State to track if we are in "Love You" mode

    if (memoryContainer) {
        // Initial spawn
        for (let i = 0; i < maxPhotos; i++) {
            // Stagger initial spawns so they don't all pop overlap/disappear at once
            setTimeout(() => spawnPhoto(), i * 2000);
        }
    }

    function spawnPhoto() {
        // If in Reveal Mode, DO NOT spawn floating photos. 
        // We handle the single reveal photo separately.
        if (isRevealActive) return;

        const currentPool = landingImages;
        
        const img = document.createElement('img');
        
        // Smart Selection: Pick an image that isn't currently active
        const activeSrcs = activePhotos.map(p => p.src);
        const availableImages = currentPool.filter(src => !activeSrcs.includes(src));
        
        // If all used (rare), use full pool again
        const pool = availableImages.length > 0 ? availableImages : currentPool;
        const randomSrc = pool[Math.floor(Math.random() * pool.length)];
        
        img.src = randomSrc;
        img.alt = "Floating memory"; // Accessibility fix
        img.classList.add('floating-photo');
        
        // ... (Responsive Size & Position Logic omitted for brevity, keeping existing) ...
        // Re-using the same loop logic but ensuring it matches previous verified logic
        
        // Responsive Image Size
        const isMobile = window.innerWidth < 768;
        const minSize = isMobile ? 80 : 150; 
        const maxSize = isMobile ? 130 : 250; 
        const pixelSize = Math.random() * (maxSize - minSize) + minSize;
        
        const widthVW = (pixelSize / window.innerWidth) * 100;
        const heightVH = (pixelSize / window.innerHeight) * 100;
        
        img.style.width = `${pixelSize}px`;
        img.style.height = 'auto';

        // Find Safe Position (Landing Page Logic only needed now)
        let bestPos = null;
        for (let attempt = 0; attempt < 100; attempt++) {
             let potentialLeft = Math.random() * (95 - widthVW);
             let potentialTop = Math.random() * (90 - heightVH);
             
             let overlap = false;
             for (const other of activePhotos) {
                const margin = 5; 
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
        
        if (!bestPos) bestPos = { left: Math.random() * 90, top: Math.random() * 90 };

        img.style.left = `${bestPos.left}vw`;
        img.style.top = `${bestPos.top}vh`;

        const duration = Math.random() * 5 + 10; 
        img.style.animationDuration = `${duration}s`;
        
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

        setTimeout(() => {
            img.remove();
            const idx = activePhotos.findIndex(p => p.id === photoId);
            if (idx > -1) activePhotos.splice(idx, 1);
            spawnPhoto();
        }, duration * 1000);
    }

    function showRevealImage() {
        // Create the single static image (Image 9)
        const img = document.createElement('img');
        img.src = revealImages[0];
        img.alt = "Special Reveal Memory"; // Accessibility fix
        img.classList.add('reveal-photo'); // New CSS Class
        
        memoryContainer.appendChild(img);
        
        // Trigger Fade In
        requestAnimationFrame(() => {
            img.classList.add('visible');
        });
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
    // Title Heart Interaction (Cinematic Zoom Reveal)
    const titleHeart = document.getElementById('title-heart');
    const loveOverlay = document.getElementById('love-overlay');
    const zoomTransition = document.getElementById('heart-zoom-transition');
    const mainContent = document.querySelector('.main-content');
    const line1 = document.querySelector('.line-1');
    const line2 = document.querySelector('.line-2');
    const line3 = document.querySelector('.line-3');

    if(titleHeart && loveOverlay && zoomTransition && mainContent) {
        
        // === PLAYFUL HEART EVASION ===
        let isEscaping = true;
        let escapeStartTime = null;

        titleHeart.addEventListener('mouseover', () => {
             if (!isEscaping) return;

             if (!escapeStartTime) escapeStartTime = Date.now();

             // Check if 5 seconds have passed since first hover
             if (Date.now() - escapeStartTime > 5000) {
                 isEscaping = false;
                 titleHeart.style.transform = 'translate(0, 0)';
                 return;
             }

             // Run away!
             const offsetX = (Math.random() - 0.5) * 300; 
             const offsetY = (Math.random() - 0.5) * 300;
             
             // Apply translation. This momentarily overrides the hover scale/animation.
             titleHeart.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });

        titleHeart.addEventListener('click', (e) => {
            // ... (coords calculation same as before) ...
            const rect = titleHeart.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            zoomTransition.style.left = `${centerX}px`;
            zoomTransition.style.top = `${centerY}px`;
            zoomTransition.classList.remove('faded');
            
            requestAnimationFrame(() => {
                zoomTransition.classList.add('active');
            });
            
            intensifyHearts(); 
            
            // 5. Reveal Sequence
            setTimeout(() => {
                loveOverlay.classList.remove('hidden');
                zoomTransition.classList.add('faded'); // Fade out so original BG shows
                mainContent.classList.add('content-hidden'); // Hide Title, but NOT memories
                // memoryContainer.classList.add('memories-hidden'); // REMOVED: Keep memories visible!
                isRevealActive = true; 
                
                // FORCE SWITCH IMAGES: Clear current floating photos
                const currentImages = document.querySelectorAll('.floating-photo');
                currentImages.forEach(img => img.remove());
                activePhotos.length = 0; // Clear array
                
                // Show Single Reveal Image (9.jpg)
                showRevealImage();
                
                // Trigger Writing Animation
                if(line1) {
                    line1.classList.remove('writing-active-1');
                    void line1.offsetWidth; // Trigger reflow
                    line1.classList.add('writing-active-1');
                }
                if(line2) {
                    line2.classList.remove('writing-active-2');
                    void line2.offsetWidth; 
                    line2.classList.add('writing-active-2');
                }
                if(line3) {
                    line3.classList.remove('writing-active-3');
                    void line3.offsetWidth;
                    line3.classList.add('writing-active-3');
                }

            }, 800);


            // Add closing mechanism (Only if NOT clicking the heart)
            loveOverlay.onclick = (e) => {
                // If clicked on the heart button, do not close!
                if(e.target.closest('#reveal-heart-btn')) return;

                loveOverlay.classList.add('hidden');
                zoomTransition.classList.remove('active');
                
                // ... (rest of reset logic)

                zoomTransition.classList.remove('faded');
                mainContent.classList.remove('content-hidden');
                memoryContainer.classList.remove('memories-hidden');
                isRevealActive = false; 
                
                // FORCE RESET IMAGES:
                // 1. Remove Reveal Photo
                const revealPhoto = document.querySelector('.reveal-photo');
                if (revealPhoto) revealPhoto.remove();
                
                // 2. Restart Floating Photos (1-8)
                // Just calling spawnPhoto once in a loop will restart the self-perpetuating cycle
                for (let i = 0; i < maxPhotos; i++) {
                     setTimeout(() => spawnPhoto(), i * 1000); 
                }
                
                // Reset writing
                if(line1) line1.classList.remove('writing-active-1');
                if(line2) line2.classList.remove('writing-active-2');
                if(line3) line3.classList.remove('writing-active-3');
            };
        });
        // Page 3 Transition
        const revealHeartBtn = document.getElementById('reveal-heart-btn');
        const page3 = document.getElementById('page-3');

        // Note: Event delegation is better since the element might not exist yet, 
        // but since it's static in HTML now, we can try direct binding or delegation.
        // Since we are in an event listener scope, let's use delegation on the body or document if needed,
        // but here we can just attach it if it exists.
        
        // Actually, since revealHeartBtn is in index.html now, we can grab it.
        // Wait, it is inside the loveOverlay. 
        
        if (revealHeartBtn) {
            revealHeartBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent overlay close
                
                // Transition to Page 3
                loveOverlay.classList.add('hidden'); // Hide Page 2 Text
                // Do we want to keep the background? User said "Third Page".
                // Let's assume we keep the background memories but hide the text.
                // Or maybe hide everything from Page 2.
                
                // Show Page 3
                if(page3) page3.classList.add('visible');
                
                // Hide Page 2 Images
                const revealPhoto = document.querySelector('.reveal-photo');
                if (revealPhoto) {
                    revealPhoto.classList.remove('visible');
                    revealPhoto.style.opacity = '0'; // Force hide
                }

                // Hide Floating Memories
                const memoryContainer = document.getElementById('floating-memories');
                if(memoryContainer) {
                    memoryContainer.style.opacity = '0';
                    memoryContainer.innerHTML = ''; // Clear them out
                }
                
                // Randomize "No" button initial position safely
                if(btnNo) {
                   moveButtonSafe();
                }
            });
        }
        
        // Page 3 Interactions
        const btnNo = document.getElementById('btn-no');
        const btnYes = document.getElementById('btn-yes');

        if(btnNo) {
            btnNo.addEventListener('mouseover', () => {
                moveButtonSafe();
                spawnGif();
            });
            btnNo.addEventListener('click', () => {
                moveButtonSafe();
                spawnGif();
            });
            
            function moveButtonSafe() {
                const maxWidth = window.innerWidth - btnNo.offsetWidth;
                const maxHeight = window.innerHeight - btnNo.offsetHeight;

                // Elements to avoid
                const questionElement = document.querySelector('.valentine-question');
                const btnYes = document.getElementById('btn-yes');
                
                let safe = false;
                let attempts = 0;
                let randomX, randomY;

                while(!safe && attempts < 50) {
                    randomX = Math.random() * maxWidth;
                    randomY = Math.random() * maxHeight;
                    
                    // Proposed Rect for No Button
                    const noRect = {
                        left: randomX,
                        top: randomY,
                        right: randomX + btnNo.offsetWidth,
                        bottom: randomY + btnNo.offsetHeight
                    };

                    safe = true; // Assume safe

                    // Check Question Overlap
                    if(questionElement) {
                        const qRect = questionElement.getBoundingClientRect();
                        if (isOverlapping(noRect, qRect)) safe = false;
                    }

                    // Check Yes Button Overlap
                    if(btnYes && safe) {
                        const yRect = btnYes.getBoundingClientRect();
                        if (isOverlapping(noRect, yRect)) safe = false;
                    }
                    
                    attempts++;
                }
                
                btnNo.style.position = 'absolute';
                btnNo.style.left = randomX + 'px';
                btnNo.style.top = randomY + 'px';
            }
        }
        
        function isOverlapping(rect1, rect2) {
             return !(rect1.right < rect2.left || 
                      rect1.left > rect2.right || 
                      rect1.bottom < rect2.top || 
                      rect1.top > rect2.bottom);
        }

        if(btnYes) {
            btnYes.addEventListener('click', () => {
                // Celebration!
                // For now, let's just show an alert or a simple confetti effect.
                // Or maybe spawn a ton of hearts.
                
                spawnConfetti();

                // Change question text?
                const questionElement = document.querySelector('.valentine-question');
                if(questionElement) questionElement.textContent = "YAYYY! I Love You! ❤️";
                
                // Hide No button
                if(btnNo) btnNo.style.display = 'none';
            });
        }
        
    }
});

function spawnConfetti() {
   // Simple Heart Confetti
   for(let i=0; i<50; i++) {
       setTimeout(() => {
           spawnHeart();
       }, i * 50);
   }
}

function spawnGif() {
    // Determine screen dimensions
    const maxWidth = window.innerWidth - 100; // rough width
    const maxHeight = window.innerHeight - 100;

    const img = document.createElement('img');
    img.src = 'Images/10.gif'; // Capital 'I' for GitHub Pages
    img.style.position = 'fixed';
    
    // Random Position
    const randomX = Math.random() * maxWidth;
    const randomY = Math.random() * maxHeight;
    
    img.style.left = randomX + 'px';
    img.style.top = randomY + 'px';
    img.style.width = '150px'; // Reasonable size
    img.style.height = 'auto';
    img.style.zIndex = '3001'; // Above page 3
    img.style.pointerEvents = 'none';
    
    // Animation
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease';
    
    document.body.appendChild(img);
    
    // Show
    requestAnimationFrame(() => {
        img.style.opacity = '1';
    });
    
    // Remove after a few seconds
    setTimeout(() => {
        img.style.opacity = '0';
        setTimeout(() => {
            img.remove();
        }, 500);
    }, 2000);
}
