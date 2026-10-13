const { WinFormsSession, Form, Panel, FlowLayoutPanel, PictureBox, Button, Label, FolderBrowserDialog, Font } = require('../node-windows-forms');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Starting gallery...");
    const app = new WinFormsSession();
    await app.start();

    const form = new Form(app, 'Form1');
    await form.setText("Gallery");
    await form.setSize(1000, 700);

    // Sidebar for thumbnails
    const sidebar = new FlowLayoutPanel(app, form);
    await sidebar.setLocation(10, 50);
    await sidebar.setSize(200, 600);
    await sidebar.setProperty('AutoScroll', true);
    await sidebar.setBackColor(240, 240, 240);
    // Anchor to Top, Bottom, Left so it stretches vertically
    await sidebar.setProperty('Anchor', 'Top, Bottom, Left');

    // Main viewing area
    const mainPic = new PictureBox(app, form);
    await mainPic.setLocation(220, 50);
    await mainPic.setSize(750, 600);
    await mainPic.setProperty('SizeMode', 'Zoom');
    await mainPic.setProperty('BorderStyle', 1); // FixedSingle
    // Anchor to all sides so it resizes with the window
    await mainPic.setProperty('Anchor', 'Top, Bottom, Left, Right');

    // Button to open folder
    const btnOpen = new Button(app, form);
    await btnOpen.setText("Open Folder...");
    await btnOpen.setLocation(10, 10);
    await btnOpen.setSize(200, 35);

    // Label for info
    const infoLabel = new Label(app, form);
    await infoLabel.setText("Select a folder containing images");
    await infoLabel.setLocation(220, 15);
    await infoLabel.setSize(750, 25);
    await infoLabel.setProperty('Anchor', 'Top, Left, Right'); // Stretch horizontally
    await infoLabel.setProperty('Font', new Font('Segoe UI', 14, 'Bold'));

    // State
    let thumbnails = [];

    btnOpen.on('Click', async () => {
        const result = await FolderBrowserDialog.show(app, {
            description: "Select a folder with images",
            showNewFolderButton: false
        });
        
        if (result && typeof result === 'string') {
            await infoLabel.setText(`Loading images from: ${result}...`);
            loadImages(result);
        }
    });

    async function loadImages(folderPath) {
        try {
            // Read all files in the directory
            const files = fs.readdirSync(folderPath);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
            
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext);
            });

            if (imageFiles.length === 0) {
                await infoLabel.setText("No images found in the selected folder.");
                return;
            }

            await infoLabel.setText(`Found ${imageFiles.length} images. Generating thumbnails...`);

            // Clear old thumbnails
            for (const thumb of thumbnails) {
                await thumb.dispose();
            }
            thumbnails = [];


            for (let i = 0; i < imageFiles.length; i++) {
                const imgPath = path.join(folderPath, imageFiles[i]);
                
                const thumb = new PictureBox(app, sidebar);
                // FlowLayoutPanel will auto-arrange these
                await thumb.setSize(160, 120);
                await thumb.setProperty('SizeMode', 'Zoom');
                await thumb.setProperty('Cursor', 'Hand');
                await thumb.setProperty('Margin', { left: 10, top: 10, right: 10, bottom: 10 });
                await thumb.setProperty('ImageLocation', imgPath); // Native Windows Forms fast loading
                
                thumb.on('Click', async () => {
                    await mainPic.setProperty('ImageLocation', imgPath);
                    await infoLabel.setText(`Viewing: ${imageFiles[i]}`);
                });

                thumbnails.push(thumb);
                
                // Show first image automatically
                if (i === 0) {
                    await mainPic.setProperty('ImageLocation', imgPath);
                    await infoLabel.setText(`Viewing: ${imageFiles[i]}`);
                }
            }
            
            await infoLabel.setText(`Loaded ${imageFiles.length} images. Click thumbnails to view.`);

        } catch (err) {
            console.error("Error loading images:", err);
            await infoLabel.setText(`Error: ${err.message}`);
        }
    }

    form.on('Closed', () => {
        console.log("Form closed.");
        process.exit(0);
    });

    await form.show();
}

main().catch(console.error);
