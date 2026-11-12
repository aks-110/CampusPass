const fs = require('fs');
const path = require('path');
const stripComments = require('strip-comments');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (f === 'node_modules' || f === '.git' || f === 'build' || f === 'dist') return;
        
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const targetDir = process.argv[2] || '.';

walkDir(targetDir, (filePath) => {
    const ext = path.extname(filePath);
    // Process js, jsx, ts, tsx, css, html
    if (['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'].includes(ext)) {
        try {
            const code = fs.readFileSync(filePath, 'utf8');
            const strippedCode = stripComments(code);
            if (code !== strippedCode) {
                fs.writeFileSync(filePath, strippedCode, 'utf8');
                console.log(`Stripped comments from: ${filePath}`);
            }
        } catch (e) {
            console.error(`Error processing ${filePath}:`, e.message);
        }
    }
});
