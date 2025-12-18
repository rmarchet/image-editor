# Image Editor

A simple, web-based image editor built with React, TypeScript, and Fabric.js. Edit images directly in your browser with a clean, intuitive interface.

## Features

- 🖼️ **Image Upload**: Drag and drop or click to upload images
- ✂️ **Crop Tool**: Crop images to your desired dimensions
- 🔄 **Resize Tool**: Adjust image dimensions
- 🔃 **Rotate Tool**: Rotate images to any angle
- 🪞 **Mirror Tool**: Flip images horizontally or vertically
- 🎨 **Paint Tool**: Draw and paint on images
- 📝 **Text Tool**: Add text overlays to images
- 🎭 **Effects**: Apply various image effects (grayscale, sepia, invert, etc.)
- ↩️ **Undo/Redo**: Full history management for all edits
- 💾 **Save**: Download edited images as PNG files
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Fabric.js** - Canvas manipulation
- **Styled Components** - Component styling
- **Rollup** - Module bundler
- **React Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rmarchet/image-editor.git
cd image-editor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will open in your browser at `http://localhost:8888`

### Build for Production

```bash
npm run build
# or
yarn build
```

The production build will be in the `dist/` directory.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run clean` - Clean the dist directory
- `npm run start` - Clean and start development server
- `npm run type-check` - Run TypeScript type checking
 

## Usage

1. **Upload an Image**: Click the "Upload New" button or drag and drop an image onto the canvas
2. **Select a Tool**: Click on any tool in the toolbar (Resize, Crop, Rotate, Mirror, Paint, Text, Effects)
3. **Edit Your Image**: Use the tool controls to make your edits
4. **Undo/Redo**: Use the undo/redo buttons to navigate through your edit history
5. **Save**: Click the "Save" button to download your edited image
6. **Reset**: Click "Cancel" to reset and start over

## Features in Detail

### History Management
The editor maintains a complete history of all changes, allowing you to undo and redo any action. The history is managed automatically and persists across tool changes.

### Local Storage
Your work is automatically saved to browser local storage, so you can continue editing even after refreshing the page.

### Canvas Manipulation
All image editing is performed using Fabric.js, providing smooth interactions and high-quality rendering.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and not licensed for public use.

## Author

Roberto Marchetti

---

Built with ❤️ using React and Fabric.js

