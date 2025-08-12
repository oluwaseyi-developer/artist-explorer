import { Storage } from './storage.js';
import { SpotifyAPI, YouTubeAPI, WikipediaAPI } from './api.js';

// Rest of your main.js code

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initTheme();
    loadFavorites();
    setupEventListeners();
});

function initTheme() {
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function loadFavorites() {
    const favorites = Storage.getFavorites();
    const favoritesContainer = document.getElementById('favoritesContainer');
    
    favoritesContainer.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="no-favorites">You have no saved artists yet.</p>';
        return;
    }
    
    favorites.forEach(artist => {
        const favoriteCard = document.createElement('div');
        favoriteCard.className = 'favorite-card';
        favoriteCard.innerHTML = `
            <img src="${artist.image}" alt="${artist.name}">
            <div class="favorite-name">${artist.name}</div>
        `;
        
        favoriteCard.addEventListener('click', () => {
            searchArtist(artist.name, artist.id);
        });
        
        favoritesContainer.appendChild(favoriteCard);
    });
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Search form
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('artistSearch');
        const query = searchInput.value.trim();
        
        if (query) {
            searchArtist(query);
            searchInput.value = '';
        }
    });
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
            
            // Save the last viewed tab
            const artistId = document.getElementById('artistSection').getAttribute('data-artist-id');
            if (artistId) {
                Storage.saveLastTab(artistId, tabName);
            }
        });
    });
    
    // Save artist button
    document.getElementById('saveArtist').addEventListener('click', toggleSaveArtist);
    
    // Video modal
    document.querySelector('.close-modal').addEventListener('click', closeVideoModal);
    document.getElementById('videoModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('videoModal')) {
            closeVideoModal();
        }
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

async function searchArtist(query, artistId = null) {
    try {
        // Show loading state
        const artistSection = document.getElementById('artistSection');
        artistSection.classList.remove('hidden');
        artistSection.setAttribute('data-artist-id', '');
        
        // Search for artist
        const artist = artistId ? 
            await SpotifyAPI.getArtistById(artistId) : 
            await SpotifyAPI.searchArtist(query);
        
        if (!artist) {
            throw new Error('Artist not found');
        }
        
        // Update artist section with the new artist
        updateArtistSection(artist);
        
        // Load the last viewed tab for this artist if available
        const lastTab = Storage.getLastTab(artist.id) || 'bio';
        switchTab(lastTab);
        
        // Load all data in the background
        loadArtistData(artist.id);
    } catch (error) {
        console.error('Error searching for artist:', error);
        alert('Could not find artist. Please try another search.');
    }
}

function updateArtistSection(artist) {
    const artistSection = document.getElementById('artistSection');
    artistSection.setAttribute('data-artist-id', artist.id);
    
    // Update header
    document.getElementById('artistName').textContent = artist.name;
    document.getElementById('artistImage').src = artist.image;
    document.getElementById('artistImage').alt = `${artist.name} image`;
    document.getElementById('spotifyLink').href = artist.external_urls.spotify;
    
    // Update meta info
    document.getElementById('artistFollowers').innerHTML = `
        <i class="fas fa-users"></i> ${formatNumber(artist.followers.total)} followers
    `;
    
    document.getElementById('artistPopularity').innerHTML = `
        <i class="fas fa-chart-line"></i> ${artist.popularity}/100 popularity
    `;
    
    document.getElementById('artistGenres').innerHTML = `
        <i class="fas fa-music"></i> ${artist.genres.slice(0, 3).join(', ')}
    `;
    
    // Update save button state
    updateSaveButton(artist.id);
}

async function loadArtistData(artistId) {
    try {
        // Load bio from Wikipedia
        loadArtistBio(artistId);
        
        // Load top tracks
        const tracks = await SpotifyAPI.getTopTracks(artistId);
        displayTopTracks(tracks);
        
        // Load albums
        const albums = await SpotifyAPI.getAlbums(artistId);
        displayAlbums(albums);
        
        // Load videos
        const videos = await YouTubeAPI.searchVideos(artistId);
        displayVideos(videos);
    } catch (error) {
        console.error('Error loading artist data:', error);
    }
}

async function loadArtistBio(artistId) {
    const artistName = document.getElementById('artistName').textContent;
    const bioTab = document.getElementById('bioTab');
    
    try {
        const bio = await WikipediaAPI.getArtistBio(artistName);
        document.getElementById('artistBio').innerHTML = bio;
    } catch (error) {
        console.error('Error loading artist bio:', error);
        document.getElementById('artistBio').innerHTML = `
            <p>Could not load biography for ${artistName}.</p>
            <p>Try searching on <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(artistName)}" target="_blank">Wikipedia</a>.</p>
        `;
    }
}

