#!/bin/bash

# RISC Zero Guest Program Compilation Script
# This script compiles the minesweeper guest program to RISC-V ELF

set -e

echo "=========================================="
echo "RISC Zero Guest Program Compilation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo not found${NC}"
    echo "Install Rust: https://rustup.rs/"
    exit 1
fi

if ! rustup target list --installed | grep -q "riscv32im-risc0-zkvm-elf"; then
    echo -e "${YELLOW}Installing RISC-V target...${NC}"
    rustup target add riscv32im-risc0-zkvm-elf
fi

if ! command -v risczero-zkvm &> /dev/null; then
    echo -e "${YELLOW}Installing RISC Zero ZKVM...${NC}"
    cargo install --locked risczero-zkvm
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Navigate to guest directory
GUEST_DIR="$(dirname "$0")/../guest"
cd "$GUEST_DIR"

# Build the guest program
echo -e "${YELLOW}Building guest program...${NC}"
echo "This may take 2-5 minutes..."
echo ""

cargo build --release

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Guest program built successfully!${NC}"
    echo ""
    echo "Output: target/riscv32im-risc0-zkvm-elf/release/minesweeper_zk_guest"
    echo ""

    # Get the Image ID
    echo -e "${YELLOW}Getting Image ID...${NC}"
    ELF_PATH="target/riscv32im-risc0-zkvm-elf/release/minesweeper_zk_guest"

    if [ -f "$ELF_PATH" ]; then
        IMAGE_ID=$(risczero-zkvm elf-info "$ELF_PATH" | head -n 1)
        echo ""
        echo -e "${GREEN}Image ID: $IMAGE_ID${NC}"
        echo ""
        echo "Copy this Image ID to:"
        echo "  - smart-contract/risc-zero/host/src/prove.rs (IMAGE_ID constant)"
        echo "  - frontend/lib/zk/real-proof.ts (IMAGE_ID constant)"
        echo ""

        # Save to file for reference
        echo "$IMAGE_ID" > IMAGE_ID.txt
        echo "Image ID saved to: $(pwd)/IMAGE_ID.txt"
    else
        echo -e "${RED}Error: ELF file not found at $ELF_PATH${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Compilation Complete!${NC}"
echo "=========================================="
