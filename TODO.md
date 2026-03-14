# Image Editor
This new version of the Image Editor restart basically from scratch, cleaning up what previously developed, with a clear implementation path.

## Development phases

### 1. Foundation [DONE ✅️]
Total rewrite of the project; migration of the bundling; change library in favor of PixiJS.

### 2. Engine [DONE ✅️]
Setup the base React application, the components structure and the artboard with the implementation of the core business logic with PixiJS.

### 3. UI [DONE ✅️]
Apply an appealing user interface, with a toolbar on the top with the tools of the selected elements, a sidebar with an icon bar and a side panel with detailed options; the main area of the UI is the artboard. UI library is ChakraUI and the icons used are react-icons.

### 4. Tools [DONE ✅️]
The application has a selected element and its type determine the tools that can be used.

### 5. Advanced features [DONE ✅️]
History; ...

### 6. Polishing [DONE ✅️]
Some general rearrangements, minor fixes and papercuts to consider the first chunk of implementation complete.
This sets the mark for the first big tranche of development. Following implementation are individual features or major restructuring.

### 7. Save and export [DONE ✅️]
When the image editing is done, it must be saved. It can be exported PNG, while the project itself (editable again) is a JSON file.

### 8. Editing extensions [DONE ✅️]
Some general review of tools and added the Text editing capability and text formatting (color, alignment, bold...).

### 9. Zoom control and resize [DONE ✅️]
Review of the zoom tool and the resize of the elements.

### 10. Toolbar filters and transform fixes [DONE ✅️]
Review of the Filters panel selection and some fixes on the zoom and rotation of elements.

### 11. Export formats [DONE ✅️]
Extended the Save feature with multiple bitmat export formats and a confirmation dialog for more options.

### 12. Extend the library of shapes [DONE ✅️]
Added multiple shapes to the panel (Cloud, Plus, Ring, Rounded rectangle, Half circle...)

### 13. Extend the History [DONE ✅️]
Apply the undo-redo history to all the meaningful actions that can be perfomed by the user and that are not currently covered by the feature. It has to work also with keyboard shortcuts.

### 14. Embeddability and external configuration [TO-DO]
The Image Editor application must be embeddable in other applications, without being affected by expternal styles or scripts. It must run in isolation and must interact with the hosting application with callbacks and action methods.
A configuration object must be defined so the hosting application can pass parameters to customize the editing experience. Config options can be:
- fonts
- color palette
- enable / disable tools or shapes
- pass the initial project or image to start edit
- `onSave` callback
- `onSaveProject` callback

### 15. Fonts management [TO-DO]
Must extend the Text editing experience with the choice of custom web fonts (configurable) and the line-heigh tool.

### 16. Better layers management [TO-DO]
Make the Layers in the panel sortable with drag and drop. Also allow rename of the layers. Consider adding groups of layers for better management.

### 17. Better Draw tool [TO-DO]
Simpler action to start and stop drawing on the artboard (without the need of clicking on a button). Add brush styles

### 18. Colors management [TO-DO]
Change the color picker component library and add the Alpha slider and Transparent color everywhere.

### 19. Crop tool [TO-DO]
Currently the crop tool is visible in the top Toolbar but it's not working.
It should be useful to crop images. Since to a lack of PixiJS capabilities, it's possible that not all the shapes can be cropped.

### 20. Backgrounds [TO-DO]
Allow transparent background for the canvas and add the possibility to choose from a library of image background to be applied to the canvas without inferfering with the editing experience.

### 21. Guides and alignment [TO-DO]
Enhance the editing experience adding advanced visual elements such as rulers to the artboard, guides to visually fix positions, sticky edges and alignment helpers.

### 22. Copy/paste [TO-DO]
Allows to copy and paste images and text elements to the artboard. Vector elements can only be copied internally but are not pasteable elsewhere.