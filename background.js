// Tweetables Background Script - Wallet Integration

// Service worker'da ethers.js yükleme
self.addEventListener('install', () => {
    console.log('Service worker installing...');
});

class TweetablesBackground {
    constructor() {
        this.init();
    }

    init() {
        // Listen for extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onInstall();
            } else if (details.reason === 'update') {
                this.onUpdate();
            }
        });

        // Listen for messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Listen for tab updates to manage minting mode
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.isTwitterUrl(tab.url)) {
                this.checkMintingMode(tabId);
            }
        });

        // Listen for notification clicks
        chrome.notifications.onClicked.addListener((notificationId) => {
            this.handleNotificationClick(notificationId);
        });

        // Set up periodic tasks
        this.setupPeriodicTasks();
    }

    onInstall() {
        console.log('Tweetables extension installed');
        
        // Initialize default storage
        chrome.storage.local.set({
            wallet: null,
            balance: 0,
            nfts: [],
            activities: [],
            leaderboard: [],
            mintingMode: false,
            settings: {
                autoMint: false,
                notifications: true,
                theme: 'default',
                currency: 'MON'
            }
        });

        // Show welcome notification
        this.showWelcomeNotification();
    }

    onUpdate() {
        console.log('Tweetables extension updated');
        // Handle any migration logic here if needed
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'nftMinted':
                    await this.handleNFTMinted(request.nft);
                    sendResponse({ success: true });
                    break;

                case 'updateBalance':
                    const balance = await this.updateWalletBalance(request.address);
                    sendResponse({ balance });
                    break;

                case 'getLeaderboard':
                    const leaderboard = await this.fetchLeaderboard();
                    sendResponse({ leaderboard });
                    break;

                case 'uploadToPinata':
                    const result = await this.uploadToPinata(request.data);
                    sendResponse(result);
                    break;

                case 'sendTransaction':
                    const txResult = await this.sendTransaction(request.transaction);
                    sendResponse(txResult);
                    break;

                case 'toggleMintingMode':
                    await this.toggleMintingMode(request.enabled);
                    sendResponse({ success: true });
                    break;

                case 'getWalletInfo':
                    const walletInfo = await this.getWalletInfo();
                    sendResponse(walletInfo);
                    break;

                case 'fetchTokenPortfolio':
                    const tokenResult = await this.fetchTokenPortfolio(request.address);
                    sendResponse(tokenResult);
                    break;

                case 'mintNFTRequest':
                    // Enhanced popup opening with user gesture detection
                    try {
                        console.log('🚀 Processing mint request with enhanced strategies...');
                        
                        // Store mint data for popup to access
                        await chrome.storage.local.set({ 
                            pendingMintRequest: request.data,
                            pendingMintTimestamp: Date.now()
                        });
                        
                        let popupOpened = false;
                        
                        // Strategy 1: Try to inject script into sender tab for user gesture context
                        if (sender && sender.tab && sender.tab.id) {
                            try {
                                console.log('🎯 Strategy 1: Injecting popup opener script into tab', sender.tab.id);
                                
                                await chrome.scripting.executeScript({
                                    target: { tabId: sender.tab.id },
                                    func: () => {
                                        // This runs in the content script context with user gesture
                                        chrome.runtime.sendMessage({ 
                                            action: 'openPopupFromUserGesture',
                                            timestamp: Date.now()
                                        });
                                    }
                                });
                                
                                // Wait a bit for the popup to open
                                await new Promise(resolve => setTimeout(resolve, 500));
                                
                                console.log('✅ Strategy 1: User gesture script injected');
                                popupOpened = true;
                                
                            } catch (injectionError) {
                                console.log('❌ Strategy 1 failed:', injectionError.message);
                            }
                        }
                        
                        // Strategy 2: Direct popup opening (fallback)
                        if (!popupOpened) {
                            try {
                                await chrome.action.openPopup();
                                console.log('✅ Strategy 2: Direct popup opened successfully');
                                chrome.action.setBadgeText({ text: '' });
                                popupOpened = true;
                            } catch (popupError) {
                                console.log('❌ Strategy 2 failed:', popupError.message);
                            }
                        }
                        
                        // Strategy 3: Create new window popup
                        if (!popupOpened) {
                            try {
                                const popupWindow = await chrome.windows.create({
                                    url: chrome.runtime.getURL('popup.html'),
                                    type: 'popup',
                                    width: 400,
                                    height: 600,
                                    focused: true,
                                    left: Math.round((screen.width - 400) / 2),
                                    top: Math.round((screen.height - 600) / 2)
                                });
                                console.log('✅ Strategy 3: Window popup created successfully', popupWindow.id);
                                chrome.action.setBadgeText({ text: '' });
                                popupOpened = true;
                            } catch (windowError) {
                                console.log('❌ Strategy 3 failed:', windowError.message);
                            }
                        }
                        
                        // Strategy 4: Create new tab
                        if (!popupOpened) {
                            try {
                                const popupTab = await chrome.tabs.create({
                                    url: chrome.runtime.getURL('popup.html'),
                                    active: true
                                });
                                console.log('✅ Strategy 4: Tab popup created successfully', popupTab.id);
                                chrome.action.setBadgeText({ text: '' });
                                popupOpened = true;
                            } catch (tabError) {
                                console.log('❌ Strategy 4 failed:', tabError.message);
                            }
                        }
                        
                        // Strategy 5: Notification + Badge (final fallback)
                        if (!popupOpened) {
                            console.log('⚠️ All popup strategies failed, using notification method');
                            
                            // Show notification
                            chrome.notifications.create('mint-ready', {
                                type: 'basic',
                                iconUrl: 'images/logo.png',
                                title: 'Tweetables - Mint Ready! 🚀',
                                message: 'Click the Tweetables extension icon to complete your NFT mint!',
                                buttons: [
                                    { title: 'Open Mint' },
                                    { title: 'Cancel' }
                                ]
                            });
                            
                            // Set badge to indicate pending mint
                            chrome.action.setBadgeText({ text: '🔥' });
                            chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
                            
                            // Auto-blink badge for attention
                            this.blinkBadge();
                        }
                        
                        sendResponse({ 
                            success: true, 
                            popupOpened: popupOpened,
                            message: popupOpened ? 'Popup opened for mint confirmation' : 'Mint request stored. Please click the extension icon to complete.' 
                        });
                        
                    } catch (error) {
                        console.error('❌ Error processing mint request:', error);
                        sendResponse({ 
                            success: false, 
                            error: `Failed to process mint request: ${error.message}` 
                        });
                    }
                    break;

                case 'openPopupFromUserGesture':
                    // Handle popup opening from user gesture context
                    try {
                        console.log('🎯 Attempting popup open from user gesture context...');
                        await chrome.action.openPopup();
                        console.log('✅ Popup opened successfully from user gesture');
                        chrome.action.setBadgeText({ text: '' });
                        sendResponse({ success: true });
                    } catch (error) {
                        console.log('❌ User gesture popup failed:', error.message);
                        
                        // Fallback to window creation
                        try {
                            const popupWindow = await chrome.windows.create({
                                url: chrome.runtime.getURL('popup.html'),
                                type: 'popup',
                                width: 400,
                                height: 600,
                                focused: true,
                                left: Math.round((screen.width - 400) / 2),
                                top: Math.round((screen.height - 600) / 2)
                            });
                            console.log('✅ Fallback window popup created:', popupWindow.id);
                            chrome.action.setBadgeText({ text: '' });
                            sendResponse({ success: true, method: 'window' });
                        } catch (windowError) {
                            console.log('❌ Window fallback also failed:', windowError.message);
                            sendResponse({ success: false, error: error.message });
                        }
                    }
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ error: error.message });
        }
    }

    isTwitterUrl(url) {
        return url && (url.includes('twitter.com') || url.includes('x.com'));
    }

    async checkMintingMode(tabId) {
        const result = await chrome.storage.local.get(['mintingMode', 'wallet']);
        if (result.mintingMode && result.wallet) {
            // Ensure content script is active
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                        // Trigger minting mode if content script is ready
                        if (window.tweetablesMinter) {
                            window.tweetablesMinter.startMinting();
                        }
                    }
                });
            } catch (error) {
                console.log('Content script not ready yet');
            }
        }
    }

    async handleNFTMinted(nft) {
        // Update leaderboard
        await this.updateLeaderboard(nft.author);

        // Show notification if enabled
        const settings = await chrome.storage.local.get(['settings']);
        if (settings.settings?.notifications !== false) {
            this.showNotification(
                'NFT Minted Successfully!',
                `Tweet by @${nft.author} has been minted as NFT #${nft.tokenId}`,
                'images/logo.png'
            );
        }
    }

    async updateWalletBalance(address) {
        if (!address) return 0;

        try {
            console.log('=== BACKGROUND: UPDATING BALANCE FROM MONAD TESTNET ===');
            console.log('Address:', address);
            
            // Multiple RPC endpoints - always use default
            const rpcUrls = [
                'https://testnet-rpc.monad.xyz',
                'https://monad-testnet.drpc.org'
            ];
            
            let lastError = null;
            
            for (const rpcUrl of rpcUrls) {
                try {
                    console.log(`🔄 Background trying RPC: ${rpcUrl}`);
                    
                    const response = await fetch(rpcUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getBalance',
                            params: [address, 'latest'],
                            id: 1
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    if (data.error) {
                        throw new Error(`RPC Error: ${data.error.message}`);
                    }
                    
                    if (data.result) {
                        // Convert from wei to MON
                        const balanceWei = BigInt(data.result);
                        const balanceMON = Number(balanceWei) / Math.pow(10, 18);
                        
                        console.log('✅ Background balance fetched:', balanceMON, 'MON from', rpcUrl);
                        
                        // Update storage
                        await chrome.storage.local.set({ balance: balanceMON });
                        
                        return balanceMON;
                    } else {
                        throw new Error('No balance result from RPC');
                    }
                } catch (rpcError) {
                    console.warn(`❌ Background RPC ${rpcUrl} failed:`, rpcError.message);
                    lastError = rpcError;
                    continue;
                }
            }
            
            throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message}`);
            
        } catch (error) {
            console.error('❌ Background: Error fetching balance from all RPCs:', error);
            
            // Balance çekilemezse 0 döndür
            const balance = 0;
            await chrome.storage.local.set({ balance });
            return balance;
        }
    }

    async fetchLeaderboard() {
        try {
            // Aggregate from local storage
            const result = await chrome.storage.local.get(['nfts']);
            const nfts = result.nfts || [];

            // Count mints per author
            const authorCounts = {};
            nfts.forEach(nft => {
                authorCounts[nft.author] = (authorCounts[nft.author] || 0) + 1;
            });

            // Convert to leaderboard format and sort
            let leaderboard = Object.entries(authorCounts)
                .map(([username, mintCount]) => ({ username, mintCount }))
                .sort((a, b) => b.mintCount - a.mintCount)
                .slice(0, 10); // Top 10

            // Add some mock data if empty or too few entries
            if (leaderboard.length < 5) {
                const mockData = [
                    { username: 'elonmusk', mintCount: 156 },
                    { username: 'VitalikButerin', mintCount: 89 },
                    { username: 'naval', mintCount: 67 },
                    { username: 'balajis', mintCount: 45 },
                    { username: 'aantonop', mintCount: 34 }
                ];
                
                // Merge with existing data, avoiding duplicates
                const existingUsernames = new Set(leaderboard.map(item => item.username));
                const additionalData = mockData.filter(item => !existingUsernames.has(item.username));
                
                leaderboard = [...leaderboard, ...additionalData].slice(0, 10);
            }

            return leaderboard;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    async updateLeaderboard(author) {
        const leaderboard = await this.fetchLeaderboard();
        await chrome.storage.local.set({ leaderboard });
    }

    async uploadToPinata(data) {
        const pinataApiKey = 'abe9ed1b60b22a251ef7';
        const pinataSecretKey = '773cde9d54e0402f8eb87b478ba0c0b19abe2dc67464e162a92a2212cafe6d86';

        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretKey
                },
                body: JSON.stringify({
                    pinataContent: data.metadata,
                    pinataMetadata: {
                        name: `tweetables-${data.tweetId}.json`
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Pinata upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                ipfsHash: result.IpfsHash,
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
            };
        } catch (error) {
            console.error('Pinata upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendTransaction(transaction) {
        // This would send actual transactions to Monad
        // For now, we'll simulate the process
        
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate transaction
            const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
            
            // Update balance and activities
            const result = await chrome.storage.local.get(['balance', 'activities']);
            const currentBalance = result.balance || 0;
            const activities = result.activities || [];
            
            const newBalance = currentBalance - transaction.amount - 0.001; // Amount + gas fee
            
            activities.unshift({
                type: 'Send',
                amount: -transaction.amount,
                address: transaction.to,
                timestamp: new Date().toISOString(),
                status: 'completed',
                hash: txHash
            });
            
            await chrome.storage.local.set({
                balance: newBalance,
                activities: activities
            });
            
            return {
                success: true,
                transactionHash: txHash,
                blockNumber: blockNumber
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async toggleMintingMode(enabled) {
        await chrome.storage.local.set({ mintingMode: enabled });
        
        // Update all Twitter tabs
        const tabs = await chrome.tabs.query({
            url: ["https://twitter.com/*", "https://x.com/*"]
        });
        
        for (const tab of tabs) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (mintingEnabled) => {
                        if (window.tweetablesMinter) {
                            if (mintingEnabled) {
                                window.tweetablesMinter.startMinting();
                            } else {
                                window.tweetablesMinter.stopMinting();
                            }
                        }
                    },
                    args: [enabled]
                });
            } catch (error) {
                console.log(`Could not update tab ${tab.id}:`, error);
            }
        }
    }

    async getWalletInfo() {
        const result = await chrome.storage.local.get(['wallet', 'balance', 'nfts', 'activities']);
        return {
            wallet: result.wallet,
            balance: result.balance || 0,
            nftCount: (result.nfts || []).length,
            activityCount: (result.activities || []).length
        };
    }

    async fetchTokenPortfolio(address) {
        try {
            console.log('=== BACKGROUND: FETCHING TOKENS FROM BLOCKVISION API WITH API KEY ===');
            console.log('Address:', address);
            
            const apiUrl = `https://api.blockvision.org/v2/monad/account/tokens?address=${address}`;
            console.log('API URL:', apiUrl);
            
            // API key ile istek gönder
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'x-api-key': '2xbBzOCrJRJUElWbwvdZzdwthjn'
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response body:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Token data fetched successfully from BlockVision with API key:', data);
            
            return { success: true, data: data };
            
        } catch (error) {
            console.error('❌ Background: Error fetching tokens from BlockVision:', error);
            return { success: false, error: error.message };
        }
    }

    

    

    setupPeriodicTasks() {
        // Update balances every 30 seconds for wallets
        setInterval(async () => {
            const result = await chrome.storage.local.get(['wallet']);
            if (result.wallet && result.wallet.address) {
                await this.updateWalletBalance(result.wallet.address);
            }
        }, 30000);

        // Update leaderboard every 5 minutes
        setInterval(async () => {
            const leaderboard = await this.fetchLeaderboard();
            await chrome.storage.local.set({ leaderboard });
        }, 300000);

        // Clean up old activities (keep last 100)
        setInterval(async () => {
            const result = await chrome.storage.local.get(['activities']);
            const activities = result.activities || [];
            
            if (activities.length > 100) {
                const trimmedActivities = activities.slice(0, 100);
                await chrome.storage.local.set({ activities: trimmedActivities });
            }
        }, 3600000); // Every hour
    }

    showWelcomeNotification() {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/logo.png',
            title: 'Welcome to Tweetables!',
            message: 'Create your crypto wallet and start minting Twitter tweets as NFTs on Monad Testnet!'
        });
    }

    showNotification(title, message, iconUrl = 'images/logo.png') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: iconUrl,
            title: title,
            message: message
        });
    }

    // Badge blinking for attention
    blinkBadge() {
        let blinkCount = 0;
        const maxBlinks = 10;
        
        const blinkInterval = setInterval(() => {
            if (blinkCount >= maxBlinks) {
                clearInterval(blinkInterval);
                chrome.action.setBadgeText({ text: '🔥' });
                return;
            }
            
            const isVisible = blinkCount % 2 === 0;
            chrome.action.setBadgeText({ text: isVisible ? '🔥' : '' });
            blinkCount++;
        }, 500);
    }

    // Handle notification clicks
    handleNotificationClick(notificationId) {
        // Try to open popup when notification is clicked
        chrome.action.openPopup().catch(() => {
            // If popup fails, try window
            chrome.windows.create({
                url: chrome.runtime.getURL('popup.html'),
                type: 'popup',
                width: 400,
                height: 600,
                focused: true
            }).catch(() => {
                // If window fails, try tab
                chrome.tabs.create({
                    url: chrome.runtime.getURL('popup.html'),
                    active: true
                });
            });
        });
        
        // Clear the notification
        chrome.notifications.clear(notificationId);
    }

    // Enhanced popup opening with user gesture detection
    async openPopupWithUserGesture(tabId) {
        try {
            // Inject a script that will trigger popup opening from content script context
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    // Send message to background to open popup from user gesture context
                    chrome.runtime.sendMessage({ 
                        action: 'openPopupFromUserGesture',
                        timestamp: Date.now()
                    });
                }
            });
            return true;
        } catch (error) {
            console.log('Could not inject popup opener script:', error);
            return false;
        }
    }

    // Utility functions
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatNumber(num, decimals = 4) {
        return parseFloat(num).toFixed(decimals);
    }

    formatCurrency(amount, symbol = 'MON') {
        return `${this.formatNumber(amount)} ${symbol}`;
    }
}

// Initialize background script
new TweetablesBackground();