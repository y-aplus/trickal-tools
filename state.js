(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    } else {
        root.TrickcalState = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const ACTIVE_APOSTLES_KEY = "trickcal.activeApostles.v1";
    const INVENTORY_KEY = "trickcal.inventory.v1";
    const MATERIAL_KEY_PATTERN = /^R[1-9]_(PHYS_WEAPON|MAG_WEAPON|ARMOR|HAT|BOOTS|SPARKLY|SPLENDID)$/;

    function readJson(storage, key, fallback) {
        try {
            const value = storage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function sanitizeApostle(apostle) {
        if (!apostle ||
            !Number.isInteger(apostle.id) || apostle.id < 1 ||
            typeof apostle.name !== "string" || !apostle.name.trim() ||
            !["physical", "magic"].includes(apostle.type) ||
            !Number.isInteger(apostle.currentRank) ||
            apostle.currentRank < 1 || apostle.currentRank > 9 ||
            !Number.isInteger(apostle.targetRank) ||
            apostle.targetRank < apostle.currentRank || apostle.targetRank > 9 ||
            !Array.isArray(apostle.equipped) ||
            apostle.equipped.length !== 6 ||
            !apostle.equipped.every(value => typeof value === "boolean")) {
            return null;
        }

        return {
            id: apostle.id,
            name: apostle.name,
            type: apostle.type,
            currentRank: apostle.currentRank,
            targetRank: apostle.targetRank,
            equipped: [...apostle.equipped]
        };
    }

    function sanitizeApostles(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.map(sanitizeApostle).filter(Boolean);
    }

    function sanitizeInventory(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return {};
        }

        const inventory = {};
        for (const [key, count] of Object.entries(value)) {
            if (MATERIAL_KEY_PATTERN.test(key) &&
                Number.isInteger(count) && count >= 0) {
                inventory[key] = count;
            }
        }
        return inventory;
    }

    function loadPersistentState(storage) {
        return {
            activeApostles: sanitizeApostles(
                readJson(storage, ACTIVE_APOSTLES_KEY, [])
            ),
            inventory: sanitizeInventory(
                readJson(storage, INVENTORY_KEY, {})
            )
        };
    }

    function reconcileApostleTypes(apostles, database) {
        const typeByName = new Map(
            database.map(apostle => [apostle.name, apostle.type])
        );
        return apostles.map(apostle => ({
            ...apostle,
            type: typeByName.get(apostle.name) || apostle.type
        }));
    }

    function saveActiveApostles(storage, apostles) {
        storage.setItem(
            ACTIVE_APOSTLES_KEY,
            JSON.stringify(sanitizeApostles(apostles))
        );
    }

    function saveInventory(storage, inventory) {
        storage.setItem(
            INVENTORY_KEY,
            JSON.stringify(sanitizeInventory(inventory))
        );
    }

    return {
        loadPersistentState,
        reconcileApostleTypes,
        saveActiveApostles,
        saveInventory
    };
});
