@echo off
REM RISC Zero Guest Program Compilation Script (Windows)
REM This script compiles the minesweeper guest program to RISC-V ELF

setlocal enabledelayedexpansion

echo ==========================================
echo RISC Zero Guest Program Compilation
echo ==========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] cargo not found
    echo Install Rust: https://rustup.rs/
    exit /b 1
)

rustup target list --installed | findstr "riscv32im-risc0-zkvm-elf" >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing RISC-V target...
    rustup target add riscv32im-risc0-zkvm-elf
)

where risczero-zkvm >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing RISC Zero ZKVM...
    cargo install --locked risczero-zkvm
)

echo [OK] All prerequisites installed
echo.

REM Navigate to guest directory
set GUEST_DIR=%~dp0..\guest
cd /d "%GUEST_DIR%"

REM Build the guest program
echo Building guest program...
echo This may take 2-5 minutes...
echo.

cargo build --release

if %errorlevel% equ 0 (
    echo.
    echo [OK] Guest program built successfully!
    echo.
    echo Output: target\riscv32im-risc0-zkvm-elf\release\minesweeper_zk_guest.exe
    echo.

    REM Get the Image ID
    echo Getting Image ID...
    set ELF_PATH=target\riscv32im-risc0-zkvm-elf\release\minesweeper_zk_guest.exe

    if exist "%ELF_PATH%" (
        risczero-zkvm elf-info "%ELF_PATH%" > IMAGE_ID.txt
        set /p IMAGE_ID=<IMAGE_ID.txt
        echo.
        echo Image ID: !IMAGE_ID!
        echo.
        echo Copy this Image ID to:
        echo   - smart-contract\risc-zero\host\src\prove.rs (IMAGE_ID constant)
        echo   - frontend\lib\zk\real-proof.ts (IMAGE_ID constant)
        echo.
        echo Image ID saved to: %CD%\IMAGE_ID.txt
    ) else (
        echo [ERROR] ELF file not found at %ELF_PATH%
        exit /b 1
    )
) else (
    echo.
    echo [ERROR] Build failed
    exit /b 1
)

echo.
echo ==========================================
echo Compilation Complete!
echo ==========================================
echo.

endlocal
