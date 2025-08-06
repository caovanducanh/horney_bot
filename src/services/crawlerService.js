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
        this.requestDelay = 1000; // Ultra fast - 1 second only
        this.lastVideoUrl = null;
        this.browser = null; // Always fresh browser for random videos
    }
    
    /**
     * Initialize Puppeteer browser (always fresh for true randomness)
     */
    async initBrowser() {
        // Always create new browser for fresh random results
        console.log('🚀 Creating fresh browser...');
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security', // Extra speed
                '--disable-background-timer-throttling', // Faster JS
                '--disable-backgrounding-occluded-windows'
            ]
        });
        console.log('✅ Fresh browser ready');
        return this.browser;
    }

    /**
     * Extract videos from page (ultra optimized v2)
     */
    async extractVideosFromPage(page) {
        return await page.evaluate(() => {
            const videoElements = [];
            
            // Smart selectors - prioritize elements with images and text
            const selectors = [
                'a[href*="/vi/"]:has(img):has(.text-secondary)',  // Best: has image + description
                'a[href*="/dm18/vi/"]:has(img):has(.text-secondary)',
                'a[href*="/vi/"]:has(img)',  // Fallback: just has image
                'a[href*="/dm18/vi/"]:has(img)',
                '.thumbnail a:has(img)',
                '.group a:has(img)'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                
                for (let i = 0; i < Math.min(elements.length, 6); i++) {
                    const element = elements[i];
                    let href = element.getAttribute('href');
                    
                    // Skip invalid URLs fast
                    if (!href || !href.includes('/vi/') || 
                        href.includes('/genres') || href.includes('/vip') || 
                        href.includes('/makers') || href.includes('/categories')) {
                        continue;
                    }
                    
                    // Extract video code (must have)
                    const codeMatch = href.match(/\/vi\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,}|\w+\d{3,})/i);
                    if (!codeMatch) continue;
                    
                    const videoCode = codeMatch[1].toUpperCase();
                    
                    // Smart title extraction - get REAL title, not just code
                    let realTitle = '';
                    
                    // Priority 1: Description text (most likely actual title)
                    const descText = element.querySelector('.text-secondary, .title, .video-title');
                    if (descText && descText.textContent.trim()) {
                        const text = descText.textContent.trim();
                        if (text.length > videoCode.length && !text.includes('http')) {
                            realTitle = text;
                        }
                    }
                    
                    // Priority 2: Image alt text (often has good titles)
                    if (!realTitle) {
                        const img = element.querySelector('img');
                        if (img) {
                            const altText = img.getAttribute('alt') || img.getAttribute('title') || '';
                            if (altText && altText.length > videoCode.length && 
                                !altText.toLowerCase().includes('thumbnail') &&
                                !altText.toLowerCase().includes('image')) {
                                realTitle = altText;
                            }
                        }
                    }
                    
                    // Priority 3: Any nearby text content
                    if (!realTitle) {
                        const textElements = element.querySelectorAll('span, p, div');
                        for (const textEl of textElements) {
                            const text = textEl.textContent.trim();
                            if (text && text.length > 10 && text.length < 100 && 
                                !text.includes(videoCode) && !text.includes('http')) {
                                realTitle = text;
                                break;
                            }
                        }
                    }
                    
                    // Fallback: Use a descriptive default
                    if (!realTitle || realTitle === videoCode) {
                        realTitle = 'Hot JAV Video';
                    }
                    
                    // Get image
                    const img = element.querySelector('img');
                    let image = '';
                    if (img) {
                        image = img.getAttribute('data-src') || 
                               img.getAttribute('src') || 
                               img.getAttribute('data-original') || '';
                    }
                    
                    const fullUrl = href.startsWith('http') ? href : `https://missav.ws${href}`;
                    
                    if (realTitle && videoCode && fullUrl) {
                        videoElements.push({
                            title: realTitle.substring(0, 100), // Limit length
                            videoCode: videoCode,
                            url: fullUrl,
                            image: image
                        });
                    }
                }
                
                if (videoElements.length >= 4) break; // Enough for good selection
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
            console.log('🔴 Browser closed - fresh start next time');
        }
    }

    /**
     * Get random hot video using Puppeteer bypass (lightning fast - no cache)
     */
    async getRandomHotVideoWithPuppeteer() {
        let browser = null;
        try {
            await this.rateLimitDelay();
            browser = await this.initBrowser();
            const page = await browser.newPage();
            
            // Lightning fast settings
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setViewport({ width: 1280, height: 720 });
            
            // Block everything except HTML to maximize speed
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (resourceType === 'stylesheet' || resourceType === 'font' || 
                    resourceType === 'image' || resourceType === 'media') {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            // Try fastest URLs first
            const urls = ['https://missav.ws/dm18/vi', 'https://missav.ws/vi'];
            
            for (const url of urls) {
                try {
                    console.log(`🚀 Trying: ${url}`);
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 15000  // Reduced to 15s max
                    });
                    
                    // Ultra quick bypass wait - just 1 second
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const videos = await this.extractVideosFromPage(page);
                    console.log(`📋 Found ${videos.length} videos`);
                    
                    if (videos.length > 0) {
                        const selected = videos[Math.floor(Math.random() * videos.length)];
                        
                        // Add fire emoji to title
                        selected.title = `🔥 ${selected.title}`;
                        
                        // Fix image URL
                        if (selected.image && !selected.image.startsWith('http')) {
                            selected.image = selected.image.startsWith('//') ? 
                                `https:${selected.image}` : 
                                `https://missav.ws${selected.image}`;
                        }
                        
                        console.log(`✅ Found: ${selected.title} (${selected.videoCode})`);
                        await page.close();
                        await browser.close(); // Always close for fresh random
                        return selected;
                    }
                    
                } catch (urlError) {
                    console.log(`❌ URL failed: ${url} - ${urlError.message}`);
                    continue;
                }
            }
            
            await page.close();
            await browser.close();
            console.log('❌ No videos found');
            return null;
            
        } catch (error) {
            if (browser) await browser.close();
            console.error('❌ Bypass failed:', error.message);
            return null;
        }
    }
    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const delay = this.requestDelay - timeSinceLastRequest;
            // Removed log for cleaner output
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
     * Get random hot video - Ultra optimized (no cache, pure random)
     */
    async getRandomHotVideo() {
        console.log('🔥 Getting random hot video...');
        
        // Direct Puppeteer bypass - always fresh for true randomness
        const video = await this.getRandomHotVideoWithPuppeteer();
        if (video) {
            this.lastVideoUrl = video.url;
            return video;
        }
        
        console.log('❌ All methods failed');
        return null;
    }

    /**
     * Add delay between requests to avoid being blocked
     */
}

module.exports = CrawlerService;
