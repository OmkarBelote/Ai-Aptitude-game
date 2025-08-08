/* ===================================
   Storage Manager - Handles localStorage
   =================================== */
class StorageManager {
    constructor() {
        this.prefix = 'aptitudeGame_';
    }

    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(fullKey, serializedValue);
        } catch (e) {
            console.error("Error saving to localStorage", e);
        }
    }

    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const serializedValue = localStorage.getItem(fullKey);
            return serializedValue ? JSON.parse(serializedValue) : defaultValue;
        } catch (e) {
            console.error("Error reading from localStorage", e);
            return defaultValue;
        }
    }
}
