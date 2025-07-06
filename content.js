// Tweetables - Twitter Content Script (Wallet Integration)
class TweetablesMinter {
    constructor() {
        this.isActive = false;
        this.walletExists = false;
        this.mintButtons = new Map();
        this.processedTweets = new Set();
        this.globalProcessedTweets = new Set(); // Global tweet tracking
        
        this.init();
    }

    async init() {
        // Check if wallet exists and minting mode is active
        const result = await chrome.storage.local.get(['wallet', 'mintingMode']);
        this.walletExists = result.wallet !== null && result.wallet !== undefined;
        
        // Extension yüklüyse ve wallet varsa otomatik olarak mint mode aktif et
        if (this.walletExists) {
            this.isActive = true;
            await chrome.storage.local.set({ mintingMode: true });
            this.startMinting();
        } else {
            this.isActive = result.mintingMode || false;
            if (this.isActive && this.walletExists) {
                this.startMinting();
            }
        }

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.mintingMode) {
                this.isActive = changes.mintingMode.newValue;
                if (this.isActive && this.walletExists) {
                    this.startMinting();
                } else {
                    this.stopMinting();
                }
            }
            if (changes.wallet) {
                this.walletExists = changes.wallet.newValue !== null && changes.wallet.newValue !== undefined;
                if (!this.walletExists) {
                    this.stopMinting();
                }
            }
        });

        // Listen for URL changes (Twitter SPA navigation)
        let currentUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                if (this.isActive && this.walletExists) {
                    setTimeout(() => this.scanForTweets(), 1000);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    startMinting() {
        console.log('Tweetables: Minting mode activated');
        this.showMintingNotification();
        this.scanForTweets();
        
        // Set up periodic scanning for new tweets
        this.scanInterval = setInterval(() => {
            this.scanForTweets();
        }, 2000);
    }

    stopMinting() {
        console.log('Tweetables: Minting mode deactivated');
        this.removeMintButtons();
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        chrome.storage.local.set({ mintingMode: false });
    }

    showMintingNotification() {
        const notification = document.createElement('div');
        notification.id = 'tweetables-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                max-width: 320px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${chrome.runtime.getURL('images/logo.png')}" style="width: 24px; height: 24px; border-radius: 4px;">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Tweetables Minting Active</div>
                        <div style="font-size: 12px; opacity: 0.9;">Click the mint button on any tweet to create an NFT with your Tweetables wallet!</div>
                    </div>
                    <button class="tweetables-notification-close" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        margin-left: auto;
                    ">&times;</button>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Close button event listener
        const closeBtn = notification.querySelector('.tweetables-notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    async scanForTweets() {
        // Look for tweet articles (Twitter's structure)
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        
        console.log(`Scanning ${tweets.length} tweets...`);
        
        for (const tweet of tweets) {
            const tweetId = this.extractTweetId(tweet);
            if (tweetId) {
                // Skip if already globally processed
                if (this.globalProcessedTweets.has(tweetId)) {
                    continue;
                }
                
                // Skip if already has mint button
                if (tweet.querySelector('.tweetables-mint-btn') || 
                    tweet.hasAttribute('data-tweetables-processed')) {
                    continue;
                }
                
                console.log(`Adding mint button for tweet: ${tweetId}`);
                await this.addMintButton(tweet, tweetId);
                this.processedTweets.add(tweetId);
            }
        }
    }

    extractTweetId(tweetElement) {
        // Try to extract tweet ID from various possible locations
        const timeElement = tweetElement.querySelector('time');
        if (timeElement && timeElement.parentElement) {
            const href = timeElement.parentElement.getAttribute('href');
            if (href) {
                const match = href.match(/\/status\/(\d+)/);
                return match ? match[1] : null;
            }
        }
        
        // Alternative method: look for tweet ID in data attributes or other elements
        const links = tweetElement.querySelectorAll('a[href*="/status/"]');
        for (const link of links) {
            const match = link.href.match(/\/status\/(\d+)/);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }

    async addMintButton(tweetElement, tweetId) {
        // Global duplicate check first
        if (this.globalProcessedTweets.has(tweetId)) {
            console.log('Tweet already globally processed:', tweetId);
            return;
        }

        // Find the action bar (like, retweet, share buttons)
        const actionBar = tweetElement.querySelector('[role="group"]');
        if (!actionBar) return;

        // Remove any existing mint buttons in this action bar first
        const existingButtons = actionBar.querySelectorAll('.tweetables-mint-btn, [data-tweetables-mint]');
        existingButtons.forEach(btn => btn.remove());

        // Comprehensive duplicate check
        if (this.mintButtons.has(tweetId) || 
            document.querySelector(`#tweetables-mint-${tweetId}`) ||
            document.querySelector(`[data-tweetables-mint="${tweetId}"]`) ||
            tweetElement.hasAttribute('data-tweetables-processed')) {
            console.log('Mint button already exists for tweet:', tweetId);
            return;
        }

        // Mark tweet as processed globally and locally
        this.globalProcessedTweets.add(tweetId);
        tweetElement.setAttribute('data-tweetables-processed', 'true');
        
        // Check if this tweet is already minted
        const existingNFTs = await this.getExistingNFTs();
        const isAlreadyMinted = existingNFTs.some(nft => nft.tweetId === tweetId);

        // Create mint button with unique ID
        const mintButton = document.createElement('div');
        mintButton.className = 'tweetables-mint-btn';
        mintButton.setAttribute('data-tweetables-mint', tweetId);
        mintButton.id = `tweetables-mint-${tweetId}`;
        
        console.log(`Creating mint button for tweet ${tweetId}`);
        
        const buttonInner = document.createElement('div');
        buttonInner.className = 'tweetables-mint-btn-inner';
        buttonInner.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-left: 12px;
            user-select: none;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        `;
        
        const mintIcon = document.createElement('img');
        mintIcon.src = chrome.runtime.getURL('images/mint.png');
        mintIcon.style.cssText = 'width: 16px; height: 16px;';
        
        const mintText = document.createElement('span');
        
        if (isAlreadyMinted) {
            // Already minted - show different style
            mintText.textContent = 'Minted ✓';
            buttonInner.style.background = '#10b981'; // Green color
            buttonInner.style.cursor = 'default';
            buttonInner.style.opacity = '0.8';
            
            // No hover effects for minted tweets
            mintButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showNotification('You have already minted this tweet!', '#f59e0b');
            });
        } else {
            // Not minted yet - normal behavior
            mintText.textContent = 'Mint NFT';
            
            // Hover effects
            buttonInner.addEventListener('mouseenter', () => {
                buttonInner.style.transform = 'scale(1.05)';
                buttonInner.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            });
            
            buttonInner.addEventListener('mouseleave', () => {
                buttonInner.style.transform = 'scale(1)';
                buttonInner.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
            });

            mintButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Immediately try to open popup from user gesture context
                this.openPopupFromUserGesture().then(() => {
                    // Popup opened, now process the mint
                    this.mintTweet(tweetElement, tweetId);
                }).catch(() => {
                    // Popup failed, still process mint (background will handle popup)
                    this.mintTweet(tweetElement, tweetId);
                });
            });
        }
        
        buttonInner.appendChild(mintIcon);
        buttonInner.appendChild(mintText);
        mintButton.appendChild(buttonInner);

        actionBar.appendChild(mintButton);
        this.mintButtons.set(tweetId, mintButton);
    }

    removeMintButtons() {
        // Remove all mint buttons from DOM
        document.querySelectorAll('.tweetables-mint-btn, [data-tweetables-mint]').forEach(button => {
            button.remove();
        });
        
        this.mintButtons.clear();
        this.processedTweets.clear();
        this.globalProcessedTweets.clear();
        
        // Remove processed attributes
        document.querySelectorAll('[data-tweetables-processed]').forEach(element => {
            element.removeAttribute('data-tweetables-processed');
        });
    }

    async mintTweet(tweetElement, tweetId) {
        if (!this.walletExists) {
            this.showError('Please create or import a wallet first in the Tweetables extension');
            return;
        }

        try {
            // Extract tweet data
            const tweetData = this.extractTweetData(tweetElement, tweetId);
            
            // Show minting progress
            this.showMintingProgress(tweetId);
            
            // Check if tweet is already minted by this user
            const existingNFTs = await this.getExistingNFTs();
            if (existingNFTs.some(nft => nft.tweetId === tweetId)) {
                throw new Error('You have already minted this tweet as an NFT');
            }
            
            // Also check if there's a pending mint request for this tweet
            const pendingRequest = await chrome.storage.local.get(['pendingMintRequest']);
            if (pendingRequest.pendingMintRequest && pendingRequest.pendingMintRequest.tweetId === tweetId) {
                throw new Error('This tweet is already being minted. Please wait or check your extension.');
            }
            
            // Upload to Pinata
            const metadata = await this.uploadToPinata(tweetData);
            
            // Send mint request to background to open popup
            const mintResult = await this.sendMintRequest(tweetData, metadata, 0);
            
            // Real mint completed via popup, create NFT object
            const contractAddress = '0x4FAcc2554A70296988e95a91E68dc308A858CeEe';
            
            const nft = {
                id: `${contractAddress}-${mintResult.tokenId}`,
                tokenId: mintResult.tokenId,
                contract: contractAddress,
                
                // Tweet information
                title: `Tweet by @${tweetData.author}`,
                description: tweetData.text || 'A tweet minted as NFT',
                author: tweetData.author,
                authorDisplayName: tweetData.authorDisplayName,
                date: tweetData.timestamp,
                tweetId: tweetData.id,
                tweetUrl: tweetData.url,
                
                // Content
                text: tweetData.text,
                images: tweetData.images || [],
                
                // Engagement metrics
                metrics: tweetData.metrics || {},
                
                // NFT metadata
                image: metadata.metadata.image,
                ipfsHash: metadata.ipfsHash,
                ipfsUrl: metadata.pinataUrl,
                
                // Minting information
                mintFee: 0,
                gasFee: mintResult.gasFee || 0,
                gasUsed: mintResult.gasUsed || 'Unknown',
                transactionHash: mintResult.transactionHash,
                explorerUrl: `https://testnet.monadexplorer.com/tx/${mintResult.transactionHash}`,
                
                // Additional metadata
                mintedAt: new Date().toISOString(),
                platform: 'Twitter',
                mintedWith: 'Tweetables Extension',
                blockchain: 'Monad Testnet',
                
                // Full metadata for reference
                fullMetadata: metadata.metadata
            };
            
            // Notify popup and update storage
            await this.saveNFTToWallet(nft);
            
            this.showSuccess(`Tweet NFT minted successfully! Token ID: ${nft.tokenId}`);
            
            // Update button to show minted state
            this.updateMintButtonToMinted(tweetId);
            
        } catch (error) {
            console.error('Error minting tweet:', error);
            this.showError(error.message || 'Failed to mint NFT. Please try again.');
            this.resetMintButton(tweetId);
        }
    }

    extractTweetData(tweetElement, tweetId) {
        console.log('=== EXTRACTING DETAILED TWEET DATA ===');
        
        // Extract tweet text - daha kapsamlı
        let text = '';
        
        // Önce tweetText elementini dene
        const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
        if (textElement) {
            text = textElement.innerText || textElement.textContent || '';
            console.log('Tweet text from tweetText:', text);
        }
        
        // Eğer text boşsa, alternatif yöntemler dene
        if (!text) {
            // Tweet container'ın içindeki tüm text'i al
            const tweetContainer = tweetElement.querySelector('[data-testid="tweetText"]')?.parentElement?.parentElement;
            if (tweetContainer) {
                // Sadece text node'ları al, link ve mention'ları dahil et
                const walker = document.createTreeWalker(
                    tweetContainer,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            // Boş text'leri ve sadece whitespace olanları atla
                            if (node.textContent.trim() === '') return NodeFilter.FILTER_REJECT;
                            // Author name ve timestamp'leri atla
                            const parent = node.parentElement;
                            if (parent && (
                                parent.getAttribute('data-testid') === 'User-Name' ||
                                parent.tagName === 'TIME' ||
                                parent.closest('[data-testid="User-Name"]') ||
                                parent.closest('time')
                            )) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );
                
                const textParts = [];
                let node;
                while (node = walker.nextNode()) {
                    const textContent = node.textContent.trim();
                    if (textContent && !textParts.includes(textContent)) {
                        textParts.push(textContent);
                    }
                }
                text = textParts.join(' ').trim();
                console.log('Tweet text from tree walker:', text);
            }
        }
        
        // Son çare: tweet element'inin tüm text'ini al ve temizle
        if (!text) {
            const allText = tweetElement.innerText || tweetElement.textContent || '';
            // Author name, timestamp ve diğer metadata'ları temizle
            const lines = allText.split('\n').filter(line => {
                const trimmed = line.trim();
                return trimmed && 
                       !trimmed.match(/^@\w+$/) && // @username
                       !trimmed.match(/^\d+[hms]$/) && // 1h, 2m, 3s
                       !trimmed.match(/^·$/) && // separator
                       !trimmed.includes('Replying to') &&
                       !trimmed.includes('Show this thread') &&
                       !trimmed.includes('Quote Tweet') &&
                       !trimmed.match(/^\d+$/) && // pure numbers
                       trimmed.length > 2; // very short strings
            });
            text = lines.join(' ').trim();
            console.log('Tweet text from fallback method:', text);
        }

        // Extract author information - daha detaylı
        const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
        let author = 'unknown';
        let authorDisplayName = '';
        
        if (authorElement) {
            const authorText = authorElement.textContent;
            console.log('Author element text:', authorText);
            
            // @username'i çıkar
            const usernameMatch = authorText.match(/@(\w+)/);
            author = usernameMatch ? usernameMatch[1] : 'unknown';
            
            // Display name'i çıkar (@ işaretinden önceki kısım)
            const displayNameMatch = authorText.split('@')[0];
            authorDisplayName = displayNameMatch ? displayNameMatch.trim() : author;
            
            console.log('Author username:', author);
            console.log('Author display name:', authorDisplayName);
        }

        // Extract timestamp
        const timeElement = tweetElement.querySelector('time');
        const timestamp = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();
        console.log('Tweet timestamp:', timestamp);

        // Extract images - daha kapsamlı
        const images = [];
        
        // Tweet içindeki tüm görselleri bul
        const imageElements = tweetElement.querySelectorAll('img[src*="pbs.twimg.com"]');
        imageElements.forEach(img => {
            if (img.src && 
                !img.src.includes('profile_images') && 
                !img.src.includes('emoji') &&
                !img.src.includes('hashflag') &&
                !img.src.includes('card_img')) {
                
                // Yüksek kaliteli versiyonu al
                let imageUrl = img.src;
                if (imageUrl.includes('&name=')) {
                    imageUrl = imageUrl.replace(/&name=\w+/, '&name=large');
                } else if (imageUrl.includes('?format=')) {
                    imageUrl = imageUrl.replace(/\?format=\w+&name=\w+/, '?format=jpg&name=large');
                }
                
                images.push(imageUrl);
                console.log('Image found:', imageUrl);
            }
        });

        // Video thumbnail'ları da kontrol et
        const videoElements = tweetElement.querySelectorAll('video');
        videoElements.forEach(video => {
            if (video.poster) {
                images.push(video.poster);
                console.log('Video poster found:', video.poster);
            }
        });

        // Tweet card image'ları da kontrol et
        const cardImages = tweetElement.querySelectorAll('[data-testid="card.layoutLarge.media"] img, [data-testid="card.layoutSmall.media"] img');
        cardImages.forEach(img => {
            if (img.src && !images.includes(img.src)) {
                images.push(img.src);
                console.log('Card image found:', img.src);
            }
        });

        // Extract additional metadata
        const retweetCount = this.extractMetric(tweetElement, '[data-testid="retweet"]');
        const likeCount = this.extractMetric(tweetElement, '[data-testid="like"]');
        const replyCount = this.extractMetric(tweetElement, '[data-testid="reply"]');

        const tweetData = {
            id: tweetId,
            text: text,
            author: author,
            authorDisplayName: authorDisplayName,
            timestamp: timestamp,
            images: images,
            url: `https://twitter.com/i/status/${tweetId}`,
            metrics: {
                retweets: retweetCount,
                likes: likeCount,
                replies: replyCount
            },
            extractedAt: new Date().toISOString()
        };

        console.log('=== COMPLETE TWEET DATA EXTRACTED ===');
        console.log('Tweet ID:', tweetData.id);
        console.log('Author:', tweetData.author);
        console.log('Display Name:', tweetData.authorDisplayName);
        console.log('Text length:', tweetData.text.length);
        console.log('Images count:', tweetData.images.length);
        console.log('Full data:', tweetData);

        return tweetData;
    }

    extractMetric(tweetElement, selector) {
        try {
            const element = tweetElement.querySelector(selector);
            if (element) {
                const text = element.textContent || '';
                const match = text.match(/(\d+(?:\.\d+)?[KMB]?)/);
                return match ? match[1] : '0';
            }
        } catch (error) {
            console.warn('Error extracting metric:', error);
        }
        return '0';
    }

    async getExistingNFTs() {
        try {
            const result = await chrome.storage.local.get(['nfts']);
            return result.nfts || [];
        } catch (error) {
            console.error('Error getting existing NFTs:', error);
            return [];
        }
    }

    async uploadToPinata(tweetData) {
        const pinataApiKey = 'abe9ed1b60b22a251ef7';
        const pinataSecretKey = '773cde9d54e0402f8eb87b478ba0c0b19abe2dc67464e162a92a2212cafe6d86';

        console.log('=== UPLOADING COMPREHENSIVE TWEET DATA TO PINATA ===');
        console.log('Tweet data for IPFS:', tweetData);

        // Create comprehensive metadata object
        const metadata = {
            name: `Tweet by @${tweetData.author} (${tweetData.authorDisplayName || tweetData.author})`,
            description: tweetData.text || 'A tweet minted as NFT on Tweetables',
            image: tweetData.images && tweetData.images.length > 0 
                ? tweetData.images[0] 
                : `https://via.placeholder.com/400x400/667eea/white?text=@${tweetData.author}`,
            
            // Standard NFT attributes
            attributes: [
                {
                    trait_type: "Author Username",
                    value: tweetData.author
                },
                {
                    trait_type: "Author Display Name", 
                    value: tweetData.authorDisplayName || tweetData.author
                },
                {
                    trait_type: "Tweet ID",
                    value: tweetData.id
                },
                {
                    trait_type: "Tweet Date",
                    value: new Date(tweetData.timestamp).toLocaleDateString()
                },
                {
                    trait_type: "Tweet Time",
                    value: new Date(tweetData.timestamp).toLocaleTimeString()
                },
                {
                    trait_type: "Character Count",
                    value: tweetData.text ? tweetData.text.length.toString() : "0"
                },
                {
                    trait_type: "Image Count",
                    value: tweetData.images ? tweetData.images.length.toString() : "0"
                },
                {
                    trait_type: "Platform",
                    value: "Twitter"
                },
                {
                    trait_type: "Minted With",
                    value: "Tweetables Extension"
                },
                {
                    trait_type: "Blockchain",
                    value: "Monad Testnet"
                }
            ],
            
            // Add engagement metrics if available
            ...(tweetData.metrics && Object.keys(tweetData.metrics).length > 0 && {
                engagement_metrics: {
                    retweets: tweetData.metrics.retweets || "0",
                    likes: tweetData.metrics.likes || "0", 
                    replies: tweetData.metrics.replies || "0"
                }
            }),
            
            external_url: tweetData.url,
            
            // Comprehensive tweet data
            tweet_data: {
                id: tweetData.id,
                text: tweetData.text,
                author: tweetData.author,
                authorDisplayName: tweetData.authorDisplayName,
                timestamp: tweetData.timestamp,
                url: tweetData.url,
                images: tweetData.images || [],
                metrics: tweetData.metrics || {},
                extractedAt: tweetData.extractedAt,
                platform: "Twitter"
            },
            
            // Additional media information
            ...(tweetData.images && tweetData.images.length > 0 && {
                media: {
                    type: "images",
                    count: tweetData.images.length,
                    urls: tweetData.images
                }
            }),
            
            // Minting information
            minting_info: {
                contract: "0x4FAcc2554A70296988e95a91E68dc308A858CeEe",
                network: "Monad Testnet",
                minted_at: new Date().toISOString(),
                version: "1.0"
            }
        };

        // Add engagement metrics as attributes if available
        if (tweetData.metrics) {
            if (tweetData.metrics.retweets && tweetData.metrics.retweets !== "0") {
                metadata.attributes.push({
                    trait_type: "Retweets",
                    value: tweetData.metrics.retweets
                });
            }
            if (tweetData.metrics.likes && tweetData.metrics.likes !== "0") {
                metadata.attributes.push({
                    trait_type: "Likes", 
                    value: tweetData.metrics.likes
                });
            }
            if (tweetData.metrics.replies && tweetData.metrics.replies !== "0") {
                metadata.attributes.push({
                    trait_type: "Replies",
                    value: tweetData.metrics.replies
                });
            }
        }

        console.log('Complete metadata for IPFS:', metadata);

        try {
            console.log('Uploading to Pinata...');
            
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretKey
                },
                body: JSON.stringify({
                    pinataContent: metadata,
                    pinataMetadata: {
                        name: `tweetables-${tweetData.id}-${Date.now()}.json`,
                        keyvalues: {
                            author: tweetData.author,
                            tweetId: tweetData.id,
                            platform: "twitter",
                            mintedWith: "tweetables"
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Pinata error response:', errorText);
                throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            console.log('✅ Successfully uploaded to Pinata!');
            console.log('IPFS Hash:', result.IpfsHash);
            console.log('Pinata URL:', `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
            
            return {
                ipfsHash: result.IpfsHash,
                metadata: metadata,
                pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
            };
            
        } catch (error) {
            console.error('❌ Pinata upload error:', error);
            throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
        }
    }

    async sendMintRequest(tweetData, metadata, mintFee) {
        return new Promise((resolve, reject) => {
            console.log('=== SENDING COMPREHENSIVE MINT REQUEST ===');
            console.log('Tweet Data:', tweetData);
            console.log('Metadata:', metadata);
            console.log('Mint Fee:', mintFee);
            
            // Extension background'a kapsamlı mint request gönder
            chrome.runtime.sendMessage({
                action: 'mintNFTRequest',
                data: {
                    // Basic tweet info
                    tweetId: tweetData.id,
                    tweetUrl: tweetData.url,
                    author: tweetData.author,
                    authorDisplayName: tweetData.authorDisplayName,
                    text: tweetData.text,
                    timestamp: tweetData.timestamp,
                    
                    // Media content
                    images: tweetData.images || [],
                    
                    // Engagement metrics
                    metrics: tweetData.metrics || {},
                    
                    // IPFS and contract info
                    ipfsHash: metadata.ipfsHash,
                    metadata: metadata.metadata,
                    mintFee: mintFee,
                    contractAddress: '0x4FAcc2554A70296988e95a91E68dc308A858CeEe',
                    
                    // Additional metadata
                    extractedAt: tweetData.extractedAt,
                    platform: 'Twitter',
                    mintedWith: 'Tweetables Extension'
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    reject(new Error('Failed to communicate with wallet'));
                    return;
                }
                
                console.log('Mint request response:', response);
                
                if (response && response.success) {
                    if (response.transactionHash) {
                        // Real mint completed
                        console.log('✅ Mint request successful!');
                        console.log('Transaction Hash:', response.transactionHash);
                        console.log('Token ID:', response.tokenId);
                        resolve(response);
                    } else if (response.message) {
                        // Mint request stored, wait for completion
                        console.log('✅ Mint request stored:', response.message);
                        
                        // Wait for mint completion by listening to storage changes
                        const waitForCompletion = async () => {
                            return new Promise((resolveWait, rejectWait) => {
                                const checkCompletion = async () => {
                                    const result = await chrome.storage.local.get(['pendingMintRequest', 'lastMintResult']);
                                    
                                    // If pending request is cleared and we have a result
                                    if (!result.pendingMintRequest && result.lastMintResult) {
                                        const mintResult = result.lastMintResult;
                                        
                                        // Clear the result
                                        await chrome.storage.local.remove(['lastMintResult']);
                                        
                                        if (mintResult.success) {
                                            resolveWait(mintResult);
                                        } else {
                                            rejectWait(new Error(mintResult.error || 'Mint failed'));
                                        }
                                        return;
                                    }
                                    
                                    // Check again after a short delay
                                    setTimeout(checkCompletion, 1000);
                                };
                                
                                // Start checking
                                setTimeout(checkCompletion, 1000);
                                
                                // Timeout after 5 minutes
                                setTimeout(() => {
                                    rejectWait(new Error('Mint timeout - popup may have been closed'));
                                }, 300000);
                            });
                        };
                        
                        waitForCompletion().then(resolve).catch(reject);
                    } else {
                        resolve(response);
                    }
                } else {
                    console.error('❌ Mint request failed:', response?.error);
                    reject(new Error(response?.error || 'Mint request failed'));
                }
            });
            
            // Timeout after 60 seconds (increased for real transactions)
            setTimeout(() => {
                console.error('❌ Mint request timeout after 60 seconds');
                reject(new Error('Mint request timeout - transaction may still be processing'));
            }, 60000);
        });
    }

    async saveNFTToWallet(nft) {
        try {
            // Get current wallet state
            const result = await chrome.storage.local.get(['nfts', 'activities', 'balance']);
            const nfts = result.nfts || [];
            const activities = result.activities || [];
            const balance = result.balance || 0;
            
            // Add NFT
            nfts.unshift(nft);
            
            // Add activity
            activities.unshift({
                type: 'NFT Mint',
                amount: -nft.mintFee,
                address: nft.contract,
                timestamp: new Date().toISOString(),
                status: 'completed',
                details: `Minted tweet by @${nft.author}`,
                hash: nft.transactionHash
            });
            
            // Update balance
            const newBalance = balance - nft.mintFee;
            
            // Save to storage
            await chrome.storage.local.set({
                nfts: nfts,
                activities: activities,
                balance: newBalance
            });
            
            // Notify popup if it's open
            chrome.runtime.sendMessage({
                action: 'nftMinted',
                nft: nft
            }).catch(() => {
                // Popup might not be open, that's okay
            });
            
        } catch (error) {
            console.error('Error saving NFT to wallet:', error);
            throw new Error('Failed to save NFT to wallet');
        }
    }

    showMintingProgress(tweetId) {
        const button = this.mintButtons.get(tweetId);
        if (button) {
            const buttonContent = button.querySelector('div');
            buttonContent.innerHTML = `
                <div style="
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <span>Minting...</span>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            buttonContent.style.pointerEvents = 'none';
            buttonContent.style.opacity = '0.8';
        }
    }

    resetMintButton(tweetId) {
        const button = this.mintButtons.get(tweetId);
        if (button) {
            const buttonContent = button.querySelector('div');
            buttonContent.innerHTML = `
                <img src="${chrome.runtime.getURL('images/mint.png')}" style="width: 16px; height: 16px;">
                <span>Mint NFT</span>
            `;
            buttonContent.style.pointerEvents = 'auto';
            buttonContent.style.opacity = '1';
        }
    }

    updateMintButtonToMinted(tweetId) {
        const button = this.mintButtons.get(tweetId);
        if (button) {
            const buttonContent = button.querySelector('div');
            buttonContent.innerHTML = `
                <img src="${chrome.runtime.getURL('images/mint.png')}" style="width: 16px; height: 16px;">
                <span>Minted ✓</span>
            `;
            buttonContent.style.background = '#10b981'; // Green color
            buttonContent.style.cursor = 'default';
            buttonContent.style.opacity = '0.8';
            buttonContent.style.pointerEvents = 'auto';
            
            // Remove old event listeners and add new one
            const newButton = buttonContent.cloneNode(true);
            buttonContent.parentNode.replaceChild(newButton, buttonContent);
            
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showNotification('You have already minted this tweet!', '#f59e0b');
            });
        }
    }

    showSuccess(message) {
        this.showNotification(message, '#10b981');
    }

    showError(message) {
        this.showNotification(message, '#ef4444');
    }

    async openPopupFromUserGesture() {
        return new Promise((resolve, reject) => {
            console.log('🎯 Content script: Attempting to open popup from user gesture...');
            
            chrome.runtime.sendMessage({ 
                action: 'openPopupFromUserGesture',
                timestamp: Date.now()
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Content script: Runtime error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                if (response && response.success) {
                    console.log('✅ Content script: Popup opened successfully');
                    resolve(response);
                } else {
                    console.log('❌ Content script: Popup opening failed');
                    reject(new Error(response?.error || 'Popup opening failed'));
                }
            });
            
            // Timeout after 3 seconds
            setTimeout(() => {
                reject(new Error('Popup opening timeout'));
            }, 3000);
        });
    }

    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 350px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <img src="${chrome.runtime.getURL('images/logo.png')}" style="width: 20px; height: 20px; border-radius: 4px; margin-top: 2px;">
                <div style="flex: 1;">${message}</div>
                <button class="tweetables-notification-close" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Close button event listener
        const closeBtn = notification.querySelector('.tweetables-notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TweetablesMinter();
    });
} else {
    new TweetablesMinter();
}

// Make it globally accessible
window.tweetablesMinter = new TweetablesMinter();