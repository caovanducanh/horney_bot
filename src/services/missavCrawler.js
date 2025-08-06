const fetch = require('node-fetch');
const cheerio = require('cheerio');
const CONFIG = require('../config/constants');
const Logger = require('../utils/logger');
const VideoData = require('../utils/videoData');

/**
 * MissAV Crawler Service
 */
class MissAVCrawler {
    constructor() {
        this.lastRequestTime = 0;
        this.requestDelay = 2000; // 2 seconds between requests
    }
    
    /**
     * Add delay between requests to avoid being blocked
     */
    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const delay = this.requestDelay - timeSinceLastRequest;
            Logger.debug(`Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }
    
    /**
     * Fetch HTML from a URL with error handling
     */
    async fetchWithRetry(url, maxRetries = 3) {
        await this.rateLimitDelay();
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Logger.search(`Attempt ${attempt}/${maxRetries}: ${url}`);
                
                const response = await fetch(url, {
                    headers: CONFIG.HEADERS,
                    timeout: CONFIG.REQUEST_TIMEOUT
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const html = await response.text();
                Logger.success(`Successfully fetched: ${url}`);
                return html;
                
            } catch (error) {
                Logger.warning(`Attempt ${attempt} failed for ${url}: ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    /**
     * Parse videos from HTML
     */
    parseVideosFromHTML(html, sourceUrl) {
        const $ = cheerio.load(html);
        const videos = [];
        
        for (const selector of CONFIG.VIDEO_SELECTORS) {
            Logger.debug(`Trying selector: ${selector}`);
            const elements = $(selector);
            
            elements.each((index, element) => {
                try {
                    const $el = $(element);
                    const href = $el.attr('href');
                    
                    // Validate JAV video URL
                    if (!href || !href.includes('/en/') || !href.match(/[A-Z]{2,}-?\d{3,}/)) {
                        return; // Continue to next element
                    }
                    
                    // Extract video data
                    const url = href.startsWith('http') ? href : `https://missav.com${href}`;
                    
                    // Get title from various sources
                    let title = $el.find('.text-secondary').text().trim() || 
                               $el.find('img').attr('alt') || 
                               $el.find('img').attr('title') ||
                               $el.attr('title') ||
                               '';
                    
                    // Extract title from URL if not found
                    if (!title && href) {
                        const match = href.match(/\/([A-Z]{2,}-?\d{3,})/);
                        title = match ? match[1] : 'JAV Video';
                    }
                    
                    // Get image
                    const imgElement = $el.find('img').first();
                    let image = imgElement.attr('data-src') || 
                               imgElement.attr('src') || 
                               imgElement.attr('data-original') ||
                               imgElement.attr('data-lazy-src');
                    
                    if (title && url) {
                        const videoData = new VideoData(title, url, image);
                        if (videoData.isValid()) {
                            videos.push(videoData);
                        }
                    }
                } catch (parseError) {
                    Logger.debug(`Error parsing element: ${parseError.message}`);
                }
            });
            
            Logger.debug(`Selector "${selector}" found ${videos.length} videos so far`);
            
            // Stop if we have enough videos
            if (videos.length >= 20) break;
        }
        
        return videos;
    }
    
    /**
     * Get random hot video from MissAV
     */
    async getRandomHotVideo() {
        Logger.fire('Getting random hot video from MissAV...');
        
        let allVideos = [];
        
        // Try each URL until we get enough videos
        for (const url of CONFIG.MISSAV_URLS) {
            try {
                const html = await this.fetchWithRetry(url);
                const videos = this.parseVideosFromHTML(html, url);
                
                allVideos.push(...videos);
                Logger.info(`Found ${videos.length} videos from ${url}`);
                
                // Stop if we have enough videos
                if (allVideos.length >= 10) break;
                
            } catch (error) {
                Logger.error(`Failed to fetch ${url}`, error.message);
                continue;
            }
        }
        
        if (allVideos.length === 0) {
            Logger.error('No videos found from any source');
            return null;
        }
        
        // Remove duplicates based on URL
        const uniqueVideos = allVideos.filter((video, index, self) => 
            index === self.findIndex(v => v.url === video.url)
        );
        
        Logger.success(`Found ${uniqueVideos.length} unique videos`);
        
        // Select random video
        const randomIndex = Math.floor(Math.random() * uniqueVideos.length);
        const selectedVideo = uniqueVideos[randomIndex];
        
        Logger.video(`Selected video ${randomIndex + 1}/${uniqueVideos.length}: ${selectedVideo.title}`);
        Logger.info(`URL: ${selectedVideo.getCleanUrl()}`);
        Logger.info(`Image: ${selectedVideo.getCleanImageUrl() || 'No image'}`);
        
        return selectedVideo;
    }
    
    /**
     * Fallback method to get any video
     */
    async getFallbackVideo() {
        Logger.warning('Using fallback method...');
        
        try {
            const html = await this.fetchWithRetry('https://missav.com/en', 1);
            const $ = cheerio.load(html);
            
            const firstLink = $('a[href*="/en/"][href*="-"]').first();
            if (firstLink.length) {
                const href = firstLink.attr('href');
                const url = href.startsWith('http') ? href : `https://missav.com${href}`;
                const img = firstLink.find('img');
                const title = img.attr('alt') || img.attr('title') || 'JAV Video';
                const image = img.attr('data-src') || img.attr('src');
                
                return new VideoData(`🆘 ${title}`, url, image);
            }
        } catch (fallbackError) {
            Logger.error('Fallback also failed', fallbackError.message);
        }
        
        return null;
    }
}

module.exports = MissAVCrawler;
