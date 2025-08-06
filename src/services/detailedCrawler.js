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
                                
                                // Check if it's a valid JAV video URL - flexible check
                                if (!href.includes('/vi/') && !href.includes('/en/')) continue;
                                if (href.length < 15) continue; // Too short to be a video URL
                                
                                // Extract video code from URL - flexible extraction
                                let videoCode = 'HOT-VIDEO';
                                const codePatterns = [
                                    /\/(?:vi|en)\/([A-Z]{2,}-?\d{3,})/i,
                                    /\/(?:vi|en)\/(fc2-ppv-\d{6,})/i, 
                                    /\/(?:vi|en)\/([A-Z]{2,}\d{3,})/i,
                                    /\/(?:vi|en)\/(\w+\d+)/i,
                                    /\/(?:vi|en)\/([^\/\?#]+)/i // Fallback: any path segment
                                ];
                                
                                for (const pattern of codePatterns) {
                                    const match = href.match(pattern);
                                    if (match && match[1]) {
                                        videoCode = match[1].toUpperCase().replace(/FC2-PPV-/i, 'FC2-PPV-');
                                        break;
                                    }
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
                                
                                // Additional title extraction from text content and other sources
                                if (!title || title.length < 5) {
                                    const textElements = [
                                        element.querySelector('.text-secondary'),
                                        element.querySelector('.title'),
                                        element.querySelector('h3'),
                                        element.querySelector('.video-title'),
                                        element.querySelector('p'),
                                        element.parentElement?.querySelector('.text-secondary'),
                                        element.parentElement?.querySelector('.title')
                                    ];
                                    
                                    for (const textElement of textElements) {
                                        if (textElement && textElement.textContent.trim().length > 5) {
                                            title = textElement.textContent.trim();
                                            break;
                                        }
                                    }
                                }
                                
                                // Try to extract title from nearby elements
                                if (!title || title.length < 5) {
                                    const siblings = element.parentElement?.children || [];
                                    for (const sibling of siblings) {
                                        const text = sibling.textContent?.trim();
                                        if (text && text.length > 10 && !text.includes('http') && !text.match(/^\d+$/)) {
                                            title = text;
                                            break;
                                        }
                                    }
                                }

                                // Use video code as fallback if no proper title found
                                if (!title || title.length < 3) {
                                    title = videoCode;
                                } else if (title === videoCode) {
                                    // If title is just the code, try to make it more descriptive
                                    title = `${videoCode} - Hot JAV Video`;
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
                        
                        // Try to get more detailed info from the video page
                        let detailedInfo = { title: null, image: null };
                        try {
                            detailedInfo = await this.getVideoDetails(page, selected.url);
                        } catch (detailError) {
                            console.log('❌ Could not get detailed info, using basic info');
                        }
                        
                        // Create a better title
                        let finalTitle = selected.title;
                        if (detailedInfo.title && detailedInfo.title.length > 10 && 
                            !detailedInfo.title.includes('missav') && 
                            detailedInfo.title !== selected.videoCode) {
                            finalTitle = detailedInfo.title;
                        } else if (finalTitle === selected.videoCode || finalTitle.length < 10) {
                            // Create a more descriptive title
                            finalTitle = `${selected.videoCode} - Hot JAV Video`;
                        }
                        
                        // Enhance the selected video info
                        const enhancedVideo = {
                            title: finalTitle,
                            videoCode: selected.videoCode,
                            url: selected.url,
                            image: detailedInfo.image || selected.image,
                            fullTitle: finalTitle.includes(selected.videoCode) ? finalTitle : `${finalTitle} (${selected.videoCode})`
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
     * Get detailed information from video page
     */
    async getVideoDetails(page, videoUrl) {
        try {
            console.log('📖 Getting detailed info from video page...');
            
            // Go to the video page
            await page.goto(videoUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });
            
            // Wait a bit for content to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Extract detailed information
            const details = await page.evaluate(() => {
                let title = '';
                let image = '';
                
                // Try multiple selectors for title - more specific ones first
                const titleSelectors = [
                    '.video-meta h1',
                    '.video-info h1', 
                    '.content h1',
                    '[class*="video"] h1',
                    'h1.title',
                    '.video-title',
                    '.main-title',
                    'h1:not([class*="site"]):not([class*="logo"])',
                    'h2:not([class*="site"]):not([class*="logo"])'
                ];
                
                for (const selector of titleSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim().length > 5) {
                        const text = element.textContent.trim();
                        // Skip if it's just the site name or too generic
                        if (!text.includes('missav') && !text.includes('MissAV') && 
                            text.length > 10 && !text.match(/^[\d\s]+$/)) {
                            title = text;
                            break;
                        }
                    }
                }
                
                // If no good title found, try meta description
                if (!title) {
                    const metaDesc = document.querySelector('meta[name="description"]');
                    if (metaDesc) {
                        const desc = metaDesc.getAttribute('content');
                        if (desc && desc.length > 20 && !desc.includes('missav')) {
                            title = desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
                        }
                    }
                }
                
                // Try to get a better quality image
                const imageSelectors = [
                    '.video-poster img',
                    '.poster img',
                    '.video-thumbnail img',
                    'meta[property="og:image"]',
                    'img[src*="covers"]',
                    'img[src*="poster"]'
                ];
                
                for (const selector of imageSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        if (element.tagName === 'META') {
                            image = element.getAttribute('content');
                        } else {
                            image = element.getAttribute('src') || 
                                   element.getAttribute('data-src') ||
                                   element.getAttribute('data-original');
                        }
                        if (image) break;
                    }
                }
                
                return { title, image };
            });
            
            console.log(`📖 Detailed title: ${details.title || 'Not found'}`);
            return details;
            
        } catch (error) {
            console.log('❌ Could not get detailed info:', error.message);
            return { title: null, image: null };
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
