document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    
    const addPhotoForm = document.getElementById('add-photo-form');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const uploadStatus = document.getElementById('upload-status');
    const portfolioList = document.getElementById('portfolio-list');
    
    const editIdInput = document.getElementById('edit-id');
    const photoFileInput = document.getElementById('photo-file');
    const categoryInput = document.getElementById('category');
    const captionInput = document.getElementById('caption');
    const techDetailsInput = document.getElementById('tech-details');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const currentImageName = document.getElementById('current-image-name');

    // State
    let currentSession = null;
    let isEditing = false;
    let editImageUrl = null; // Store the original URL when editing

    // Check auth status on load
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentSession = session;
    updateUIAuth();

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentSession = session;
        updateUIAuth();
    });

    function updateUIAuth() {
        if (currentSession) {
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            loadPortfolio();
        } else {
            loginContainer.style.display = 'flex';
            dashboardContainer.style.display = 'none';
        }
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        loginError.textContent = 'Logging in...';
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            loginError.textContent = error.message;
        } else {
            loginError.textContent = '';
            loginForm.reset();
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
    });

    // Image Preview
    photoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                uploadStatus.textContent = 'Please select a valid image file.';
                uploadStatus.style.color = 'var(--danger)';
                photoFileInput.value = '';
                return;
            }
            
            const url = URL.createObjectURL(file);
            imagePreview.src = url;
            currentImageName.textContent = file.name;
            imagePreviewContainer.style.display = 'block';
            uploadStatus.textContent = '';
        } else if (!isEditing) {
            imagePreviewContainer.style.display = 'none';
        }
    });

    // Add / Edit Form Submit
    addPhotoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = photoFileInput.files[0];
        const category = categoryInput.value;
        const caption = captionInput.value;
        const techDetails = techDetailsInput.value;
        
        if (!isEditing && !file) {
            uploadStatus.textContent = 'Please select an image to upload.';
            uploadStatus.style.color = 'var(--danger)';
            return;
        }

        submitBtn.disabled = true;
        uploadStatus.textContent = isEditing ? 'Updating portfolio...' : 'Uploading image...';
        uploadStatus.style.color = 'var(--text-main)';

        try {
            let finalImageUrl = editImageUrl; // Default to existing if editing and no new file

            // 1. Upload new image if file selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${category}/${fileName}`;

                const { error: uploadError, data } = await supabaseClient.storage
                    .from('portfolio_images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: publicUrlData } = supabaseClient.storage
                    .from('portfolio_images')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrlData.publicUrl;
            }

            // 2. Save or Update in database
            const portfolioData = {
                image_url: finalImageUrl,
                category,
                caption,
                technical_details: techDetails
            };

            if (isEditing) {
                const id = editIdInput.value;
                const { error: dbError } = await supabaseClient
                    .from('portfolio')
                    .update(portfolioData)
                    .eq('id', id);

                if (dbError) throw dbError;
                
                // If we uploaded a new image successfully, try to delete the old one
                if (file && editImageUrl) {
                    deleteOldImage(editImageUrl);
                }
                
                uploadStatus.textContent = 'Photo updated successfully!';
            } else {
                const { error: dbError } = await supabaseClient
                    .from('portfolio')
                    .insert([portfolioData]);

                if (dbError) throw dbError;
                uploadStatus.textContent = 'Photo added successfully!';
            }

            uploadStatus.style.color = 'green';
            resetForm();
            loadPortfolio();

        } catch (error) {
            console.error('Error:', error);
            uploadStatus.textContent = `Error: ${error.message}`;
            uploadStatus.style.color = 'var(--danger)';
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Helper: extract file path from public URL for deletion
    async function deleteOldImage(url) {
        try {
            // Find the part after portfolio_images/
            const match = url.match(/\/portfolio_images\/(.+)$/);
            if (match && match[1]) {
                const filePath = decodeURIComponent(match[1]);
                await supabaseClient.storage.from('portfolio_images').remove([filePath]);
            }
        } catch (e) {
            console.error("Failed to delete old image:", e);
        }
    }

    // Load Portfolio
    async function loadPortfolio() {
        const { data, error } = await supabaseClient
            .from('portfolio')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            portfolioList.innerHTML = `<div class="error-message">Error loading portfolio: ${error.message}</div>`;
            return;
        }

        if (data.length === 0) {
            portfolioList.innerHTML = `<div class="loading">No photos found. Add one above!</div>`;
            return;
        }

        portfolioList.innerHTML = '';
        
        data.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString();
            
            const card = document.createElement('div');
            card.className = 'portfolio-item';
            card.innerHTML = `
                <img src="${item.image_url}" alt="${item.caption}">
                <div class="portfolio-item-content">
                    <div class="item-category">${item.category}</div>
                    <div class="item-caption">${item.caption}</div>
                    <div class="item-tech">${item.technical_details || 'No tech details'}</div>
                    <div class="item-date">Added: ${date}</div>
                    <div class="item-actions">
                        <button class="btn btn-edit" data-id="${item.id}">Edit</button>
                        <button class="btn btn-danger btn-delete" data-id="${item.id}" data-url="${item.image_url}">Delete</button>
                    </div>
                </div>
            `;
            portfolioList.appendChild(card);
        });

        // Add event listeners for edit and delete
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const item = data.find(d => d.id === id);
                if (item) startEdit(item);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const url = e.target.getAttribute('data-url');
                deletePhoto(id, url);
            });
        });
    }

    // Start Edit
    function startEdit(item) {
        isEditing = true;
        editIdInput.value = item.id;
        editImageUrl = item.image_url;
        
        categoryInput.value = item.category;
        captionInput.value = item.caption;
        techDetailsInput.value = item.technical_details || '';
        
        imagePreview.src = item.image_url;
        currentImageName.textContent = 'Current Image (Leave file input empty to keep)';
        imagePreviewContainer.style.display = 'block';
        
        submitBtn.textContent = 'Save Changes';
        cancelEditBtn.style.display = 'inline-block';
        
        // Scroll to form
        addPhotoForm.scrollIntoView({ behavior: 'smooth' });
        uploadStatus.textContent = '';
    }

    // Reset Form
    function resetForm() {
        isEditing = false;
        editIdInput.value = '';
        editImageUrl = null;
        addPhotoForm.reset();
        
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
        currentImageName.textContent = '';
        
        submitBtn.textContent = 'Add Photo';
        cancelEditBtn.style.display = 'none';
        
        setTimeout(() => {
            uploadStatus.textContent = '';
        }, 3000);
    }

    cancelEditBtn.addEventListener('click', resetForm);

    // Delete Photo
    async function deletePhoto(id, url) {
        if (!confirm('Are you sure you want to delete this portfolio photo?')) return;

        try {
            // Delete DB record
            const { error: dbError } = await supabaseClient
                .from('portfolio')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // Delete storage file
            await deleteOldImage(url);
            
            // Reload
            loadPortfolio();
            
            if (isEditing && editIdInput.value === id) {
                resetForm();
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert(`Failed to delete: ${error.message}`);
        }
    }
});
