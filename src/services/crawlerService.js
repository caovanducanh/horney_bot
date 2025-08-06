const puppeteer = require('puppeteer');
const CONFIG = require('../config/constants');

/**
 * Crawler Service for MissAV - Ultra Clean & Smart
 */
class CrawlerService {
    constructor() {
        this.lastRequestTime = 0;
        this.requestDelay = 1000;
        this.lastVideoUrl = null;
        this.urlIndex = 0; // Smart URL rotation
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
     * Extract videos from page (clean & fast)
     */
    async extractVideos(page) {
        return await page.evaluate(() => {
            const videos = [];
            const links = document.querySelectorAll('a[href*="/vi/"]:has(img)');
            
            for (let i = 0; i < Math.min(links.length, 8); i++) {
                const link = links[i];
                const href = link.getAttribute('href');
                
                // Skip invalid URLs
                if (!href || href.includes('/genres') || href.includes('/vip')) continue;
                
                // Get video code
                const codeMatch = href.match(/\/vi\/([A-Z]{2,}-?\d{3,}|fc2-ppv-\d{6,})/i);
                if (!codeMatch) continue;
                
                const videoCode = codeMatch[1].toUpperCase();
                
                // Get title and image
                const img = link.querySelector('img');
                let title = img ? (img.getAttribute('alt') || videoCode) : videoCode;
                let image = img ? (img.getAttribute('data-src') || img.getAttribute('src')) : '';
                
                // Clean title
                if (title.length <= videoCode.length) title = 'Hot JAV Video';
                
                videos.push({
                    title: title.substring(0, 80),
                    videoCode: videoCode,
                    url: href.startsWith('http') ? href : `https://missav.ws${href}`,
                    image: image
                });
            }
            
            return videos;
        });
    }

    /**
     * Get random video - Ultra fast & clean
     */
    async getRandomHotVideo() {
        let browser = null;
        try {
            // Rate limit
            const now = Date.now();
            if (now - this.lastRequestTime < this.requestDelay) {
                await new Promise(resolve => setTimeout(resolve, this.requestDelay - (now - this.lastRequestTime)));
            }
            this.lastRequestTime = Date.now();

            console.log('🔥 Getting random hot video...');
            browser = await this.createBrowser();
            const page = await browser.newPage();
            
            // Ultra fast page settings
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setViewport({ width: 1280, height: 720 });
            
            // Block non-essential resources
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const type = req.resourceType();
                if (type === 'stylesheet' || type === 'font' || type === 'image' || type === 'media') {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            // Try URLs
            const urls = ['https://missav.ws/dm18/vi', 'https://missav.ws/vi'];
            
            for (const url of urls) {
                try {
                    console.log(`🚀 Trying: ${url}`);
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 15000 
                    });
                    
                    // Minimal bypass wait
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const videos = await this.extractVideos(page);
                    
                    if (videos.length > 0) {
                        const selected = videos[Math.floor(Math.random() * videos.length)];
                        
                        // Fix title and image
                        selected.title = `🔥 ${selected.title}`;
                        if (selected.image && !selected.image.startsWith('http')) {
                            selected.image = selected.image.startsWith('//') ? 
                                `https:${selected.image}` : `https://missav.ws${selected.image}`;
                        }
                        
                        console.log(`✅ Found: ${selected.title} (${selected.videoCode})`);
                        return selected;
                    }
                    
                } catch (urlError) {
                    console.log(`❌ URL failed: ${url}`);
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Failed:', error.message);
            return null;
        } finally {
            if (browser) await browser.close();
        }
    }
}

module.exports = CrawlerService;
