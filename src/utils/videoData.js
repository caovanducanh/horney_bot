/**
 * Video data structure and utilities
 */

class VideoData {
    constructor(title, url, image = null, source = 'MissAV') {
        this.title = title;
        this.url = url;
        this.image = image;
        this.source = source;
        this.timestamp = new Date();
    }
    
    /**
     * Validate video data
     */
    isValid() {
        return this.title && this.url && this.url.includes('missav.com');
    }
    
    /**
     * Get formatted title with emoji
     */
    getFormattedTitle() {
        if (this.title.startsWith('🔥') || this.title.startsWith('🎥') || this.title.startsWith('🆘')) {
            return this.title;
        }
        return `🔥 ${this.title}`;
    }
    
    /**
     * Get clean URL
     */
    getCleanUrl() {
        if (!this.url) return null;
        
        // Ensure URL starts with https
        if (this.url.startsWith('//')) {
            return `https:${this.url}`;
        } else if (!this.url.startsWith('http')) {
            return `https://missav.com${this.url}`;
        }
        return this.url;
    }
    
    /**
     * Get clean image URL
     */
    getCleanImageUrl() {
        if (!this.image) return null;
        
        if (this.image.startsWith('//')) {
            return `https:${this.image}`;
        } else if (!this.image.startsWith('http')) {
            return `https://missav.com${this.image}`;
        }
        return this.image;
    }
    
    /**
     * Extract JAV code from URL or title
     */
    getJavCode() {
        const urlMatch = this.url?.match(/([A-Z]{2,}-?\d{3,})/);
        if (urlMatch) return urlMatch[1];
        
        const titleMatch = this.title?.match(/([A-Z]{2,}-?\d{3,})/);
        if (titleMatch) return titleMatch[1];
        
        return null;
    }
    
    /**
     * Convert to plain object
     */
    toObject() {
        return {
            title: this.getFormattedTitle(),
            url: this.getCleanUrl(),
            image: this.getCleanImageUrl(),
            source: this.source,
            timestamp: this.timestamp,
            javCode: this.getJavCode()
        };
    }
}

module.exports = VideoData;
