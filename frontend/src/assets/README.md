# Frontend Assets

This directory contains all the static assets used in the Udaan frontend application.

## Directory Structure

```
src/assets/
├── images/
│   ├── logo.svg              # Main Udaan logo (service hub design)
│   └── placeholder-internship.svg  # Placeholder for internship images
├── icons/
│   └── user-avatar.svg       # User profile avatar icon
├── backgrounds/
│   └── hero-bg.svg          # Hero section background
└── README.md                # This file
```

## Asset Usage

### Logo
- **File**: `images/logo.svg`
- **Usage**: Displayed in the AppBar next to the "Udaan" title
- **Also used as**: Browser favicon
- **Design**: Service hub with connected nodes representing the platform's matching capabilities

### Favicon
- **File**: `images/logo.svg`
- **Usage**: Browser tab icon
- **Implementation**: Referenced in `index.html`

### Placeholder Images
- **File**: `images/placeholder-internship.svg`
- **Usage**: Default image for internship cards when no company image is available
- **Design**: Simple building icon with decorative elements

### Icons
- **File**: `icons/user-avatar.svg`
- **Usage**: User profile pictures, company logos
- **Design**: Simple person icon in brand colors

### Backgrounds
- **File**: `backgrounds/hero-bg.svg`
- **Usage**: Hero section background on welcome page
- **Design**: Gradient with decorative dots and abstract shapes

## Adding New Assets

1. **Images**: Add to `images/` directory
2. **Icons**: Add to `icons/` directory
3. **Backgrounds**: Add to `backgrounds/` directory
4. **Update this README** with new asset information

## File Formats

- **SVG**: Preferred for scalability and small file size
- **PNG**: Use for complex images that can't be represented as SVG
- **Avoid**: JPG (not suitable for UI elements)

## Color Palette

- **Primary Orange**: #EF7C1B
- **Secondary Orange**: #F97316
- **Accent Purple**: #8B5CF6
- **Background**: #FEF3C7, #FED7AA, #FDBA74

## Optimization

- Keep SVG files clean and optimized
- Use consistent naming conventions
- Include alt text for accessibility
- Test assets across different screen sizes
