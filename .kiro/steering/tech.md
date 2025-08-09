# Technology Stack

## Frontend Technologies
- **HTML5**: Semantic markup with responsive meta tags
- **CSS3**: Custom styling with extensive media queries for responsive design
- **Vanilla JavaScript**: Client-side functionality without external frameworks

## Key Libraries & Frameworks
- **Nunito Sans Font**: Primary typography choice for consistent branding
- **CSS Grid & Flexbox**: Layout systems for responsive design
- **CSS Custom Properties**: Used for consistent color schemes and spacing

## File Structure
- `index.html` - Main HTML structure
- `grok.css` - Primary stylesheet with responsive breakpoints
- `index.js` - JavaScript functionality for cart, countdown, and interactions

## Common Development Tasks

### Local Development
```bash
# Serve files locally (use any static server)
python -m http.server 8000
# or
npx serve .
```

### Image Optimization
- All product images use WebP format for optimal performance
- Images include proper alt attributes for accessibility
- Responsive image sizing implemented via CSS

### Browser Testing
Test across multiple breakpoints:
- Desktop: 1024px+
- Tablet: 768px - 1023px  
- Mobile: 480px - 767px
- Small Mobile: <480px

## Performance Considerations
- Minimize HTTP requests
- Optimize image formats (WebP preferred)
- Use CSS transforms for smooth animations
- Implement lazy loading for images when possible