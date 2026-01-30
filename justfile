# River - Double-Blind Salary Negotiation Platform
# Justfile for common development tasks

# Default recipe - show help
default:
    @just --list

# Install all dependencies
install:
    ./scripts/setup.sh

# Compile the Noir circuit
compile:
    ./scripts/compile.sh

# Deploy verifier to Solana Devnet
deploy:
    ./scripts/deploy.sh

# Generate a proof with test values
prove employer_max="100000" candidate_min="80000":
    ./scripts/prove.sh {{employer_max}} {{candidate_min}}

# Run circuit tests
test:
    cd circuits/salary_match && nargo test

# Start the frontend dev server
dev:
    cd frontend && npm run dev

# Build the frontend for production
build:
    cd frontend && npm run build

# Preview production build
preview:
    cd frontend && npm run preview

# Copy compiled circuit to frontend
copy-circuit:
    mkdir -p frontend/public/circuit
    cp circuits/salary_match/target/salary_match.json frontend/public/circuit/

# Full build: compile circuit and build frontend
full-build: compile copy-circuit build

# Clean all generated files
clean:
    rm -rf circuits/salary_match/target
    rm -rf circuits/salary_match/artifacts
    rm -rf circuits/salary_match/output
    rm -rf frontend/dist
    rm -rf frontend/node_modules
    rm -f program_id.txt

# Check all prerequisites
check:
    @echo "Checking prerequisites..."
    @which node > /dev/null && echo "✓ Node.js: $(node -v)" || echo "✗ Node.js not found"
    @which npm > /dev/null && echo "✓ npm: $(npm -v)" || echo "✗ npm not found"
    @which nargo > /dev/null && echo "✓ nargo: $(nargo --version)" || echo "✗ nargo not found"
    @which solana > /dev/null && echo "✓ Solana CLI: $(solana --version)" || echo "✗ Solana CLI not found"
    @which sunspot > /dev/null && echo "✓ sunspot installed" || echo "✗ sunspot not found"
    @which go > /dev/null && echo "✓ Go: $(go version)" || echo "✗ Go not found"

# Configure Solana for devnet
configure-devnet:
    solana config set --url devnet
    @echo "Solana configured for devnet"

# Airdrop SOL to deployer wallet
airdrop:
    @if [ -f keypair/deployer.json ]; then \
        solana airdrop 2 $(solana address -k keypair/deployer.json) --url devnet; \
    else \
        echo "No deployer keypair found. Run 'just deploy' first."; \
    fi
