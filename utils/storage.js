const Storage = {
    // Save artist to favorites
    saveArtist(artist) {
        const favorites = this.getSavedArtists();
        
        // Check if artist already exists
        const exists = favorites.some(fav => fav.id === artist.id);
        if (!exists) {
            favorites.push(artist);
            localStorage.setItem('favoriteArtists', JSON.stringify(favorites));
        }
    },
    
    // Remove artist from favorites
    removeArtist(artistId) {
        const favorites = this.getSavedArtists().filter(artist => artist.id !== artistId);
        localStorage.setItem('favoriteArtists', JSON.stringify(favorites));
    },
    
    // Get all saved artists
    getSavedArtists() {
        const favorites = localStorage.getItem('favoriteArtists');
        return favorites ? JSON.parse(favorites) : [];
    },
    
    // Check if artist is saved
    isArtistSaved(artistId) {
        const favorites = this.getSavedArtists();
        return favorites.some(artist => artist.id === artistId);
    },
    
    // Save last searched artist
    setLastArtist(artistName) {
        localStorage.setItem('lastArtist', artistName);
    },
    
    // Get last searched artist
    getLastArtist() {
        return localStorage.getItem('lastArtist');
    },
    
    // Save last viewed tab for artist
    setLastTab(artistId, tabId) {
        const tabs = JSON.parse(localStorage.getItem('artistTabs') || '{}');
        tabs[artistId] = tabId;
        localStorage.setItem('artistTabs', JSON.stringify(tabs));
    },
    
    // Get last viewed tab for artist
    getLastTab(artistId) {
        const tabs = JSON.parse(localStorage.getItem('artistTabs') || '{}');
        return tabs[artistId] || 'bio';
    },
    
    // Save theme preference
    setTheme(theme) {
        localStorage.setItem('theme', theme);
    },
    
    // Get theme preference
    getTheme() {
        return localStorage.getItem('theme');
    }
};