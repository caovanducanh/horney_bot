const puppeteer = require('puppeteer');
const CONFIG = require('../config/constants');

/**
 * Crawler Service for MissAV - Ultra Clean & Smart
 */
class CrawlerService {
    constructor() {
        this.lastRequestTime = 0;
        this.requestDelay = 500; // Ultra fast - 500ms only
    }
    
    /**
     * Get working URLs with smart random selection
     */
    getNextUrls() {
        // Only use URLs that actually work
        const workingUrls = [
            'https://missav.ws/dm18/vi',
            'https://missav.ws/vi',
            'https://missav.ws/vi/new'
        ];
        
        // Random selection instead of rotation for true randomness
        const shuffled = [...workingUrls].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2); // Try max 2 URLs for speed
    }
    /**
     * Create fresh browser for each request (true randomness)
     */
    async createBrowser() {
        return await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-background-timer-throttling'
            ]
        });
    }

    /**
     * Extract videos - Ultra optimized for speed
     */
    async extractVideos(page) {
        return await page.evaluate(() => {
            const videos = [];
            
            // Super simple and fast selector - only what works
            const links = document.querySelectorAll('a[href*="/vi/"]:has(img), a[href*="/dm18/vi/"]:has(img)');
            
            for (let i = 0; i < Math.min(links.length, 5); i++) {
                const link = links[i];
                const href = link.getAttribute('href');
                
                if (!href || href.includes('/genres') || href.includes('/makers')) continue;
                
                // Fast video code extraction
                const codeMatch = href.match(/\/(?:dm18\/)?vi\/([A-Z0-9-]+)/i);
                if (!codeMatch) continue;
                
                const videoCode = codeMatch[1].toUpperCase();
                const img = link.querySelector('img');
                
                if (img) {
                    videos.push({
                        title: img.getAttribute('alt') || `Hot Video ${videoCode}`,
                        videoCode: videoCode,
                        url: href.startsWith('/') ? `${window.location.origin}${href}` : href,
                        image: img.getAttribute('data-src') || img.getAttribute('src') || ''
                    });
                }
            }
            
            return videos;
        });
    }

    /**
     * Get random video - ULTRA FAST EXTREME OPTIMIZATION
     */
    async getRandomHotVideo() {
        let browser = null;
        try {
            console.log('⚡ Ultra fast video search...');
            browser = await this.createBrowser();
            const page = await browser.newPage();
            
            // Extreme speed settings
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            // Block EVERYTHING except HTML
            await page.setRequestInterception(true);
            page.on('request', req => {
                req.resourceType() === 'document' ? req.continue() : req.abort();
            });
            
            // Try only working URLs
            const urls = this.getNextUrls();
            
            for (const url of urls) {
                try {
                    console.log(`🚀 ${url}`);
                    await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
                    
                    // No wait - immediate extraction
                    const videos = await this.extractVideos(page);
                    
                    if (videos.length > 0) {
                        const selected = videos[Math.floor(Math.random() * videos.length)];
                        
                        // Quick fixes
                        selected.title = `🔥 ${selected.title.substring(0, 80)}`;
                        if (selected.image && !selected.image.startsWith('http')) {
                            selected.image = selected.image.startsWith('//') ? 
                                `https:${selected.image}` : new URL(selected.image, url).href;
                        }
                        
                        console.log(`✅ ${selected.videoCode}`);
                        return selected;
                    }
                    
                } catch (e) {
                    console.log(`❌ ${url.split('/').pop()}`);
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('❌', error.message);
            return null;
        } finally {
            if (browser) await browser.close();
        }
    }
}

module.exports = CrawlerService;
