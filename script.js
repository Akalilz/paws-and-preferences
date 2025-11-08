const cardStack = document.getElementById('card-stack');
const summary = document.getElementById('summary');
const likeCount = document.getElementById('like-count');
const likedCatsDiv = document.getElementById('liked-cats');
const restartBtn = document.getElementById('restart');
const skipButton = document.getElementById('skip-button');
const likeButton = document.getElementById('like-button');
const currentCardDisplay = document.getElementById('current-card');
const totalCardsDisplay = document.getElementById('total-cards');
const totalViewed = document.getElementById('total-viewed');
const catWord = document.getElementById('cat-word');
const noLikesMessage = document.getElementById('no-likes-message');

let cats = [];
let likedCats = [];
let currentIndex = 0;
let currentCard = null;

async function fetchCats(num = 10) {
  // Create array of random cat image URLs
  cats = Array.from({ length: num }, () => `https://cataas.com/cat?random=${Math.random()}`);
  likedCats = [];
  currentIndex = 0;
  updateProgress();
  renderCards();
}

function updateProgress() {
  currentCardDisplay.textContent = currentIndex + 1;
  totalCardsDisplay.textContent = cats.length;
}

function renderCards() {
  cardStack.innerHTML = '';
  
  // Render from top (currentIndex) to end, limit to 3 visible cards for performance
  const visibleCards = Math.min(3, cats.length - currentIndex);
  for (let i = 0; i < visibleCards; i++) {
    const card = document.createElement('div');
    card.className = 'card';
    const catUrl = cats[currentIndex + i];
    card.style.backgroundImage = `url(${catUrl})`;
    card.style.zIndex = visibleCards - i;
    card.style.transform = `scale(${1 - i * 0.02}) translateY(${i * 10}px)`;
    
    if (i === 0) {
      makeCardSwipable(card, currentIndex + i);
      currentCard = card;
    }
    
    cardStack.appendChild(card);
  }
}

