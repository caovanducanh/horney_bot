/**
 * Enhanced MissAV Crawler - Gets detailed video information
 */

const puppeteer = require('puppeteer');
const CONFIG = require('../config/constants');

class DetailedCrawler {
    constructor() {
        this.browser = null;
        this.lastRequestTime = 0;
        this.requestDelay = 2000;
    }

    /**
     * Initialize Puppeteer browser with optimized settings
     */
    async initBrowser() {
        if (!this.browser) {
            console.log('🚀 Initializing optimized Puppeteer browser...');
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
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            console.log('✅ Optimized Puppeteer browser initialized');
        }
        return this.browser;
    }

    /**
     * Close browser
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('🔴 Browser closed');
        }
    }

    /**
     * Rate limiting
     */
    async rateLimitDelay() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const delay = this.requestDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Get detailed video information with optimized Puppeteer
     */
    async getRandomHotVideo() {
        console.log('🎲 Đang lấy video random (optimized)...');
        console.log('🔥 Getting random hot video (optimized)...');
        console.log('🎯 Trying optimized Puppeteer...');
        
        const startTime = Date.now();
        
        try {
            await this.rateLimitDelay();
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            
            // Set realistic browser settings to bypass detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0');
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Set additional headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8,ja;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Cache-Control': 'max-age=0',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            });

            console.log('🔥 Getting video with optimized Puppeteer...');
            
            // Try multiple URLs for better success rate
            const urls = [
                'https://missav.ws/dm18/vi',
                'https://missav.ws/vi/new',
                'https://missav.ws/vi/hot',
                'https://missav.com/en'
            ];

            for (const url of urls) {
                try {
                    console.log(`🌐 Going to ${url.includes('missav.ws') ? 'missav.ws' : 'missav.com'} (optimized)...`);
                    
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 30000 
                    });
                    
                    // Wait for content to load
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    console.log('✅ Page loaded, extracting videos...');
                    
                    // Extract detailed video information
                    const videos = await page.evaluate(() => {
                        const videoElements = [];
                        
                        // Multiple selectors for different page layouts
                        const selectors = [
                            'a[href*="/vi/"]',           // Vietnamese videos
                            'a[href*="/en/"]',           // English videos
                            '.thumbnail',                // Thumbnail links
                            '.group a',                  // Group containers
                            '.grid a',                   // Grid containers
                            'a img'                      // Links with images
                        ];
                        
                        console.log('🔍 Searching for JAV videos...');
                        
                        for (const selector of selectors) {
                            const elements = document.querySelectorAll(selector);
                            
                            for (let i = 0; i < Math.min(elements.length, 15); i++) {
                                const element = elements[i];
                                let href = element.getAttribute('href');
                                
                                // Skip if no href or not a valid video URL
                                if (!href) continue;
                                
                                // Check if it's a valid JAV video URL
                                const isValidJAV = href.match(/\/(?:vi|en)\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,}|\w+\d+)/i);
                                if (!isValidJAV) continue;
                                
                                // Extract video code from URL (more robust extraction)
                                let videoCode = '';
                                const codeMatch = href.match(/\/(?:vi|en)\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,}|[A-Z]{2,}\d{3,}|\w+\d+)/i);
                                if (codeMatch) {
                                    videoCode = codeMatch[1].toUpperCase().replace(/FC2-PPV-/i, 'FC2-PPV-');
                                }
                                
                                // Get detailed information
                                let title = '';
                                let image = '';
                                
                                // Try to find image and title from various sources
                                const img = element.querySelector('img') || element.parentElement?.querySelector('img');
                                if (img) {
                                    title = img.getAttribute('alt') || img.getAttribute('title') || '';
                                    image = img.getAttribute('data-src') || 
                                           img.getAttribute('src') || 
                                           img.getAttribute('data-original') ||
                                           img.getAttribute('data-lazy-src') || 
                                           img.getAttribute('data-srcset') || '';
                                    
                                    // Clean up srcset if present
                                    if (image && image.includes(' ')) {
                                        image = image.split(' ')[0]; // Take first URL from srcset
                                    }
                                }
                                
                                // Additional title extraction from text content
                                if (!title) {
                                    const textElement = element.querySelector('.text-secondary') ||
                                                       element.querySelector('.title') ||
                                                       element.querySelector('h3') ||
                                                       element.querySelector('.video-title');
                                    if (textElement) {
                                        title = textElement.textContent.trim();
                                    }
                                }
                                
                                // Use video code as title if no better title found
                                if (!title || title.length < 3) {
                                    title = videoCode;
                                }
                                
                                // Build full URL
                                const fullUrl = href.startsWith('http') ? href : 
                                               (href.startsWith('/') ? `https://missav.ws${href}` : `https://missav.ws/${href}`);
                                
                                // Fix image URL
                                if (image) {
                                    if (image.startsWith('//')) {
                                        image = `https:${image}`;
                                    } else if (!image.startsWith('http') && !image.startsWith('data:')) {
                                        image = `https://missav.ws${image}`;
                                    }
                                }
                                
                                videoElements.push({
                                    title: title,
                                    videoCode: videoCode,
                                    url: fullUrl,
                                    image: image
                                });
                            }
                            
                            // Stop if we found enough videos
                            if (videoElements.length >= 10) break;
                        }
                        
                        return videoElements;
                    });
                    
                    console.log(`🎯 Found ${videos.length} JAV videos (optimized)`);
                    
                    if (videos.length > 0) {
                        // Select random video
                        const randomIndex = Math.floor(Math.random() * videos.length);
                        const selected = videos[randomIndex];
                        
                        console.log(`🎬 Getting details for: ${selected.videoCode}`);
                        
                        // Enhance the selected video info
                        const enhancedVideo = {
                            title: selected.title,
                            videoCode: selected.videoCode,
                            url: selected.url,
                            image: selected.image,
                            fullTitle: `${selected.title} (${selected.videoCode})`
                        };
                        
                        const loadTime = Date.now() - startTime;
                        console.log(`✅ Selected: ${enhancedVideo.fullTitle} - ${enhancedVideo.url} (optimized)`);
                        console.log(`⚡ Load time: ${loadTime}ms`);
                        
                        await page.close();
                        return enhancedVideo;
                    }
                    
                } catch (urlError) {
                    console.log(`❌ Failed with ${url}: ${urlError.message}`);
                    continue;
                }
            }
            
            await page.close();
            console.log('❌ No videos found with optimized method');
            return null;
            
        } catch (error) {
            console.error('❌ Optimized Puppeteer error:', error.message);
            return null;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.closeBrowser();
    }
}

module.exports = DetailedCrawler;
