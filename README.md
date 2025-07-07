# 🐦 TweetAbles - Web3 Wallet for Twitter

<div align="center">
  <img src="Tweetables /images/logo.png" alt="TweetAbles Logo" width="128" height="128">
  
  <p><strong>Turn your tweets into NFTs on Monad blockchain</strong></p>
  
  [![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/zacnider/tweetables/releases)
  [![Monad](https://img.shields.io/badge/Powered%20by-Monad-8B5CF6?style=for-the-badge)](https://monad.xyz)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
  [![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg?style=for-the-badge)](https://github.com/zacnider/tweetables/releases)
</div>

## 🌟 Overview

TweetAbles is a revolutionary Chrome extension that brings Web3 functionality directly to Twitter. With TweetAbles, you can:

- 🎨 **Mint tweets as NFTs** with one click
- 💰 **Full wallet functionality** for Monad blockchain
- 🔄 **Token swapping** with built-in DEX integration
- 🖼️ **NFT gallery** to manage your collection
- 🔒 **Secure & private** - keys never leave your device

## 🚀 Features

### Core Functionality
- **Tweet Minting**: Convert any public tweet into an NFT
- **Wallet Management**: Send, receive, and manage MON tokens
- **Token Swapping**: Built-in DEX for token exchanges
- **NFT Gallery**: View and manage your minted tweet collection
- **Multi-format Support**: Standard tweets, threads, quote tweets

### Technical Features
- **Manifest V3**: Latest Chrome extension standard
- **Monad Integration**: Native support for Monad blockchain
- **IPFS Storage**: Decentralized metadata storage
- **Ethers.js**: Robust blockchain interaction
- **Responsive Design**: Works on all screen sizes

## 📦 Installation

### Method 1: ZIP Package (Recommended)

1. Download the latest `Tweetables-Extension.zip` from [Releases](https://github.com/zacnider/tweetables/releases)
2. Extract the ZIP file to a folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the extracted folder

### Method 2: CRX Package

1. Download `Tweetables.crx` from [Releases](https://github.com/zacnider/tweetables/releases)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Drag and drop the CRX file into the page
5. Accept the security warning

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ 
- Chrome/Chromium browser
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/zacnider/tweetables.git
cd tweetables

# Install dependencies (if any)
npm install

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the project folder
```

### Project Structure

```
tweetables/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script for Twitter
├── content.css           # Styles for Twitter integration
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── popup.css             # Popup styles
├── token-styles.css      # Token-specific styles
├── ethers.min.js         # Ethereum library
├── images/               # Extension icons and assets
│   ├── logo.png
│   ├── mint.png
│   └── ...
└── website/              # Landing page
    ├── index.html
    ├── docs.html
    └── ...
```

## 🔧 Configuration

### Network Settings
- **Network**: Monad Testnet
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Chain ID**: `10143`
- **Currency**: `MON`

### Environment Variables
No environment variables required for basic functionality.

## 📖 Usage

### First Time Setup
1. Click the TweetAbles icon in your browser toolbar
2. Choose "Create New Wallet" or "Import Existing"
3. Securely store your seed phrase
4. Set a strong password

### Minting Tweets
1. Navigate to Twitter.com
2. Find a tweet you want to mint
3. Click the 🎨 mint button next to tweet actions
4. Review details and confirm transaction
5. Wait for blockchain confirmation

### Wallet Operations
- **Send**: Transfer MON tokens to other addresses
- **Receive**: Get your wallet address and QR code
- **Swap**: Exchange tokens using built-in DEX
- **Gallery**: View your NFT collection

## 🔒 Security

### Best Practices
- ✅ Private keys are encrypted and stored locally
- ✅ Never share your seed phrase
- ✅ Use strong, unique passwords
- ✅ Verify transaction details before confirming
- ✅ Keep your browser updated

### Security Features
- Local key storage (never transmitted)
- Encrypted wallet data
- Secure transaction signing
- Permission-based access

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint configuration
- Follow existing code patterns
- Add comments for complex logic
- Test thoroughly before submitting

## 📊 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Chrome Web Store publication
- [ ] Enhanced NFT metadata
- [ ] Batch minting support
- [ ] Mobile browser support

### Version 1.2 (Future)
- [ ] Multi-chain support
- [ ] Built-in marketplace
- [ ] Social features
- [ ] Advanced analytics

## 🐛 Troubleshooting

### Common Issues

**Extension not loading**
- Refresh browser page
- Disable and re-enable extension
- Clear browser cache
- Reinstall extension

**Transaction failed**
- Check MON balance for gas fees
- Increase gas price if network congested
- Wait and retry transaction

**Mint button not appearing**
- Refresh Twitter page
- Ensure extension is enabled
- Check if logged into Twitter
- Try different tweet

## 📞 Support

- **Twitter**: [@prematrkurtcuk](https://x.com/prematrkurtcuk)
- **GitHub Issues**: [Report bugs](https://github.com/zacnider/tweetables/issues)
- **Documentation**: [Full docs](https://tweetables.com/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monad](https://monad.xyz) - High-performance blockchain
- [Ethers.js](https://ethers.org) - Ethereum library
- [IPFS](https://ipfs.io) - Decentralized storage
- [Pinata](https://pinata.cloud) - IPFS pinning service

## 📈 Stats

<div align="center">
  <img src="https://img.shields.io/github/stars/zacnider/tweetables?style=social" alt="GitHub stars">
  <img src="https://img.shields.io/github/forks/zacnider/tweetables?style=social" alt="GitHub forks">
  <img src="https://img.shields.io/github/watchers/zacnider/tweetables?style=social" alt="GitHub watchers">
</div>

---

<div align="center">
  <p>Made with ❤️ for the Monad Developers community</p>
  <p>
    <a href="https://tweetables.com">Website</a> •
    <a href="https://tweetables.com/docs">Documentation</a> •
    <a href="https://github.com/zacnider/tweetables/releases">Download</a>
  </p>
</div>
