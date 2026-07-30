import { app, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { downloadAndLaunchRdp } from './rdp-launcher';

// Register Custom Protocol (nanodata://)
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('nanodata', process.execPath, [path.resolve(process.argv[1])])
    }
} else {
    app.setAsDefaultProtocolClient('nanodata')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    let openedByUrl = false;

    // Handle macOS protocol deep linking
    app.on('open-url', (event, url) => {
        event.preventDefault();
        openedByUrl = true;
        handleProtocolUri(url);
    });

    app.on('second-instance', (event, commandLine) => {
        // Someone tried to run a second instance, we should log their protocol URL
        const url = commandLine.find(arg => arg.startsWith('nanodata://'));
        if (url) {
            handleProtocolUri(url);
        } else {
            showManualLaunchMessage();
        }
    });

    app.whenReady().then(() => {
        console.log('nanoData Helper is running in background.');

        // Check if app was opened via protocol initially
        const url = process.argv.find(arg => arg.startsWith('nanodata://'));
        if (url) {
            openedByUrl = true;
            handleProtocolUri(url);
        }

        if (!openedByUrl) {
            showManualLaunchMessage();
        }
    });

    app.on('window-all-closed', () => {
        // Stay running in the background for Windows helpers
    });
}

function showManualLaunchMessage() {
    shell.openExternal('http://client.nanodata.tr:5173');

    if (process.platform === 'win32') {
        try {
            const userDataPath = app.getPath('userData');
            const firstRunFilePath = path.join(userDataPath, '.first-run-complete');
            const isFirstRun = !fs.existsSync(firstRunFilePath);
            if (isFirstRun) {
                fs.writeFileSync(firstRunFilePath, 'done');
                dialog.showMessageBox({
                    type: 'info',
                    title: 'Installation Successful',
                    message: 'Installation successful. You can now launch RDP sessions using the web client.',
                    buttons: ['OK']
                });
            }
        } catch (e) {
            console.error('Failed to check first run state', e);
        }
    }
}

function handleProtocolUri(url: string) {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'connect') {
        const token = urlObj.searchParams.get('token');
        const apiHost = urlObj.searchParams.get('apiHost') || 'http://localhost:3000'; // fallback

        if (token) {
            downloadAndLaunchRdp(token, apiHost).catch(err => {
                dialog.showErrorBox('nanoData RDP Error', `Failed connecting to: ${apiHost}\n\n${err.message}`);
            });
        }
    }
}
