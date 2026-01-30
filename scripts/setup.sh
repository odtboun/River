#!/bin/bash
# River - Double-Blind Salary Negotiation Platform
# Setup Script: Installs all required dependencies

set -e

echo "🌊 River - Setup Script"
echo "======================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

echo "Checking dependencies..."
echo ""

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node -v)
    echo "  Version: $NODE_VERSION"
fi

# Check Go (required for Sunspot)
if check_command go; then
    GO_VERSION=$(go version)
    echo "  Version: $GO_VERSION"
fi

# Check Solana CLI
if check_command solana; then
    SOLANA_VERSION=$(solana --version)
    echo "  Version: $SOLANA_VERSION"
fi

# Check nargo (Noir compiler)
if check_command nargo; then
    NARGO_VERSION=$(nargo --version)
    echo "  Version: $NARGO_VERSION"
else
    echo -e "${YELLOW}!${NC} Installing Noir via noirup..."
    curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
    source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true
    noirup -v 1.0.0-beta.13
fi

# Check sunspot
if check_command sunspot; then
    echo -e "${GREEN}✓${NC} sunspot is installed"
else
    echo -e "${YELLOW}!${NC} Sunspot not found. Please install manually:"
    echo "  git clone https://github.com/reilabs/sunspot.git ~/sunspot"
    echo "  cd ~/sunspot/go && go build -o sunspot ."
    echo "  sudo mv sunspot /usr/local/bin/"
    echo "  export GNARK_VERIFIER_BIN=~/sunspot/gnark-solana/crates/verifier-bin"
fi

echo ""
echo "Installing frontend dependencies..."
cd "$(dirname "$0")/../frontend"
npm install

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run './scripts/compile.sh' to compile the circuit"
echo "2. Run './scripts/deploy.sh' to deploy to Solana Devnet"
echo "3. Run 'cd frontend && npm run dev' to start the frontend"
