# 🤝 Contributing to TweetAbles

Thank you for your interest in contributing to TweetAbles! We welcome contributions from the community and are excited to see what you'll bring to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Issue Guidelines](#issue-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [@prematrkurtcuk](https://x.com/prematrkurtcuk).

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or higher
- Chrome/Chromium browser
- Git
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extensions (helpful)
- Familiarity with Web3/blockchain concepts (helpful)

### Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tweetables.git
   cd tweetables
   ```

3. **Set up upstream remote**
   ```bash
   git remote add upstream https://github.com/zacnider/tweetables.git
   ```

4. **Load extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

## 🛠️ Development Setup

### Project Structure
```
tweetables/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Twitter page integration
├── popup.html/js/css     # Extension popup
├── images/               # Assets
└── website/              # Landing page
```

### Key Files to Know
- `manifest.json` - Extension permissions and configuration
- `content.js` - Injects mint buttons into Twitter
- `popup.js` - Main wallet functionality
- `background.js` - Handles extension lifecycle

## 🔄 How to Contribute

### Types of Contributions

1. **🐛 Bug Fixes**
   - Fix existing issues
   - Improve error handling
   - Performance optimizations

2. **✨ New Features**
   - New wallet features
   - UI/UX improvements
   - Blockchain integrations

3. **📚 Documentation**
   - Code comments
   - README improvements
   - User guides

4. **🧪 Testing**
   - Unit tests
   - Integration tests
   - Manual testing

### Before You Start

1. **Check existing issues** - Look for related issues or discussions
2. **Create an issue** - Describe what you want to work on
3. **Get feedback** - Discuss your approach with maintainers
4. **Start coding** - Begin implementation

## 📝 Pull Request Process

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number
```

### 2. Make Changes
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly

### 3. Commit Changes
```bash
git add .
git commit -m "feat: add new minting feature"
# or
git commit -m "fix: resolve transaction timeout issue"
```

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 4. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Reference related issues
- Screenshots (if UI changes)
- Testing instructions

### 5. Review Process
- Maintainers will review your PR
- Address feedback promptly
- Make requested changes
- PR will be merged once approved

## 🎨 Coding Standards

### JavaScript
```javascript
// Use const/let instead of var
const walletAddress = '0x...';
let balance = 0;

// Use arrow functions for callbacks
const handleClick = () => {
    // Implementation
};

// Use async/await instead of promises
const fetchBalance = async () => {
    try {
        const balance = await wallet.getBalance();
        return balance;
    } catch (error) {
        console.error('Failed to fetch balance:', error);
    }
};
```

### CSS
```css
/* Use BEM naming convention */
.wallet-card {}
.wallet-card__header {}
.wallet-card__header--active {}

/* Use CSS custom properties */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
}
```

### HTML
```html
<!-- Use semantic HTML -->
<main class="wallet-container">
    <section class="balance-section">
        <h2>Your Balance</h2>
        <!-- Content -->
    </section>
</main>
```

## 🧪 Testing

### Manual Testing
1. Load extension in Chrome
2. Test on Twitter.com
3. Verify wallet functionality
4. Check different screen sizes
5. Test error scenarios

### Testing Checklist
- [ ] Extension loads without errors
- [ ] Mint buttons appear on tweets
- [ ] Wallet operations work correctly
- [ ] UI is responsive
- [ ] No console errors
- [ ] Permissions are minimal

## 🐛 Issue Guidelines

### Reporting Bugs

**Use the bug report template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome 91]
- Extension Version: [e.g. 1.0.0]
```

### Feature Requests

**Use the feature request template:**
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Additional context**
Any other context about the feature request.
```

## 🏷️ Labels

We use labels to categorize issues and PRs:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority
- `priority: low` - Low priority

## 🎯 Areas for Contribution

### High Priority
- [ ] Chrome Web Store preparation
- [ ] Performance optimizations
- [ ] Error handling improvements
- [ ] Mobile browser support

### Medium Priority
- [ ] UI/UX enhancements
- [ ] Additional blockchain networks
- [ ] Advanced NFT features
- [ ] Accessibility improvements

### Low Priority
- [ ] Code refactoring
- [ ] Documentation improvements
- [ ] Testing infrastructure
- [ ] Developer tools

## 💬 Communication

- **GitHub Issues** - Bug reports and feature requests
- **Twitter** - [@prematrkurtcuk](https://x.com/prematrkurtcuk) - General questions
- **Pull Requests** - Code discussions

## 🎉 Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Given credit in the extension

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [Monad Documentation](https://docs.monad.xyz/)
- [Web3 Development Guide](https://ethereum.org/en/developers/)

---

Thank you for contributing to TweetAbles! 🚀