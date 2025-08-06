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
     * Extract videos from page (optimized)
     */
    async extractVideosFromPage(page) {
        return await page.evaluate(() => {
            const videoElements = [];
            const selectors = [
                'a[href*="/vi/"]',
                'a[href*="/dm18/vi/"]',
                '.thumbnail',
                '.group a'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                
                for (let i = 0; i < Math.min(elements.length, 10); i++) {
                    const element = elements[i];
                    let href = element.getAttribute('href');
                    
                    // Validate video URL
                    if (!href || !href.includes('/vi/') || 
                        href.includes('/genres') || href.includes('/vip') || 
                        href.includes('/makers') || href.includes('/categories')) {
                        continue;
                    }
                    
                    // Must have video code
                    const codeMatch = href.match(/\/vi\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,}|\w+\d{3,})/i);
                    if (!codeMatch) continue;
                    
                    const videoCode = codeMatch[1].toUpperCase();
                    
                    // Get title and image
                    const img = element.querySelector('img');
                    let title = img ? (img.getAttribute('alt') || img.getAttribute('title') || '') : '';
                    let image = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
                    
                    if (!title) title = videoCode;
                    
                    const fullUrl = href.startsWith('http') ? href : `https://missav.ws${href}`;
                    
                    if (title && fullUrl) {
                        videoElements.push({
                            title: `🔥 ${title}`,
                            videoCode: videoCode,
                            url: fullUrl,
                            image: image
                        });
                    }
                }
                
                if (videoElements.length >= 5) break;
            }
            
            return videoElements;
        });
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
     * Get random hot video using Puppeteer bypass (optimized)
     */
    async getRandomHotVideoWithPuppeteer() {
        try {
            await this.rateLimitDelay();
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            
            // Optimized settings for bypass
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1366, height: 768 });
            
            // Try URLs with longer timeout
            const urls = ['https://missav.ws/dm18/vi', 'https://missav.ws/vi/new'];
            
            for (const url of urls) {
                try {
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 45000  // Long timeout for bypass
                    });
                    
                    // Wait for bypass to complete
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    const videos = await this.extractVideosFromPage(page);
                    
                    if (videos.length > 0) {
                        const selected = videos[Math.floor(Math.random() * videos.length)];
                        
                        // Fix image URL
                        if (selected.image && !selected.image.startsWith('http')) {
                            selected.image = selected.image.startsWith('//') ? 
                                `https:${selected.image}` : 
                                `https://missav.ws${selected.image}`;
                        }
                        
                        console.log(`✅ Found: ${selected.title}`);
                        await page.close();
                        return selected;
                    }
                    
                } catch (urlError) {
                    continue;
                }
            }
            
            await page.close();
            return null;
            
        } catch (error) {
            console.error('❌ Bypass failed:', error.message);
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
     * Get random hot video - Optimized with Puppeteer bypass
     */
    async getRandomHotVideo() {
        console.log('🔥 Getting random hot video...');
        
        // Use Puppeteer bypass directly (most reliable)
        const video = await this.getRandomHotVideoWithPuppeteer();
        if (video) {
            this.lastVideoUrl = video.url;
            return video;
        }
        
        console.log('❌ Bypass failed');
        return null;
    }

    /**
     * Add delay between requests to avoid being blocked
     */
}

module.exports = CrawlerService;
