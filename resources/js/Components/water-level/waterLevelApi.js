import axios from 'axios';

const API = '/api/water-levels';

/**
 * @param {number} valueCm
 * @param {number} normalMaxCm
 * @param {number} siagaMaxCm
 * @returns {'NORMAL'|'SIAGA'|'BAHAYA'}
 */
export function statusFromValue(valueCm, normalMaxCm, siagaMaxCm) {
    if (valueCm <= normalMaxCm) {
        return 'NORMAL';
    }
    if (valueCm <= siagaMaxCm) {
        return 'SIAGA';
    }

    return 'BAHAYA';
}

/**
 * @param {'NORMAL'|'SIAGA'|'BAHAYA'} status
 */
export function alertLevelFromStatus(status) {
    if (status === 'BAHAYA') {
        return 'danger';
    }
    if (status === 'SIAGA') {
        return 'warning';
    }

    return 'normal';
}

/**
 * @returns {Promise<import('./waterLevelTypes').WaterLevelIndexPayload>}
 */
export async function fetchWaterLevels() {
    const { data } = await axios.get(API);
    return data;
}
