document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const artistSearch = document.getElementById('artist-search');
    const artistSection = document.querySelector('.artist-section');
    const artistName = document.getElementById('artist-name');
    const artistImage = document.getElementById('artist-image');
    const artistGenres = document.getElementById('artist-genres');
    const artistFollowers = document.getElementById('artist-followers');
    const artistPopularity = document.getElementById('artist-popularity');
    const artistSpotify = document.getElementById('artist-spotify');
    const artistBio = document.getElementById('artist-bio');
    const saveArtistBtn = document.getElementById('save-artist');
    const tracksList = document.getElementById('tracks-list');
    const albumsGrid = document.getElementById('albums-grid');
    const videosGrid = document.getElementById('videos-grid');
    const favoritesContainer = document.getElementById('favorites-container');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const videoModal = document.getElementById('video-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const videoPlayer = document.getElementById('video-player');

    // Current artist data
    let currentArtist = null;
    let currentTab = 'bio';

    // Initialize the app
    init();

    // Event Listeners
    searchForm.addEventListener('submit', handleSearch);
    saveArtistBtn.addEventListener('click', toggleSaveArtist);
    closeModalBtn.addEventListener('click', closeModal);
    videoModal.addEventListener('click', function(e) {
        if (e.target === videoModal) closeModal();
    });

    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Functions
    function init() {
        // Load saved artists
        loadFavorites();
        
        // Check for last viewed artist in localStorage
        const lastArtist = Storage.getLastArtist();
        if (lastArtist) {
            searchArtist(lastArtist);
        }
        
        // Check for theme preference
        const theme = Storage.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    async function handleSearch(e) {
        e.preventDefault();
        const query = artistSearch.value.trim();
        
        if (query) {
            await searchArtist(query);
            artistSearch.value = '';
        }
    }

    async function searchArtist(query) {
        try {
            // Show loading state
            artistSection.classList.add('hidden');
            
            // Search for artist
            const artistData = await API.searchArtist(query);
            
            if (artistData) {
                currentArtist = artistData;
                displayArtist(artistData);
                
                // Save last searched artist
                Storage.setLastArtist(query);
                
                // Load artist details
                await loadArtistDetails(artistData.id);
            }
        } catch (error) {
            console.error('Error searching artist:', error);
            artistBio.textContent = 'Failed to load artist. Please try again.';
        }
    }

    function displayArtist(artist) {
        artistName.textContent = artist.name;
        artistImage.src = artist.image || 'assets/images/default-artist.jpg';
        artistImage.alt = `${artist.name} Image`;
        artistGenres.textContent = artist.genres.join(', ') || 'No genres listed';
        artistFollowers.textContent = `${artist.followers.toLocaleString()} followers`;
        artistPopularity.textContent = `Popularity: ${artist.popularity}/100`;
        artistSpotify.href = artist.spotifyUrl;
        
        // Check if artist is saved
        updateSaveButton(artist.id);
        
        // Show artist section
        artistSection.classList.remove('hidden');
        
        // Switch to bio tab
        switchTab('bio');
    }

    async function loadArtistDetails(artistId) {
        try {
            // Load top tracks
            const tracks = await API.getTopTracks(artistId);
            displayTracks(tracks);
            
            // Load albums
            const albums = await API.getAlbums(artistId);
            displayAlbums(albums);
            
            // Load videos
            const videos = await API.getVideos(currentArtist.name);
            displayVideos(videos);
        } catch (error) {
            console.error('Error loading artist details:', error);
        }
    }

    function displayTracks(tracks) {
        tracksList.innerHTML = '';
        
        if (tracks.length === 0) {
            tracksList.innerHTML = '<li>No tracks available</li>';
            return;
        }
        
        tracks.forEach(track => {
            const li = document.createElement('li');
            li.className = 'track-item';
            
            li.innerHTML = `
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-album">${track.album}</div>
                </div>
                ${track.previewUrl ? 
                    `<a href="${track.previewUrl}" class="track-preview" target="_blank">
                        <i class="fas fa-play"></i> Preview
                    </a>` : 
                    '<span class="no-preview">No preview</span>'
                }
            `;
            
            tracksList.appendChild(li);
        });
    }

    function displayAlbums(albums) {
        albumsGrid.innerHTML = '';
        
        if (albums.length === 0) {
            albumsGrid.innerHTML = '<p>No albums available</p>';
            return;
        }
        
        albums.forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.className = 'album-card';
            
            albumCard.innerHTML = `
                <div class="album-inner">
                    <div class="album-front">
                        <img src="${album.image}" alt="${album.name}" class="album-img">
                        <div class="album-info">
                            <div class="album-name">${album.name}</div>
                            <div class="album-date">${album.releaseDate}</div>
                        </div>
                    </div>
                    <div class="album-back">
                        <div class="album-name">${album.name}</div>
                        <div class="album-type">${album.type}</div>
                        <div class="album-tracks">${album.totalTracks} tracks</div>
                    </div>
                </div>
            `;
            
            albumsGrid.appendChild(albumCard);
        });
    }

    function displayVideos(videos) {
        videosGrid.innerHTML = '';
        
        if (videos.length === 0) {
            videosGrid.innerHTML = '<p>No videos available</p>';
            return;
        }
        
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            
            videoCard.innerHTML = `
                <div class="video-thumbnail" data-video-id="${video.id}">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <div class="play-icon"><i class="fas fa-play"></i></div>
                </div>
                <div class="video-info">
                    <div class="video-title">${video.title}</div>
                    <div class="video-channel">${video.channel}</div>
                    <div class="video-date">${video.date}</div>
                </div>
            `;
            
            videoCard.querySelector('.video-thumbnail').addEventListener('click', () => {
                playVideo(video.id);
            });
            
            videosGrid.appendChild(videoCard);
        });
    }

    function playVideo(videoId) {
        videoPlayer.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
        `;
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        videoModal.classList.remove('active');
        videoPlayer.innerHTML = '';
        document.body.style.overflow = '';
    }

    function switchTab(tabId) {
        // Update tab buttons
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
        });
        
        // Update tab panes
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
        
        // Save current tab
        currentTab = tabId;
        if (currentArtist) {
            Storage.setLastTab(currentArtist.id, tabId);
        }
    }

    function toggleSaveArtist() {
        if (!currentArtist) return;
        
        const isSaved = Storage.isArtistSaved(currentArtist.id);
        
        if (isSaved) {
            Storage.removeArtist(currentArtist.id);
        } else {
            Storage.saveArtist({
                id: currentArtist.id,
                name: currentArtist.name,
                image: currentArtist.image
            });
        }
        
        updateSaveButton(currentArtist.id);
        loadFavorites();
    }

    function updateSaveButton(artistId) {
        const isSaved = Storage.isArtistSaved(artistId);
        saveArtistBtn.classList.toggle('saved', isSaved);
        saveArtistBtn.innerHTML = isSaved ? 
            '<i class="fas fa-heart"></i> Saved' : 
            '<i class="far fa-heart"></i> Save';
    }

    function loadFavorites() {
        const favorites = Storage.getSavedArtists();
        favoritesContainer.innerHTML = '';
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = '<p>No favorite artists yet. Search for artists and save them!</p>';
            return;
        }
        
        favorites.forEach(artist => {
            const favoriteCard = document.createElement('div');
            favoriteCard.className = 'favorite-card';
            
            favoriteCard.innerHTML = `
                <img src="${artist.image}" alt="${artist.name}" class="favorite-img">
                <div class="favorite-name">${artist.name}</div>
                <button class="remove-favorite" data-artist-id="${artist.id}">&times;</button>
            `;
            
            // Click to load artist
            favoriteCard.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-favorite')) {
                    searchArtist(artist.name);
                }
            });
            
            // Remove favorite
            const removeBtn = favoriteCard.querySelector('.remove-favorite');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                Storage.removeArtist(artist.id);
                loadFavorites();
                
                // Update save button if this is the current artist
                if (currentArtist && currentArtist.id === artist.id) {
                    updateSaveButton(artist.id);
                }
            });
            
            favoritesContainer.appendChild(favoriteCard);
        });
    }
});