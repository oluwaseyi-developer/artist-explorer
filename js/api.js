// Spotify API configuration
const SPOTIFY_CLIENT_ID = 'b0f624ed7f2f417daba654303fc0c075';
const SPOTIFY_CLIENT_SECRET = 'd10a9871f71d4b9cb4b534c6e186a01e';
let spotifyAccessToken = '';

// YouTube API configuration
const YOUTUBE_API_KEY = 'AIzaSyB_m-xx7O5_htGxLxNOtnN4p75rS3tLSI0';

// Spotify API functions
const SpotifyAPI = {
    async getAccessToken() {
        if (spotifyAccessToken) return spotifyAccessToken;
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
            },
            body: 'grant_type=client_credentials'
        });
        
        const data = await response.json();
        spotifyAccessToken = data.access_token;
        return spotifyAccessToken;
    },
    
    async searchArtist(query) {
        const token = await this.getAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.artists.items.length === 0) return null;
        
        return this.formatArtist(data.artists.items[0]);
    },
    
    async getArtistById(id) {
        const token = await this.getAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        return this.formatArtist(data);
    },
    
    async getTopTracks(artistId) {
        const token = await this.getAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        return data.tracks || [];
    },
    
    async getAlbums(artistId) {
        const token = await this.getAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        return data.items || [];
    },
    
    formatArtist(artist) {
        return {
            id: artist.id,
            name: artist.name,
            genres: artist.genres,
            followers: artist.followers,
            popularity: artist.popularity,
            image: artist.images.length > 0 ? artist.images[0].url : 'assets/icons/default-artist.png',
            external_urls: artist.external_urls
        };
    }
};

// YouTube API functions
const YouTubeAPI = {
  async searchVideos(artistName) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `maxResults=12&` +
        `q=${encodeURIComponent(artistName + " music")}&` +
        `type=video&` +
        `videoEmbeddable=true&` +
        `key=${YOUTUBE_API_KEY}`
      );
      return response.ok ? (await response.json()).items : [];
    } catch (error) {
      console.error("YouTube API Error:", error);
      return [];
    }
  },

  getEmbedUrl(videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?` +
           `autoplay=1&` +
           `rel=0&` +              // No related videos
           `modestbranding=1&` +   // Less YouTube branding
           `enablejsapi=1`;        // Enable JS API for controls
  }
};


// Wikipedia API functions
const WikipediaAPI = {
    async getArtistBio(artistName) {
        try {
            // First, get the page ID for the artist
            const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistName)}&format=json&origin=*`);
            const searchData = await searchResponse.json();
            
            if (searchData.query.search.length === 0) {
                throw new Error('Artist not found on Wikipedia');
            }
            
            const pageId = searchData.query.search[0].pageid;
            
            // Then get the extract (summary) of the page
            const contentResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=true&explaintext=true&pageids=${pageId}&format=json&origin=*&pithumbsize=300`);
            const contentData = await contentResponse.json();
            
            const page = contentData.query.pages[pageId];
            let bio = `<p>${page.extract}</p>`;
            
            if (page.thumbnail) {
                bio = `<div class="bio-image"><img src="${page.thumbnail.source}" alt="${artistName}"></div>` + bio;
            }
            
            bio += `<p class="read-more"><a href="https://en.wikipedia.org/?curid=${pageId}" target="_blank">Read more on Wikipedia</a></p>`;
            
            return bio;
        } catch (error) {
            console.error('Error fetching Wikipedia data:', error);
            throw error;
        }
    }
};

// Export for use in other modules
export { SpotifyAPI, YouTubeAPI, WikipediaAPI };