function makeCardSwipable(card, index) {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isDragging = false;
  let isProcessing = false; // Prevent multiple swipes
  const threshold = 100;
  const rotationFactor = 10;

  // Event handler functions (need to be defined to remove later)
  function onPointerMove(e) {
    onDrag(e.clientX, e.clientY);
  }

  function onPointerUp() {
    endDrag();
  }

  // Touch + Mouse Events
  card.addEventListener('pointerdown', (e) => {
    if (isProcessing) return; // Don't start if already processing
    startDrag(e.clientX, e.clientY);
  });

  function startDrag(x, y) {
    isDragging = true;
    startX = x;
    startY = y;
    card.style.transition = 'none';
    
    // Add listeners
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  function onDrag(x, y) {
    if (!isDragging || isProcessing) return;
    currentX = x - startX;
    currentY = y - startY;
    const rotation = currentX / rotationFactor;
    card.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
  }

  function endDrag() {
    if (!isDragging || isProcessing) return;
    isDragging = false;

    // Remove listeners immediately
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    // Check if swiped right (like) or left (skip)
    if (currentX > threshold) {
      swipeCard('right');
    } else if (currentX < -threshold) {
      swipeCard('left');
    } else {
      // Reset if not swiped far enough
      card.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
    }
    currentX = 0;
    currentY = 0;
  }

  function swipeCard(direction) {
    if (isProcessing) return; // Prevent duplicate processing
    isProcessing = true;
    
    card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
    const exitTransform = direction === 'right' 
      ? 'translateX(600px) rotate(25deg)' 
      : 'translateX(-600px) rotate(-25deg)';
    
    card.style.transform = exitTransform;
    card.style.opacity = 0;
    card.style.pointerEvents = 'none'; // Disable further interactions

    if (direction === 'right') {
      likedCats.push(cats[index]);
    }

    setTimeout(() => {
      currentIndex++;
      updateProgress();
      if (currentIndex < cats.length) {
        renderCards();
      } else {
        showSummary();
      }
    }, 400);
  }
}

// Button click handlers
skipButton.addEventListener('click', () => {
  if (currentCard && !skipButton.disabled) {
    skipButton.disabled = true;
    likeButton.disabled = true;
    animateButtonSwipe(currentCard, 'left');
  }
});

likeButton.addEventListener('click', () => {
  if (currentCard && !likeButton.disabled) {
    skipButton.disabled = true;
    likeButton.disabled = true;
    animateButtonSwipe(currentCard, 'right');
  }
});

function animateButtonSwipe(card, direction) {
  card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
  const exitTransform = direction === 'right' 
    ? 'translateX(600px) rotate(25deg)' 
    : 'translateX(-600px) rotate(-25deg)';
  
  card.style.transform = exitTransform;
  card.style.opacity = 0;
  card.style.pointerEvents = 'none'; // Disable further interactions

  if (direction === 'right') {
    likedCats.push(cats[currentIndex]);
  }

  setTimeout(() => {
    currentIndex++;
    updateProgress();
    
    // Re-enable buttons
    skipButton.disabled = false;
    likeButton.disabled = false;
    
    if (currentIndex < cats.length) {
      renderCards();
    } else {
      showSummary();
    }
  }, 400);
}

function showSummary() {
  const gameSection = document.querySelector('.game-section');
  gameSection.classList.add('hidden');
  summary.classList.remove('hidden');
  
  likeCount.textContent = likedCats.length;
  totalViewed.textContent = cats.length;
  catWord.textContent = likedCats.length === 1 ? 'cat' : 'cats';
  
  if (likedCats.length === 0) {
    likedCatsDiv.classList.add('hidden');
    noLikesMessage.classList.remove('hidden');
  } else {
    likedCatsDiv.classList.remove('hidden');
    noLikesMessage.classList.add('hidden');
    likedCatsDiv.innerHTML = likedCats
      .map(url => `<img src="${url}" alt="Liked cat" loading="lazy" class="cat-thumbnail" />`)
      .join('');
    
    // Add click event listeners for zoom
    setupLightbox();
  }
}

// Lightbox functionality
function setupLightbox() {
  // Create lightbox if it doesn't exist
  let lightbox = document.querySelector('.lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close zoom">✕</button>
        <img src="" alt="Zoomed cat" />
      </div>
    `;
    document.body.appendChild(lightbox);
    
    // Close lightbox on click/tap
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        closeLightbox();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
    
    // Mobile: Swipe down to close
    let startY = 0;
    let currentY = 0;
    const lightboxContent = lightbox.querySelector('.lightbox-content');
    
    lightboxContent.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    lightboxContent.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      // Only allow downward swipe
      if (diff > 0) {
        lightboxContent.style.transform = `translateY(${diff}px)`;
        lightboxContent.style.transition = 'none';
      }
    }, { passive: true });
    
    lightboxContent.addEventListener('touchend', () => {
      const diff = currentY - startY;
      
      // If swiped down more than 100px, close
      if (diff > 100) {
        closeLightbox();
      } else {
        // Reset position
        lightboxContent.style.transition = 'transform 0.3s ease';
        lightboxContent.style.transform = 'translateY(0)';
      }
    });
  }
  
  // Add click listeners to all cat thumbnails
  const thumbnails = document.querySelectorAll('.cat-thumbnail');
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
      openLightbox(thumbnail.src);
    });
  });
}

function openLightbox(imageSrc) {
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox.querySelector('img');
  const lightboxContent = lightbox.querySelector('.lightbox-content');
  
  lightboxImg.src = imageSrc;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  
  // Reset any transform from swipe
  lightboxContent.style.transform = '';
}

function closeLightbox() {
  const lightbox = document.querySelector('.lightbox');
  const lightboxContent = lightbox.querySelector('.lightbox-content');
  
  lightbox.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
  
  // Reset transform
  setTimeout(() => {
    lightboxContent.style.transform = '';
  }, 300);
}

restartBtn.addEventListener('click', () => {
  summary.classList.add('hidden');
  const gameSection = document.querySelector('.game-section');
  gameSection.classList.remove('hidden');
  fetchCats();
});

// Add floating cats animation
function createFloatingCats() {
  const floatingContainer = document.createElement('div');
  floatingContainer.className = 'floating-cats';
  
  const catEmojis = ['😺', '😸', '😹', '😻', '😼'];
  
  for (let i = 0; i < 5; i++) {
    const cat = document.createElement('div');
    cat.className = 'floating-cat';
    cat.textContent = catEmojis[i];
    floatingContainer.appendChild(cat);
  }
  
  document.body.insertBefore(floatingContainer, document.body.firstChild);
}

// Initialize floating cats
createFloatingCats();

// Initialize
fetchCats();
