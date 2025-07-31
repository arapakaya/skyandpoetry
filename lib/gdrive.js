const fs = require("fs");
const { exec } = require("child_process");

async function downloadFileFromGoogleDrive(link) {
    return new Promise((resolve, reject) => {
        const regex = /(?:\/d\/|id=)([a-zA-Z0-9-_]+)/;
        const match = link.match(regex);

        if (!match) return reject("Invalid Google Drive link");

        const fileId = match[1];
        const fileName = `downloaded_${fileId}.zip`;

        const command = `curl -L -o ${fileName} "https://drive.google.com/uc?export=download&id=${fileId}"`;

        exec(command, (err) => {
            if (err) return reject(err);
            resolve(`./${fileName}`);
        });
    });
}

module.exports = { downloadFileFromGoogleDrive };
