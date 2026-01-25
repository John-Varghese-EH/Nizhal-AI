/**
 * FREE Edition IPC Handlers for Nizhal AI
 * 
 * IPC handlers for:
 * - Personality switching
 * - LocalVoice control
 * - EmotionDetection
 * - Desktop automation
 * - ADB control
 * - Network utilities
 */

import { ipcMain } from 'electron';

/**
 * Setup all FREE edition IPC handlers
 */
export function setupFreeEditionIPC(services) {
    const {
        localVoice,
        emotionDetector,
        desktopAutomation,
        adbControl,
        networkUtils,
        windowManager,
        currentPersonality,
        setCurrentPersonality
    } = services;

    // ===== PERSONALITY SWITCHING =====

    ipcMain.handle('personality:switch', async (_, personalityId) => {
        try {
            const personality = PERSONALITIES[personalityId];
            if (!personality) {
                return { success: false, error: 'Invalid personality ID' };
            }

            // Update current personality
            setCurrentPersonality(personalityId);

            // Update voice settings for new personality
            localVoice.setVoiceForPersonality(personalityId);

            // Broadcast to all windows
            windowManager?.broadcast('personality:changed', {
                personalityId,
                name: personality.displayName,
                theme: personality.theme
            });

            return {
                success: true,
                personality: {
                    id: personalityId,
                    name: personality.displayName,
                    hotkey: personality.hotkey
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('personality:getActive', () => {
        const personality = PERSONALITIES[currentPersonality];
        return {
            id: currentPersonality,
            name: personality.displayName,
            traits: personality.traits,
            theme: personality.theme
        };
    });

    ipcMain.handle('personality:getAll', () => {
        return Object.values(PERSONALITIES).map(p => ({
            id: p.id,
            name: p.displayName,
            hotkey: p.hotkey,
            type: p.type,
            theme: p.theme
        }));
    });

    ipcMain.handle('personality:getGreeting', (_, personalityId) => {
        return getGreeting(personalityId || currentPersonality);
    });

    // ===== LOCAL VOICE =====

    ipcMain.handle('voice:getStatus', () => {
        return localVoice.getStatus();
    });

    ipcMain.handle('voice:speak', async (_, text, emotion) => {
        try {
            await localVoice.speak(text, emotion);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voice:stopSpeaking', () => {
        localVoice.stopSpeaking();
        return { success: true };
    });

    ipcMain.handle('voice:getVoices', () => {
        return localVoice.getVoices();
    });

    ipcMain.handle('voice:setVoice', (_, personality, emotion) => {
        localVoice.setVoiceForPersonality(personality, emotion);
        return { success: true };
    });

    // ===== EMOTION DETECTION =====

    ipcMain.handle('emotion:detect', (_, text) => {
        return emotionDetector.detectEmotion(text);
    });

    ipcMain.handle('emotion:detectFromContext', (_, messages, limit) => {
        return emotionDetector.detectFromContext(messages, limit);
    });

    ipcMain.handle('emotion:getResponseTemplate', (_, emotion, personality) => {
        return emotionDetector.getResponseTemplate(emotion, personality || currentPersonality);
    });

    ipcMain.handle('emotion:getValidation', (_, emotion) => {
        return emotionDetector.getValidationPhrase(emotion);
    });

    ipcMain.handle('emotion:getOpenQuestion', (_, emotion) => {
        return emotionDetector.getOpenQuestion(emotion);
    });

    // ===== DESKTOP AUTOMATION =====

    ipcMain.handle('desktop:getVolume', async () => {
        return await desktopAutomation.getVolume();
    });

    ipcMain.handle('desktop:setVolume', async (_, level) => {
        return await desktopAutomation.setVolume(level);
    });

    ipcMain.handle('desktop:getBrightness', async () => {
        return await desktopAutomation.getBrightness();
    });

    ipcMain.handle('desktop:setBrightness', async (_, level) => {
        return await desktopAutomation.setBrightness(level);
    });

    ipcMain.handle('desktop:launchApp', async (_, appName) => {
        return await desktopAutomation.launchApp(appName);
    });

    ipcMain.handle('desktop:closeApp', async (_, appName) => {
        return await desktopAutomation.closeApp(appName);
    });

    ipcMain.handle('desktop:getSystemInfo', () => {
        return desktopAutomation.getSystemInfo();
    });

    ipcMain.handle('desktop:getCPUUsage', async () => {
        return await desktopAutomation.getCPUUsage();
    });

    ipcMain.handle('desktop:listProcesses', async () => {
        return await desktopAutomation.listProcesses();
    });

    ipcMain.handle('desktop:copyToClipboard', async (_, text) => {
        return await desktopAutomation.copyToClipboard(text);
    });

    ipcMain.handle('desktop:getClipboard', async () => {
        return await desktopAutomation.getClipboard();
    });

    ipcMain.handle('desktop:lockScreen', async () => {
        return await desktopAutomation.lockScreen();
    });

    // ===== ANDROID ADB CONTROL =====

    ipcMain.handle('adb:checkInstalled', async () => {
        return await adbControl.checkADBInstalled();
    });

    ipcMain.handle('adb:connect', async (_, ipAddress, port) => {
        return await adbControl.connect(ipAddress, port);
    });

    ipcMain.handle('adb:disconnect', async () => {
        return await adbControl.disconnect();
    });

    ipcMain.handle('adb:enableWiFi', async () => {
        return await adbControl.enableWiFiDebugging();
    });

    ipcMain.handle('adb:getDevices', async () => {
        return await adbControl.getDevices();
    });

    ipcMain.handle('adb:tap', async (_, x, y, confirm) => {
        return await adbControl.tap(x, y, confirm);
    });

    ipcMain.handle('adb:swipe', async (_, x1, y1, x2, y2, duration) => {
        return await adbControl.swipe(x1, y1, x2, y2, duration);
    });

    ipcMain.handle('adb:typeText', async (_, text) => {
        return await adbControl.typeText(text);
    });

    ipcMain.handle('adb:keyEvent', async (_, keycode) => {
        return await adbControl.sendKeyEvent(keycode);
    });

    ipcMain.handle('adb:pressHome', async () => {
        return await adbControl.pressHome();
    });

    ipcMain.handle('adb:pressBack', async () => {
        return await adbControl.pressBack();
    });

    ipcMain.handle('adb:launchApp', async (_, packageName) => {
        return await adbControl.launchApp(packageName);
    });

    ipcMain.handle('adb:closeApp', async (_, packageName) => {
        return await adbControl.closeApp(packageName);
    });

    ipcMain.handle('adb:screenshot', async (_, savePath) => {
        return await adbControl.takeScreenshot(savePath);
    });

    ipcMain.handle('adb:getResolution', async () => {
        return await adbControl.getScreenResolution();
    });

    ipcMain.handle('adb:getDeviceInfo', async () => {
        return await adbControl.getDeviceInfo();
    });

    ipcMain.handle('adb:setConfirmation', (_, required) => {
        adbControl.setConfirmationRequired(required);
        return { success: true, required };
    });

    ipcMain.handle('adb:getHistory', (_, limit) => {
        return adbControl.getCommandHistory(limit);
    });

    ipcMain.handle('adb:getSecurityWarning', () => {
        return adbControl.getSecurityWarning();
    });

    ipcMain.handle('adb:shell', async (_, command) => {
        return await adbControl.shell(command);
    });

    ipcMain.handle('adb:logcat', async (_, lines) => {
        return await adbControl.getLogcat(lines);
    });

    ipcMain.handle('adb:clearLogcat', async () => {
        return await adbControl.clearLogcat();
    });

    // ===== NETWORK UTILITIES =====

    ipcMain.handle('network:scanPorts', async (_, host, ports) => {
        return await networkUtils.scanPorts(host, ports);
    });

    ipcMain.handle('network:whois', async (_, domain) => {
        return await networkUtils.whois(domain);
    });

    ipcMain.handle('network:resolveDNS', async (_, domain) => {
        return await networkUtils.resolveDNS(domain);
    });

    ipcMain.handle('network:reverseDNS', async (_, ip) => {
        return await networkUtils.reverseDNS(ip);
    });

    ipcMain.handle('network:ping', async (_, host, count) => {
        return await networkUtils.ping(host, count);
    });

    ipcMain.handle('network:traceroute', async (_, host) => {
        return await networkUtils.traceroute(host);
    });

    ipcMain.handle('network:getInfo', async () => {
        return await networkUtils.getNetworkInfo();
    });

    ipcMain.handle('network:getPublicIP', async () => {
        return await networkUtils.getPublicIP();
    });

    ipcMain.handle('network:getGitHubUser', async (_, username) => {
        return await networkUtils.getGitHubUser(username);
    });

    ipcMain.handle('network:getGitHubRepos', async (_, username) => {
        return await networkUtils.getGitHubRepos(username);
    });

    ipcMain.handle('network:getHistory', (_, limit) => {
        return networkUtils.getCommandHistory(limit);
    });

    ipcMain.handle('network:getEthicalWarning', () => {
        return networkUtils.getEthicalUseWarning();
    });

    console.log('[IPC] ✅ FREE Edition IPC handlers registered');
}
