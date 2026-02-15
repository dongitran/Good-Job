# UI Prototypes

This folder contains HTML prototypes for the UI designs.

## Structure

```
prototypes/
├── html-to-jpg.js           # Script to convert HTML to JPG
├── README.md                # This file
└── 00-landing-page/         # Landing page prototype
    ├── index.html
    ├── hero-characters.png
    ├── how-it-works.png
    └── 00-landing-page.jpg  # Generated screenshot
```

## Converting HTML to JPG

### Prerequisites

Install dependencies (first time only):

```bash
cd designs/ui/prototypes
npm run setup
```

Or manually:

```bash
npm install
npx playwright install chromium
```

### Usage

From the `prototypes` folder:

```bash
# Convert using default output (same folder as HTML)
node html-to-jpg.js 00-landing-page/index.html

# Specify custom output path
node html-to-jpg.js 00-landing-page/index.html ../images/00-landing-page.jpg
```

### Features

- **High quality**: 1920x1080 viewport with 2x pixel density (Retina)
- **Full page**: Captures entire page, not just viewport
- **JPEG quality**: 95/100
- **Auto-wait**: Waits 5 seconds for animations and lazy-loaded content

## Creating New Prototypes

1. Create a new folder (e.g., `01-dashboard`)
2. Add your `index.html` and assets
3. Run the converter:
   ```bash
   node html-to-jpg.js 01-dashboard/index.html
   ```
4. JPG will be saved as `01-dashboard/01-dashboard.jpg`