function displayTopTracks(tracks) {
    const tracksContainer = document.getElementById('topTracks');
    tracksContainer.innerHTML = '';
    
    if (!tracks || tracks.length === 0) {
        tracksContainer.innerHTML = '<p>No top tracks available for this artist.</p>';
        return;
    }
    
    tracks.forEach((track, index) => {
        const trackElement = document.createElement('div');
        trackElement.className = 'track-item';
        trackElement.innerHTML = `
            <div class="track-number">${index + 1}</div>
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-album">${track.album.name}</div>
            </div>
            ${track.preview_url ? 
                `<div class="track-preview" data-preview="${track.preview_url}">
                    <i class="fas fa-play"></i>
                </div>` : 
                '<div class="track-preview disabled"><i class="fas fa-ban"></i></div>'
            }
        `;
        
        if (track.preview_url) {
            const previewButton = trackElement.querySelector('.track-preview');
            previewButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTrackPreview(previewButton, track.preview_url);
            });
        }
        
        tracksContainer.appendChild(trackElement);
    });
}

let currentAudio = null;
function toggleTrackPreview(button, previewUrl) {
    if (button.classList.contains('playing')) {
        // Stop playback
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        button.classList.remove('playing');
        button.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        // Stop any currently playing track
        document.querySelectorAll('.track-preview.playing').forEach(el => {
            el.classList.remove('playing');
            el.innerHTML = '<i class="fas fa-play"></i>';
        });
        
        if (currentAudio) {
            currentAudio.pause();
        }
        
        // Start new playback
        currentAudio = new Audio(previewUrl);
        currentAudio.play();
        button.classList.add('playing');
        button.innerHTML = '<i class="fas fa-stop"></i>';
        
        currentAudio.addEventListener('ended', () => {
            button.classList.remove('playing');
            button.innerHTML = '<i class="fas fa-play"></i>';
            currentAudio = null;
        });
    }
}

function displayAlbums(albums) {
    const albumsContainer = document.getElementById('albumsGrid');
    albumsContainer.innerHTML = '';
    
    if (!albums || albums.length === 0) {
        albumsContainer.innerHTML = '<p>No albums available for this artist.</p>';
        return;
    }
    
    albums.forEach(album => {
        const albumElement = document.createElement('div');
        albumElement.className = 'album-card';
        albumElement.innerHTML = `
            <img src="${album.images[0].url}" alt="${album.name}" class="album-image">
            <div class="album-info">
                <div class="album-name">${album.name}</div>
                <div class="album-meta">
                    <span>${new Date(album.release_date).getFullYear()}</span>
                    <span>${formatAlbumType(album.album_type)}</span>
                </div>
            </div>
        `;
        
        albumElement.addEventListener('click', () => {
            window.open(`https://open.spotify.com/album/${album.id}`, '_blank');
        });
        
        albumsContainer.appendChild(albumElement);
    });
}

function displayVideos(videos) {
    const videosContainer = document.getElementById('videosGrid');
    videosContainer.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        videosContainer.innerHTML = '<p>No videos available for this artist.</p>';
        return;
    }
    
    videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'video-card';
        videoElement.innerHTML = `
            <div class="video-thumbnail" data-video-id="${video.id.videoId}">
                <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
                <div class="play-icon"><i class="fas fa-play"></i></div>
            </div>
            <div class="video-info">
                <div class="video-title">${video.snippet.title}</div>
                <div class="video-channel">${video.snippet.channelTitle}</div>
                <div class="video-date">${formatDate(video.snippet.publishedAt)}</div>
            </div>
        `;
        
        videoElement.querySelector('.video-thumbnail').addEventListener('click', (e) => {
            e.preventDefault();
            playVideo(video.id.videoId);
        });
        
        videosContainer.appendChild(videoElement);
    });
}

function playVideo(videoId) {
    const modal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    
    videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('active');
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    
    videoFrame.src = '';
    modal.classList.remove('active');
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}Tab`);
    });
}

function toggleSaveArtist() {
    const artistId = document.getElementById('artistSection').getAttribute('data-artist-id');
    if (!artistId) return;
    
    const artist = {
        id: artistId,
        name: document.getElementById('artistName').textContent,
        image: document.getElementById('artistImage').src
    };
    
    if (Storage.isArtistSaved(artistId)) {
        Storage.removeFavorite(artistId);
    } else {
        Storage.addFavorite(artist);
    }
    
    updateSaveButton(artistId);
    loadFavorites();
}

function updateSaveButton(artistId) {
    const saveButton = document.getElementById('saveArtist');
    
    if (Storage.isArtistSaved(artistId)) {
        saveButton.classList.add('saved');
        saveButton.innerHTML = '<i class="fas fa-heart"></i> Saved';
    } else {
        saveButton.classList.remove('saved');
        saveButton.innerHTML = '<i class="far fa-heart"></i> Save Artist';
    }
}

// Helper functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatAlbumType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}