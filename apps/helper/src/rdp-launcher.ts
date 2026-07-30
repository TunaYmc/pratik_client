import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { net } from 'electron';

export async function downloadAndLaunchRdp(token: string, apiHost: string) {
    return new Promise<void>((resolve, reject) => {
        // 1. Download the RDP file content using the token
        const url = `${apiHost}/api/rdp/download?token=${token}`;

        console.log(`Downloading RDP from: ${url}`);

        const request = net.request(url);
        request.on('response', (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download RDP file: ${response.statusCode}`));
            }

            let data = '';
            response.on('data', (chunk) => {
                data += chunk.toString();
            });

            response.on('end', () => {
                // 2. Save to Temp Directory with a completely unique name
                const tempPath = path.join(os.tmpdir(), `nanodata-${Date.now()}-${Math.floor(Math.random() * 1000)}.rdp`);
                fs.writeFileSync(tempPath, data);

                console.log(`Saved RDP file to: ${tempPath}`);

                // 3. Clear MSTSC cache to prevent reconnecting to the previous session
                console.log(`Launching RDP on platform: ${os.platform()}`);

                if (os.platform() === 'win32') {
                    // Windows specific logic
                    console.log('Clearing MSTSC Cache and launching...');
                    const clearCacheCmd = `reg delete "HKCU\\Software\\Microsoft\\Terminal Server Client\\Default" /va /f`;

                    exec(clearCacheCmd, () => {
                        exec(`mstsc.exe "${tempPath}"`, (error) => {
                            if (error) {
                                console.error('Failed to launch mstsc:', error);
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    });
                } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
                    // macOS/Linux specific logic - delegate to the default RDP client (e.g., "Windows App" on macOS)
                    import('electron').then(({ shell }) => {
                        shell.openPath(tempPath).then((openError) => {
                            if (openError) {
                                console.error('Failed to open RDP file natively:', openError);
                                reject(new Error(openError));
                            } else {
                                resolve();
                            }
                        }).catch(reject);
                    });
                } else {
                    reject(new Error(`Unsupported platform: ${os.platform()}`));
                }
            });
        });

        request.on('error', (err) => {
            reject(err);
        });

        request.end();
    });
}
