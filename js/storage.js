const Storage = {
    // Favorite artists
    getFavorites() {
        const favorites = localStorage.getItem('favoriteArtists');
        return favorites ? JSON.parse(favorites) : [];
    },
    
    addFavorite(artist) {
        const favorites = this.getFavorites();
        if (!favorites.some(fav => fav.id === artist.id)) {
            favorites.push(artist);
            localStorage.setItem('favoriteArtists', JSON.stringify(favorites));
        }
    },
    
    removeFavorite(artistId) {
        const favorites = this.getFavorites().filter(fav => fav.id !== artistId);
        localStorage.setItem('favoriteArtists', JSON.stringify(favorites));
    },
    
    isArtistSaved(artistId) {
        return this.getFavorites().some(fav => fav.id === artistId);
    },
    
   // Last viewed tab for artists
    saveLastTab(artistId, tabName) {
        const lastTabs = JSON.parse(localStorage.getItem('lastTabs') || '{}');
        lastTabs[artistId] = tabName;
        localStorage.setItem('lastTabs', JSON.stringify(lastTabs));
    },

    getLastTab(artistId) {
        const lastTabs = JSON.parse(localStorage.getItem('lastTabs') || '{}');
        return lastTabs[artistId];
    },
    // Theme preference is handled in main.js
};

export { Storage };