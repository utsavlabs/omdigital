document.addEventListener('DOMContentLoaded', async () => {
    // 1. Navigation Smooth Scrolling
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });

    // 2. Fetch and Render Portfolio Data
    const galleryContainer = document.getElementById('gallery-container');
    
    async function loadPortfolio() {
        if (typeof supabaseClient === 'undefined') {
            console.error("Supabase client not loaded.");
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('portfolio')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                galleryContainer.innerHTML = '<p style="text-align:center; padding: 2rem; color: #666;">Portfolio is currently empty.</p>';
                return;
            }

            galleryContainer.innerHTML = ''; // Clear loading/empty state

            data.forEach((item, index) => {
                // Determine layout class based on index to mimic original masonry feel
                // In a real scenario, this could be stored in DB, but we'll alternate classes
                let cardClass = 'card-md';
                if (index % 5 === 0) cardClass = 'card-lg';
                else if (index % 4 === 0) cardClass = 'card-tall';
                else if (index % 3 === 0) cardClass = 'card-lg';

                const card = document.createElement('div');
                card.className = `card ${cardClass}`;
                card.setAttribute('data-category', item.category);

                let techHtml = '';
                if (item.technical_details) {
                    techHtml = `
                    <div class="meta-group">
                        <span class="meta-label">Technical</span>
                        <span class="meta-value">${item.technical_details}</span>
                    </div>`;
                }

                card.innerHTML = `
                    <img src="${item.image_url}" alt="${item.caption}">
                    <div class="metadata">
                        <div class="meta-group">
                            <span class="meta-label">Project</span>
                            <span class="meta-value">${item.caption}</span>
                        </div>
                        ${techHtml}
                    </div>
                `;

                galleryContainer.appendChild(card);
            });

            // Initialize interactions after rendering
            initPortfolioInteractions();

        } catch (error) {
            console.error("Error loading portfolio:", error);
            galleryContainer.innerHTML = '<p style="text-align:center; padding: 2rem; color: #666;">Failed to load portfolio.</p>';
        }
    }

    // Call it immediately
    loadPortfolio();

    // 3. Interactions (Filtering & Lightbox)
    function initPortfolioInteractions() {
        const filterPills = document.querySelectorAll('.filter-pill');
        const galleryCards = document.querySelectorAll('.card');

        // Filtering
        filterPills.forEach(pill => {
            // Remove old listeners to prevent duplicates if re-rendered
            const newPill = pill.cloneNode(true);
            pill.parentNode.replaceChild(newPill, pill);

            newPill.addEventListener('click', () => {
                // Update active pill
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                newPill.classList.add('active');

                const filterValue = newPill.getAttribute('data-filter');

                galleryCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (filterValue === 'all' || filterValue === cardCategory) {
                        card.style.display = ''; // Reset display
                        card.style.opacity = '1';
                    } else {
                        card.style.display = 'none';
                        card.style.opacity = '0';
                    }
                });
            });
        });

        // Lightbox
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const closeBtn = document.querySelector('.lightbox-close');

        const cardImages = document.querySelectorAll('.card img');
        cardImages.forEach(img => {
            img.style.cursor = 'pointer';
            // Remove old listeners
            const newImg = img.cloneNode(true);
            img.parentNode.replaceChild(newImg, img);

            newImg.addEventListener('click', () => {
                lightbox.classList.add('active');
                lightboxImg.src = newImg.src;
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Remove old event listeners by replacing the close button (if needed)
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

        newCloseBtn.addEventListener('click', closeLightbox);
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

});
