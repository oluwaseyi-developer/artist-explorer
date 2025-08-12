const API = {
    // API Keys
    spotifyClientId: 'b0f624ed7f2f417daba654303fc0c075',
    spotifyClientSecret: 'd10a9871f71d4b9cb4b534c6e186a01e',
    youtubeApiKey: 'AIzaSyB_m-xx7O5_htGxLxNOtnN4p75rS3tLSI0',
    
    // Spotify token
    spotifyToken: null,
    
    // Get Spotify access token
    async getSpotifyToken() {
        if (this.spotifyToken) return this.spotifyToken;
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${this.spotifyClientId}:${this.spotifyClientSecret}`)
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await response.json();
        this.spotifyToken = data.access_token;
        return this.spotifyToken;
    },
    
    // Search for artist
    async searchArtist(query) {
        try {
            const token = await this.getSpotifyToken();
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.artists.items.length === 0) {
                throw new Error('Artist not found');
            }
            
            const artist = data.artists.items[0];
            
            return {
                id: artist.id,
                name: artist.name,
                genres: artist.genres,
                followers: artist.followers.total,
                popularity: artist.popularity,
                image: artist.images.length > 0 ? artist.images[0].url : 'assets/images/default-artist.jpg',
                spotifyUrl: artist.external_urls.spotify
            };
        } catch (error) {
            console.error('Error searching artist:', error);
            throw error;
        }
    },
    
    // Get artist's top tracks
    async getTopTracks(artistId) {
        try {
            const token = await this.getSpotifyToken();
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            return data.tracks.map(track => ({
                name: track.name,
                album: track.album.name,
                previewUrl: track.preview_url
            }));
        } catch (error) {
            console.error('Error getting top tracks:', error);
            return [];
        }
    },
    
    // Get artist's albums
    async getAlbums(artistId) {
        try {
            const token = await this.getSpotifyToken();
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?market=US&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            // Filter to unique albums (by name) and sort by release date
            const uniqueAlbums = [];
            const albumNames = new Set();
            
            data.items
                .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
                .forEach(album => {
                    if (!albumNames.has(album.name)) {
                        albumNames.add(album.name);
                        uniqueAlbums.push({
                            name: album.name,
                            releaseDate: album.release_date,
                            totalTracks: album.total_tracks,
                            type: album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1),
                            image: album.images.length > 0 ? album.images[0].url : 'assets/images/default-album.jpg'
                        });
                    }
                });
            
            return uniqueAlbums;
        } catch (error) {
            console.error('Error getting albums:', error);
            return [];
        }
    },
    
    // Get related YouTube videos
    async getVideos(artistName) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(artistName + ' music')}&type=video&maxResults=10&key=${this.youtubeApiKey}`);
            
            const data = await response.json();
            
            return data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                channel: item.snippet.channelTitle,
                date: new Date(item.snippet.publishedAt).toLocaleDateString()
            }));
        } catch (error) {
            console.error('Error getting YouTube videos:', error);
            return [];
        }
    }
};