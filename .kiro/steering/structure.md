# Project Structure

## Root Directory Layout
```
/
├── .kiro/                    # Kiro configuration and steering files
├── index.html               # Main HTML page
├── grok.css                 # Primary stylesheet
├── index.js                 # JavaScript functionality
└── [image-files]            # Product and UI images
```

## HTML Structure Conventions
- **Semantic sections**: Use descriptive class names like `fir_po` (first portion), `sec_po` (second portion)
- **Section comments**: Each major section has start/end comments for clarity
- **Responsive images**: All images include width attributes and alt text
- **Grid layouts**: Product cards use CSS Grid for consistent spacing

## CSS Organization
- **Mobile-first approach**: Base styles followed by progressive enhancement
- **Responsive breakpoints**: 1024px, 768px, 480px for different device sizes
- **Component-based styling**: Each section has dedicated class prefixes
- **Hover effects**: Consistent transform and transition patterns

## JavaScript Architecture
- **Event-driven**: Uses DOMContentLoaded for initialization
- **Modular functions**: Separate functions for cart, countdown, payment
- **Error handling**: Console logging for debugging missing elements
- **Responsive considerations**: Dynamic styling for mobile devices

## Naming Conventions
- **CSS Classes**: Abbreviated but descriptive (e.g., `fi_po_t` for first portion text)
- **JavaScript Functions**: camelCase with descriptive names
- **IDs**: Used sparingly, mainly for dynamic content targeting
- **Image Files**: Descriptive names with spaces (consider kebab-case for web)