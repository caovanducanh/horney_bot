const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const CONFIG = require('../config/constants');

/**
 * Crawler Service for MissAV
 */
class CrawlerService {
    constructor() {
        this.lastRequestTime = 0;
        this.requestDelay = 3000; // 3 seconds between requests
        this.lastVideoUrl = null; // Avoid duplicates
        this.browser = null; // Puppeteer browser instance
    }
    
    /**
     * Initialize Puppeteer browser
     */
    async initBrowser() {
        if (!this.browser) {
            console.log('🚀 Initializing Puppeteer browser...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            console.log('✅ Puppeteer browser initialized');
        }
        return this.browser;
    }

    /**
     * Close Puppeteer browser
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('🔴 Puppeteer browser closed');
        }
    }

    /**
     * Get random hot video using Puppeteer (bypass Cloudflare)
     */
    async getRandomHotVideoWithPuppeteer() {
        console.log('🔥 Getting video with Puppeteer (bypass Cloudflare)...');
        
        try {
            await this.rateLimitDelay();
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            
            // Set realistic browser settings
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1366, height: 768 });
            
            // Set additional headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br'
            });
            
            // Try multiple URLs
            const urls = [
                'https://missav.ws/dm18/vi',
                'https://missav.ws/vi/new',
                'https://missav.com/en'
            ];
            
            for (const url of urls) {
                try {
                    console.log(`🔍 Trying Puppeteer with: ${url}`);
                    
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 30000 
                    });
                    
                    // Wait for content to load
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Try to find videos with multiple selectors
                    const videos = await page.evaluate(() => {
                        const videoElements = [];
                        
                        // Multiple selectors to try
                        const selectors = [
                            'a[href*="/vi/"]',
                            '.thumbnail',
                            '.group a',
                            'a[href*="dm18/vi/"]',
                            '.grid a',
                            'a img'
                        ];
                        
                        for (const selector of selectors) {
                            const elements = document.querySelectorAll(selector);
                            
                            for (let i = 0; i < Math.min(elements.length, 10); i++) {
                                const element = elements[i];
                                let href = element.getAttribute('href');
                                
                                // Check if it's a valid video URL
                                if (!href || !href.includes('/vi/')) continue;
                                
                                // Get title
                                let title = '';
                                const img = element.querySelector('img');
                                if (img) {
                                    title = img.getAttribute('alt') || img.getAttribute('title') || '';
                                }
                                
                                // Extract from URL if no title
                                if (!title && href) {
                                    const match = href.match(/\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,})/i);
                                    title = match ? match[1].toUpperCase() : 'Hot JAV';
                                }
                                
                                // Get image
                                let image = '';
                                if (img) {
                                    image = img.getAttribute('data-src') || 
                                           img.getAttribute('src') || 
                                           img.getAttribute('data-original') || '';
                                }
                                
                                // Build full URL
                                const fullUrl = href.startsWith('http') ? href : `https://missav.ws${href}`;
                                
                                if (title && fullUrl) {
                                    videoElements.push({
                                        title: title,
                                        url: fullUrl,
                                        image: image
                                    });
                                }
                            }
                            
                            if (videoElements.length >= 5) break;
                        }
                        
                        return videoElements;
                    });
                    
                    if (videos.length > 0) {
                        // Select random video
                        const randomIndex = Math.floor(Math.random() * videos.length);
                        const selected = videos[randomIndex];
                        
                        // Fix image URL
                        if (selected.image) {
                            if (selected.image.startsWith('//')) {
                                selected.image = `https:${selected.image}`;
                            } else if (!selected.image.startsWith('http')) {
                                selected.image = `https://missav.ws${selected.image}`;
                            }
                        }
                        
                        selected.title = `🔥 ${selected.title}`;
                        
                        console.log(`🎯 Puppeteer found ${videos.length} videos, selected: ${selected.title}`);
                        console.log(`🔗 URL: ${selected.url}`);
                        
                        await page.close();
                        return selected;
                    }
                    
                } catch (urlError) {
                    console.error(`❌ Puppeteer failed for ${url}:`, urlError.message);
                    continue;
                }
            }
            
            await page.close();
            console.log('❌ No videos found with Puppeteer');
            return null;
            
        } catch (error) {
            console.error('❌ Puppeteer error:', error.message);
            return null;
        }
    }
    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const delay = this.requestDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }
    
    /**
     * Enhanced headers to bypass bot detection
     */
    getRandomHeaders() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        
        const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        return {
            'User-Agent': randomUA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        };
    }
    
    /**
     * Fetch HTML from URL with advanced bypass techniques
     */
    async fetchWithRetry(url, maxRetries = 3) {
        await this.rateLimitDelay();
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔍 Attempt ${attempt}/${maxRetries}: ${url}`);
                
                const response = await fetch(url, {
                    headers: this.getRandomHeaders(),
                    timeout: 15000,
                    redirect: 'follow'
                });
                
                if (!response.ok) {
                    if (response.status === 403) {
                        console.log(`🚫 403 Forbidden - waiting longer before retry`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const html = await response.text();
                console.log(`✅ Successfully fetched: ${url}`);
                return html;
                
            } catch (error) {
                console.log(`❌ Attempt ${attempt} failed for ${url}: ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Progressive delay
                const delay = attempt * 2000; // 2s, 4s, 6s
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    /**
     * Check if URL is valid JAV video
     */
    isValidVideoUrl(href) {
        if (!href) return false;
        
        const patterns = [
            /\/vi\/[A-Z]{2,}-?\d{3,}/i,        // Standard JAV codes  
            /\/vi\/fc2-ppv-\d{6,}/i,           // FC2 codes
            /\/vi\/[^\/]+\-\d{3,}/i,           // General pattern
            /dm18\/vi\/[A-Z]{2,}-?\d{3,}/i,    // DM18 videos
            /dm13\/vi\/[A-Z]{2,}-?\d{3,}/i     // DM13 videos
        ];

        return patterns.some(pattern => pattern.test(href));
    }
    
    /**
     * Extract videos from HTML
     */
    parseVideos(html) {
        const $ = cheerio.load(html);
        const videos = [];
        
        // Multiple selectors to try
        const selectors = [
            'a[href*="/vi/"]',
            '.thumbnail',
            '.group a',
            'a[href*="dm18/vi/"]',
            'a[href*="dm13/vi/"]',
            '.grid a',
            'a img',
            'div[class*="grid"] a'
        ];
        
        for (const selector of selectors) {
            console.log(`🔍 Trying selector: ${selector}`);
            const elements = $(selector);
            console.log(`   Found ${elements.length} elements`);
            
            elements.each((index, element) => {
                try {
                    const $el = $(element);
                    let href = $el.attr('href');
                    
                    // Find href in parent/child if not direct
                    if (!href) {
                        href = $el.find('a').attr('href') || $el.parent('a').attr('href');
                    }
                    
                    if (!this.isValidVideoUrl(href)) {
                        return; // Continue to next
                    }
                    
                    // Build full URL
                    const url = href.startsWith('http') ? href : `https://missav.ws${href}`;
                    
                    // Extract title
                    let title = $el.find('img').attr('alt') || 
                               $el.find('img').attr('title') ||
                               $el.attr('title') ||
                               $el.text().trim();
                    
                    // Extract from URL if no title
                    if (!title && href) {
                        const match = href.match(/\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,})/i);
                        title = match ? match[1].toUpperCase() : 'Hot JAV';
                    }
                    
                    // Get image
                    const img = $el.find('img').first();
                    let image = img.attr('data-src') || 
                               img.attr('src') || 
                               img.attr('data-original') ||
                               img.attr('data-lazy-src');
                    
                    // Fix image URL
                    if (image) {
                        if (image.startsWith('//')) {
                            image = `https:${image}`;
                        } else if (!image.startsWith('http') && !image.startsWith('data:')) {
                            image = `https://missav.ws${image}`;
                        }
                    }
                    
                    if (title && url && url !== this.lastVideoUrl) {
                        videos.push({
                            title: `🔥 ${title}`,
                            url: url,
                            image: image
                        });
                    }
                    
                } catch (parseError) {
                    // Skip this element
                }
            });
            
            console.log(`   Total videos found so far: ${videos.length}`);
            if (videos.length >= 15) break;
        }
        
        return videos;
    }
    
    /**
     * Get random hot video - now with Puppeteer priority
     */
    async getRandomHotVideo() {
        console.log('🔥 Getting random hot video from MissAV...');
        
        // Try Puppeteer first (most reliable)
        console.log('🎯 Trying Puppeteer method...');
        const puppeteerVideo = await this.getRandomHotVideoWithPuppeteer();
        if (puppeteerVideo) {
            this.lastVideoUrl = puppeteerVideo.url;
            return puppeteerVideo;
        }
        
        // Fallback to regular fetch method
        console.log('🔄 Puppeteer failed, trying regular fetch...');
        const urls = [
            'https://missav.ws/dm18/vi',
            'https://missav.ws/vi/new',
            'https://missav.ws/vi/release',
            'https://missav.ws/vi/fc2',
            'https://missav.ws/vi/uncensored-leak',
            'https://missav.ws/dm13/vi'
        ];
        
        let allVideos = [];
        
        // Try each URL
        for (const url of urls) {
            try {
                const html = await this.fetchWithRetry(url);
                const videos = this.parseVideos(html);
                
                allVideos.push(...videos);
                console.log(`🎬 Found ${videos.length} videos from ${url}`);
                
                if (allVideos.length >= 10) break;
                
            } catch (error) {
                console.error(`❌ Failed ${url}:`, error.message);
                continue;
            }
        }
        
        if (allVideos.length === 0) {
            console.log('❌ All methods failed, using fallback');
            return {
                title: '🆘 Fallback JAV Video',
                url: 'https://missav.ws/dm18/vi',
                image: 'https://via.placeholder.com/400x600/ff1493/ffffff?text=HOT+VIDEO'
            };
        }
        
        // Remove duplicates
        const uniqueVideos = allVideos.filter((video, index, self) => 
            index === self.findIndex(v => v.url === video.url)
        );
        
        // Select random
        const randomIndex = Math.floor(Math.random() * uniqueVideos.length);
        const selected = uniqueVideos[randomIndex];
        
        // Save to avoid duplicates next time
        this.lastVideoUrl = selected.url;
        
        console.log(`🎯 Selected ${randomIndex + 1}/${uniqueVideos.length}: ${selected.title}`);
        console.log(`🔗 ${selected.url}`);
        
        return selected;
    }

    /**
     * Add delay between requests to avoid being blocked
     */
}

module.exports = CrawlerService;
