//TODO mostrar escalas en la ventana
const temperatureColors = [
    { min: -Infinity, max: -20, color: '#4B0082' }, // Violeta oscuro
    { min: -20, max: -10, color: '#00008B' },       // Azul muy oscuro
    { min: -10, max: -5, color: '#0000CD' },        // Azul oscuro
    { min: -5, max: 0, color: '#4169E1' },          // Azul
    { min: 0, max: 5, color: '#87CEFA' },           // Azul claro
    { min: 5, max: 10, color: '#48D1CC' },          // Verde azulado
    { min: 10, max: 15, color: '#32CD32' },         // Verde
    { min: 15, max: 20, color: '#ADFF2F' },         // Amarillo verdoso
    { min: 20, max: 25, color: '#FFFF00' },         // Amarillo
    { min: 25, max: 30, color: '#FFA500' },         // Naranja claro
    { min: 30, max: 35, color: '#FF8C00' },         // Naranja
    { min: 35, max: 40, color: '#FF4500' },         // Rojo
    { min: 40, max: 45, color: '#B22222' },         // Rojo fuego
    { min: 45, max: Infinity, color: '#800000' }    // Rojo oscuro / marrón quemado
];

function getColorForTemperature(temp) {
    const range = temperatureColors.find(r => temp >= r.min && temp < r.max);
    return range ? range.color : '#000000'; // Color por defecto si no se encuentra
}

export function colorForTemp(temp) {
    return { fillColor: getColorForTemperature(temp), fillOpacity: 0.5, weight: 0 }

}
const precipitationColors = [
    { min: 0, max: 0.1, color: '#FFFFFF' },   // Sin precipitación (blanco)
    { min: 0.1, max: 1, color: '#D4F4FA' },   // Muy ligera (azul muy claro)
    { min: 1, max: 5, color: '#A0D8EF' },     // Ligera
    { min: 5, max: 10, color: '#4FC3F7' },    // Moderada
    { min: 10, max: 20, color: '#0288D1' },   // Moderada alta
    { min: 20, max: 30, color: '#01579B' },   // Fuerte
    { min: 30, max: 50, color: '#004BA0' },   // Muy fuerte
    { min: 50, max: 75, color: '#673AB7' },   // Intensa (lila)
    { min: 75, max: 100, color: '#8E24AA' },  // Intensa extrema (morado)
    { min: 100, max: 150, color: '#6A1B9A' },  // Torrencial fuerte (púrpura)
    { min: 150, max: 250, color: '#4A148C' },  // Torrencial extremo (violeta oscuro)
    { min: 250, max: Infinity, color: '#1A0F3F' } // Lluvia catastrófica (casi negro)
];
function getColorForPrecipitation(mm) {
    const range = precipitationColors.find(r => mm >= r.min && mm < r.max);
    return range ? range.color : '#000000'; // Negro si no se encuentra rango
}
export function colorForPrec(prec) {
    return { fillColor: getColorForPrecipitation(prec), fillOpacity: 0.5, weight: 0 }

}

