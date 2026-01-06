import { screen } from 'electron';

export function createWindowManager(window) {
    let isClickThrough = false;
    let isMaximized = false;
    let previousBounds = null;

    const manager = {
        getWindow() {
            return window;
        },

        minimize() {
            if (window && !window.isDestroyed()) {
                window.minimize();
                return true;
            }
            return false;
        },

        toggleMaximize() {
            if (window && !window.isDestroyed()) {
                if (isMaximized) {
                    if (previousBounds) {
                        window.setBounds(previousBounds);
                    }
                    isMaximized = false;
                } else {
                    previousBounds = window.getBounds();
                    const display = screen.getDisplayNearestPoint(window.getBounds());
                    window.setBounds(display.workArea);
                    isMaximized = true;
                }
                return isMaximized;
            }
            return false;
        },

        close() {
            if (window && !window.isDestroyed()) {
                window.close();
                return true;
            }
            return false;
        },

        setClickThrough(enable) {
            if (window && !window.isDestroyed()) {
                isClickThrough = enable;
                window.setIgnoreMouseEvents(enable, { forward: true });

                if (enable) {
                    window.webContents.send('click-through-enabled');
                } else {
                    window.webContents.send('click-through-disabled');
                }

                return isClickThrough;
            }
            return false;
        },

        isClickThrough() {
            return isClickThrough;
        },

        setAlwaysOnTop(enable) {
            if (window && !window.isDestroyed()) {
                window.setAlwaysOnTop(enable, 'floating', 1);
                return true;
            }
            return false;
        },

        setOpacity(opacity) {
            if (window && !window.isDestroyed()) {
                const clampedOpacity = Math.max(0.1, Math.min(1, opacity));
                window.setOpacity(clampedOpacity);
                return clampedOpacity;
            }
            return 1;
        },

        setPosition(x, y, animate = false) {
            if (window && !window.isDestroyed()) {
                window.setPosition(Math.round(x), Math.round(y), animate);
                return true;
            }
            return false;
        },

        setSize(width, height, animate = false) {
            if (window && !window.isDestroyed()) {
                window.setSize(Math.round(width), Math.round(height), animate);
                return true;
            }
            return false;
        },

        center() {
            if (window && !window.isDestroyed()) {
                window.center();
                return true;
            }
            return false;
        },

        moveToDisplay(displayId) {
            if (window && !window.isDestroyed()) {
                const displays = screen.getAllDisplays();
                const targetDisplay = displays.find(d => d.id === displayId) || displays[0];

                if (targetDisplay) {
                    const { x, y, width, height } = targetDisplay.workArea;
                    const windowBounds = window.getBounds();
                    const newX = x + Math.floor((width - windowBounds.width) / 2);
                    const newY = y + Math.floor((height - windowBounds.height) / 2);
                    window.setPosition(newX, newY);
                    return true;
                }
            }
            return false;
        },

        getDisplays() {
            return screen.getAllDisplays().map(display => ({
                id: display.id,
                bounds: display.bounds,
                workArea: display.workArea,
                isPrimary: display.id === screen.getPrimaryDisplay().id
            }));
        },

        snapToCorner(corner) {
            if (window && !window.isDestroyed()) {
                const display = screen.getDisplayNearestPoint(window.getBounds());
                const { x, y, width, height } = display.workArea;
                const windowBounds = window.getBounds();
                const padding = 20;

                const positions = {
                    'top-left': { x: x + padding, y: y + padding },
                    'top-right': { x: x + width - windowBounds.width - padding, y: y + padding },
                    'bottom-left': { x: x + padding, y: y + height - windowBounds.height - padding },
                    'bottom-right': {
                        x: x + width - windowBounds.width - padding,
                        y: y + height - windowBounds.height - padding
                    }
                };

                const pos = positions[corner];
                if (pos) {
                    window.setPosition(Math.round(pos.x), Math.round(pos.y), true);
                    return true;
                }
            }
            return false;
        },

        setVibrancy(type) {
            if (window && !window.isDestroyed() && process.platform === 'darwin') {
                window.setVibrancy(type);
                return true;
            }
            return false;
        },

        setSkipTaskbar(skip) {
            if (window && !window.isDestroyed()) {
                window.setSkipTaskbar(skip);
                return true;
            }
            return false;
        },

        flash(flag = true) {
            if (window && !window.isDestroyed()) {
                window.flashFrame(flag);
                return true;
            }
            return false;
        }
    };

    return manager;
}
