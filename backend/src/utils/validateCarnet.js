const CARNET_REGEX = /^\d{4,6}-\d{2}-\d{4,}$/;
const EXAMPLE = 'Ej: 1890-xx-xxxx';

function validateCarnet(carnet) {
    if (!CARNET_REGEX.test(carnet)) {
        return { valid: false, message: `Formato de carnet inválido. ${EXAMPLE}` };
    }

    const [region, year, correlative] = carnet.split('-');

    if (region.length < 4 || region.length > 6) {
        return { valid: false, message: `Región del carnet fuera de rango. ${EXAMPLE}` };
    }
    if (year.length !== 2) {
        return { valid: false, message: `Año del carnet inválido. ${EXAMPLE}` };
    }
    if (correlative.length < 4) {
        return { valid: false, message: `Correlativo del carnet muy corto. ${EXAMPLE}` };
    }

    return { valid: true };
}

module.exports = { validateCarnet };
