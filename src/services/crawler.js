/**
 * MissAV Video Crawler Service
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const CONFIG = require('../config/constants');

class MissAVCrawler {
    constructor() {
        this.baseUrl = 'https://missav.ws';
    }

    /**
     * Lấy phim hot random từ MissAV
     */
    async getRandomHotVideo() {
        try {
            console.log('🔥 Đang lấy phim hot random từ MissAV...');
            
            let html = '';
            let selectedUrl = '';
            
            // Thử từng URL cho đến khi thành công
            for (const url of CONFIG.MISSAV_URLS) {
                try {
                    console.log(`🔍 Đang thử: ${url}`);
                    const res = await fetch(url, {
                        headers: CONFIG.HEADERS,
                        timeout: CONFIG.REQUEST_TIMEOUT
                    });
                    
                    if (res.ok) {
                        html = await res.text();
                        selectedUrl = url;
                        console.log(`✅ Thành công với: ${url}`);
                        break;
                    }
                } catch (urlErr) {
                    console.log(`❌ Lỗi với ${url}: ${urlErr.message}`);
                    continue;
                }
            }
            
            if (!html) {
                throw new Error('Không thể truy cập bất kỳ URL nào');
            }
            
            return this.parseVideoFromHtml(html);
            
        } catch (err) {
            console.error('❌ Lỗi khi lấy MissAV:', err.message);
            return await this.getFallbackVideo();
        }
    }

    /**
     * Parse video từ HTML
     */
    parseVideoFromHtml(html) {
        const $ = cheerio.load(html);
        let allVideos = [];
        
        // Lấy tất cả video từ các selector
        for (const selector of CONFIG.VIDEO_SELECTORS) {
            const videos = $(selector);
            console.log(`🔍 Selector "${selector}": ${videos.length} videos`);
            
            videos.each((i, element) => {
                const $el = $(element);
                let href = $el.attr('href');
                
                // Chỉ lấy link có dạng phim thực tế
                if (href && this.isValidVideoLink(href)) {
                    allVideos.push($el);
                }
            });
            
            if (allVideos.length >= 20) break; // Đủ rồi thì dừng
        }
        
        console.log(`🎬 Tìm thấy ${allVideos.length} video`);
        
        if (allVideos.length === 0) {
            throw new Error('Không tìm thấy video nào');
        }
        
        return this.selectRandomVideo(allVideos);
    }

    /**
     * Kiểm tra link video có hợp lệ không
     */
    isValidVideoLink(href) {
        if (!href) return false;
        
        // Kiểm tra các pattern cho missav.ws/dm18/vi
        const patterns = [
            /\/dm18\/vi\/[^\/]+/, // /dm18/vi/something
            /[A-Z]{2,}-?\d{3,}/, // ABCD-123 hoặc AB123
            /\d{6}_\d{3}/, // 123456_789
            /\/\d+\//  // /12345/
        ];
        
        return patterns.some(pattern => pattern.test(href)) && href.includes('/dm18/vi/');
    }

    /**
     * Chọn random video từ danh sách
     */
    selectRandomVideo(allVideos) {
        const randomIndex = Math.floor(Math.random() * allVideos.length);
        const selectedVideo = allVideos[randomIndex];
        
        // Lấy thông tin video
        let href = selectedVideo.attr('href');
        const url = this.normalizeUrl(href);
        const title = this.extractTitle(selectedVideo, href);
        const image = this.extractImage(selectedVideo);

        console.log(`🎯 Selected video ${randomIndex + 1}/${allVideos.length}`);
        console.log(`✅ Title: ${title}`);
        console.log(`🔗 URL: ${url}`);
        console.log(`🖼️ Image: ${image || 'No image'}`);
        
        return { 
            title: `🔥 ${title}`,
            url, 
            image 
        };
    }

    /**
     * Chuẩn hóa URL
     */
    normalizeUrl(href) {
        if (!href) return this.baseUrl;
        
        if (href.startsWith('http')) {
            return href;
        } else if (href.startsWith('//')) {
            return `https:${href}`;
        } else {
            return `${this.baseUrl}${href}`;
        }
    }

    /**
     * Trích xuất title từ element hoặc URL
     */
    extractTitle(element, href) {
        // Thử lấy title từ nhiều nguồn
        let title = element.find('.text-secondary').text().trim() || 
                   element.find('img').attr('alt') || 
                   element.find('img').attr('title') ||
                   element.attr('title') ||
                   element.find('.title').text().trim() ||
                   element.find('h3').text().trim() ||
                   '';
        
        // Nếu không có title, extract từ URL
        if (!title && href) {
            const codeMatch = href.match(/([A-Z]{2,}-?\d{3,}|\d{6}_\d{3})/);
            title = codeMatch ? codeMatch[1] : 'JAV Video';
        }
        
        return title || 'Hot JAV Video';
    }

    /**
     * Trích xuất image từ element
     */
    extractImage(element) {
        const imgElement = element.find('img').first();
        let image = imgElement.attr('data-src') || 
                    imgElement.attr('src') || 
                    imgElement.attr('data-original') ||
                    imgElement.attr('data-lazy-src') ||
                    imgElement.attr('data-srcset');

        if (image) {
            image = this.normalizeUrl(image);
        }

        return image;
    }

    /**
     * Lấy video fallback khi gặp lỗi
     */
    async getFallbackVideo() {
        try {
            console.log('🔄 Thử fallback...');
            const res = await fetch(this.baseUrl + '/dm18/vi', {
                headers: CONFIG.HEADERS,
                timeout: 10000
            });
            
            if (!res.ok) throw new Error('Fallback failed');
            
            const html = await res.text();
            const $ = cheerio.load(html);
            
            const firstLink = $('a[href*="/dm18/vi/"]').first();
            if (firstLink.length) {
                const href = firstLink.attr('href');
                const url = this.normalizeUrl(href);
                const img = firstLink.find('img');
                const title = img.attr('alt') || img.attr('title') || 'JAV Video';
                
                return {
                    title: `🆘 ${title}`,
                    url,
                    image: this.normalizeUrl(img.attr('data-src') || img.attr('src'))
                };
            }
        } catch (fallbackErr) {
            console.error('❌ Fallback cũng lỗi:', fallbackErr.message);
        }
        
        return null;
    }
}

module.exports = new MissAVCrawler();
