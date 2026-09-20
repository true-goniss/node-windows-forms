#!/usr/bin/env node
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function applyMetadata(exePath, options) {
    let retries = 10;
    while (retries > 0) {
        try {
            const resedit = require('resedit');
            const data = fs.readFileSync(exePath);
            const exe = resedit.NtExecutable.from(data, { ignoreCert: true });
            const res = resedit.NtExecutableResource.from(exe);

            if (options.FileDescription || options.ProductName) {
                const viList = resedit.Resource.VersionInfo.fromEntries(res.entries);
                const vi = viList.length > 0 ? viList[0] : resedit.Resource.VersionInfo.createEmpty();
                vi.setStringValues({ lang: 1033, codepage: 1200 }, {
                    FileDescription: options.FileDescription || '',
                    ProductName: options.ProductName || ''
                });
                vi.outputToResourceEntries(res.entries);
            }

            if (options.icon) {
                const iconFile = resedit.Data.IconFile.from(fs.readFileSync(options.icon));
                const iconGroups = resedit.Resource.IconGroupEntry.fromEntries(res.entries);
                const targetGroupId = iconGroups.length > 0 ? iconGroups[0].id : 1;
                resedit.Resource.IconGroupEntry.replaceIconsForResource(
                    res.entries,
                    targetGroupId, // Dynamically get the main Icon Group ID (1 for node, 32512 for C#)
                    1033, // English (US)
                    iconFile.icons.map(item => item.data)
                );
            }

            res.outputResource(exe);
            const newExe = exe.generate();
            fs.writeFileSync(exePath, Buffer.from(newExe));
            return;
        } catch (e) {
            if (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES') {
                retries--;
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.warn(`Warning: Failed to update metadata for ${path.basename(exePath)}: ${e.message}`);
                return;
            }
        }
    }
    console.warn(`Warning: Failed to update metadata for ${path.basename(exePath)}: File locked by another process (e.g., Antivirus)`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
node-windows-forms build tool

Usage: nwf-build <entry-script.js> [options]

Options:
  --output, -o    Output executable name (default: <entry-script>.exe)
  --icon, -i      Path to a .ico file to set as the executable icon

Description:
  Compiles a Node.js script into a single native Windows executable (Node.js SEA).
  The resulting executable will bundle the C# UI engine and allows setting a custom process name and icon.

Example:
  npx nwf-build app.js -o MyApp.exe -i assets/logo.ico
`);
    process.exit(0);
}

const entryScript = args[0];
if (entryScript.startsWith('-')) {
    console.error('Error: Please provide the entry script as the first argument.');
    process.exit(1);
}

if (!fs.existsSync(entryScript)) {
    console.error(`Error: Entry script "${entryScript}" not found in current directory.`);
    process.exit(1);
}

let outputExe = path.basename(entryScript, '.js') + '.exe';
const outputIndex = args.findIndex(a => a === '--output' || a === '-o');
if (outputIndex !== -1 && args.length > outputIndex + 1) {
    outputExe = args[outputIndex + 1];
    if (!outputExe.toLowerCase().endsWith('.exe')) {
        outputExe += '.exe';
    }
}

try {
    const outputDir = path.dirname(outputExe);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
} catch (e) {
    console.error(`Error: Failed to create output directory. ${e.message}`);
    process.exit(1);
}

const appBaseName = path.basename(outputExe, '.exe');
const csharpBinName = `${appBaseName}-UI.exe`;
const tempDir = '.nwf-build-temp';

function cleanup() {
    try {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    } catch (e) {
        console.warn(`Warning: Failed to clean up temporary directory "${tempDir}".`);
    }
}

process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
});

async function main() {
    console.log(`Packaging "${entryScript}" into "${outputExe}"...`);

    // Create a temp build directory
    cleanup();
    try {
        fs.mkdirSync(tempDir);
    } catch (e) {
        console.error(`Error: Failed to create temporary directory "${tempDir}". ${e.message}`);
        process.exit(1);
    }

    // Resolve C# GUI executable
    let libBinDir;
    try {
        const libPkgPath = require.resolve('node-windows-forms/package.json');
        libBinDir = path.join(path.dirname(libPkgPath), 'bin');
    } catch (e) {
        libBinDir = path.join(__dirname, '..', 'bin');
    }

    if (!fs.existsSync(libBinDir)) {
        console.error(`Error: Could not locate internal engine binaries at "${libBinDir}". Ensure node-windows-forms is properly installed.`);
        cleanup();
        process.exit(1);
    }

    // Copy files to temp dir and apply icon to the .exe
    let binFiles;
    try {
        binFiles = fs.readdirSync(libBinDir);
    } catch (e) {
        console.error(`Error: Failed to read binaries directory. ${e.message}`);
        cleanup();
        process.exit(1);
    }

    const embeddedFiles = {};

    for (const f of binFiles) {
        const sourcePath = path.join(libBinDir, f);
        let targetName = f;

        if (f.toLowerCase() === 'node-windows-forms.exe') {
            targetName = csharpBinName;
            const csharpWorkingCopy = path.join(tempDir, targetName);

            try {
                fs.copyFileSync(sourcePath, csharpWorkingCopy);
            } catch (e) {
                console.error(`Error: Failed to copy C# binary. ${e.message}`);
                cleanup();
                process.exit(1);
            }

            let iconPathToApply = null;
            const iconIndex = args.findIndex(a => a === '--icon' || a === '-i');
            if (iconIndex !== -1 && args.length > iconIndex + 1) {
                const iconPath = args[iconIndex + 1];
                if (fs.existsSync(iconPath)) {
                    console.log(`Applying icon from "${iconPath}" to UI engine...`);
                    iconPathToApply = iconPath;
                } else {
                    console.warn(`Warning: Icon file "${iconPath}" not found. Skipping icon application.`);
                }
            }

            await applyMetadata(csharpWorkingCopy, {
                FileDescription: appBaseName,
                ProductName: appBaseName,
                icon: iconPathToApply
            });

            try {
                const csharpBinaryBuffer = fs.readFileSync(csharpWorkingCopy);
                const hash = crypto.createHash('sha256').update(csharpBinaryBuffer).digest('hex');
                embeddedFiles[targetName] = { content: csharpBinaryBuffer.toString('base64'), hash };
            } catch (e) {
                console.error(`Error: Failed to read modified C# binary. ${e.message}`);
                cleanup();
                process.exit(1);
            }
        } else {
            try {
                const depBuffer = fs.readFileSync(sourcePath);
                const hash = crypto.createHash('sha256').update(depBuffer).digest('hex');
                embeddedFiles[targetName] = { content: depBuffer.toString('base64'), hash };
            } catch (e) {
                console.error(`Error: Failed to read binary dependency "${f}". ${e.message}`);
                cleanup();
                process.exit(1);
            }
        }
    }

    console.log(`Embedding internal UI engine (${Object.keys(embeddedFiles).length} files)...`);

    // Create a wrapper script that unpacks the binary and runs the user code
    const wrapperScriptPath = path.join(tempDir, 'entry-wrapper.js');
    const wrapperScriptContent = `
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const embeddedFiles = ${JSON.stringify(embeddedFiles)};
const binDir = path.join(os.tmpdir(), 'nwf-bin-${appBaseName}');
if (!fs.existsSync(binDir)) {
    try { fs.mkdirSync(binDir, { recursive: true, mode: 0o700 }); } catch (e) {}
}

for (const [filename, fileData] of Object.entries(embeddedFiles)) {
    const filePath = path.join(binDir, filename);
    let needsWrite = true;
    if (fs.existsSync(filePath)) {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            if (actualHash === fileData.hash) {
                needsWrite = false;
            }
        } catch (e) {}
    }
    if (needsWrite) {
        try { fs.writeFileSync(filePath, Buffer.from(fileData.content, 'base64'), { mode: 0o700 }); } catch (e) {}
    }
}

// Ensure the binary name matches the extracted one
process.env.NWF_BIN_NAME = path.join(binDir, "${csharpBinName}");

// Run user code
require('${path.resolve(entryScript).replace(/\\/g, '\\\\')}');
`;
    try {
        fs.writeFileSync(wrapperScriptPath, wrapperScriptContent);
    } catch (e) {
        console.error(`Error: Failed to write wrapper script. ${e.message}`);
        cleanup();
        process.exit(1);
    }

    // Bundle using esbuild
    console.log(`Analyzing code and validating imports...`);
    const bundlePath = path.join(tempDir, 'bundle.js');
    const esbuildArgs = [
        wrapperScriptPath,
        '--bundle',
        '--platform=node',
        '--keep-names',
        `--outfile=${bundlePath}`
    ];

    let esbuildPath;
    try {
        esbuildPath = require.resolve('esbuild/bin/esbuild');
    } catch (e) {
        console.error('Error: Could not locate esbuild. Please run "npm install".');
        cleanup();
        process.exit(1);
    }
    const esbuildResult = spawnSync(process.execPath, [esbuildPath, ...esbuildArgs], { stdio: 'inherit' });

    if (esbuildResult.error) {
        console.error(`Error: Failed to launch esbuild: ${esbuildResult.error.message}`);
        cleanup();
        process.exit(1);
    }

    if (esbuildResult.status !== 0) {
        console.error('Error: Code compilation failed. Please verify the imports in your script.');
        cleanup();
        process.exit(esbuildResult.status);
    }

    // Generate sea-config.json
    console.log(`Preparing Node.js SEA (Single Executable Application)...`);
    const seaConfigPath = path.join(tempDir, 'sea-config.json');
    const seaConfig = {
        main: path.resolve(bundlePath),
        output: path.resolve(path.join(tempDir, 'sea-prep.blob')),
        disableExperimentalSEAWarning: true
    };
    try {
        fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
    } catch (e) {
        console.error(`Error: Failed to write sea-config.json. ${e.message}`);
        cleanup();
        process.exit(1);
    }

    // Generate sea-prep.blob
    const seaResult = spawnSync(process.execPath, ['--experimental-sea-config', seaConfigPath], { stdio: 'inherit' });
    if (seaResult.status !== 0) {
        console.error('Error: Failed to generate SEA preparation blob.');
        cleanup();
        process.exit(seaResult.status);
    }

    // Copy node executable to outputExe
    try {
        fs.copyFileSync(process.execPath, outputExe);
    } catch (e) {
        console.error(`Error: Failed to copy Node.js executable to "${outputExe}". ${e.message}`);
        if (e.code === 'EBUSY' || e.code === 'EPERM') {
            console.error('Hint: The target file might be running. Please close the application before building.');
        }
        cleanup();
        process.exit(1);
    }

    // Inject sea-prep.blob into outputExe using postject
    console.log(`Injecting code into the native binary...`);
    console.log(`(This step modifies a signed Node.js executable and may take 2-4 minutes on Windows. Please do not close the console...)`);
    const blobPath = path.join(tempDir, 'sea-prep.blob');
    const postjectArgs = [
        outputExe,
        'NODE_SEA_BLOB',
        blobPath,
        '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
        '--macho-segment-name', 'NODE_SEA',
        '--overwrite'
    ];

    let postjectPath;
    try {
        postjectPath = require.resolve('postject/dist/cli.js');
    } catch (e) {
        console.error('Error: Could not locate postject. Please run "npm install".');
        cleanup();
        process.exit(1);
    }
    const postjectResult = spawnSync(process.execPath, [postjectPath, ...postjectArgs], { stdio: 'inherit' });

    if (postjectResult.status !== 0) {
        console.error('Error: Code injection (postject) failed.');
        cleanup();
        process.exit(postjectResult.status);
    }

    // Apply icon and file description to the final wrapper executable
    let finalIconPathToApply = null;
    const finalIconIndex = args.findIndex(a => a === '--icon' || a === '-i');
    if (finalIconIndex !== -1 && args.length > finalIconIndex + 1) {
        const iconPath = args[finalIconIndex + 1];
        if (fs.existsSync(iconPath)) {
            console.log(`Applying icon from "${iconPath}" to main executable...`);
            finalIconPathToApply = iconPath;
        }
    }

    await applyMetadata(outputExe, {
        FileDescription: appBaseName,
        ProductName: appBaseName,
        icon: finalIconPathToApply
    });

    // Patch PE subsystem to GUI (removes black console)
    async function patchToGUI(exePath) {
        let retries = 10;
        while (retries > 0) {
            try {
                const buffer = fs.readFileSync(exePath);
                if (buffer.readUInt16LE(0) === 0x5A4D) { // MZ
                    const peOffset = buffer.readUInt32LE(0x3C);
                    if (buffer.readUInt32LE(peOffset) === 0x00004550) { // PE\0\0
                        const subsystemOffset = peOffset + 24 + 68;
                        if (buffer.readUInt16LE(subsystemOffset) === 3) { // 3 = Console
                            buffer.writeUInt16LE(2, subsystemOffset); // 2 = GUI
                            fs.writeFileSync(exePath, buffer);
                            return true;
                        }
                    }
                }
                return false;
            } catch (e) {
                if (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES') {
                    retries--;
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.warn(`Warning: Failed to patch PE subsystem. The application may run with a console window. ${e.message}`);
                    return false;
                }
            }
        }
        console.warn(`Warning: Failed to patch PE subsystem. File locked by another process (e.g., Antivirus)`);
        return false;
    }

    if (await patchToGUI(outputExe)) {
        console.log(`Console window disabled successfully.`);
    }

    cleanup();
    console.log(`Success! Executable created: ${path.basename(outputExe)} (Node.js SEA)`);
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
        // Ignore cleanup errors
    }
}

main().catch(err => {
    console.error(`Error: Unexpected failure during build process: ${err.message}`);
    cleanup();
    process.exit(1);
});
