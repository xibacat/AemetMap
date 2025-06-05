

/**
 * Función de utilidad para filtrar valores únicos en un array.
 *
 * Se utiliza comúnmente como función callback en Array.prototype.filter()
 * para eliminar elementos duplicados, manteniendo solo la primera aparición
 * de cada valor.
 *
 * @param {*} value - El valor actual que se está procesando en el array.
 * @param {number} index - El índice del valor actual en el array.
 * @param {Array} array - El array completo que está siendo filtrado.
 * @returns {boolean} - Retorna true si el valor es único en el array
 *                      (es decir, si su primer índice coincide con el índice actual).
 *
 * @example
 * const data = [1, 2, 2, 3];
 * const unique = data.filter(onlyUnique);
 * console.log(unique); // [1, 2, 3]
 */
export function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

export function onlyUniqueDates(fecha, index, self) {

    return index === self.findIndex((f) => f.getTime() === fecha.getTime());
}
/**
 *
 * @param {Date} fecha
 * @returns {String} String
 */
export function toDateHourString(fecha) {
    //alert(fecha +"es del tipo" + (typeof fecha))
    return fecha.toLocaleString('es-ES', {

        year: 'numeric',    // Año completo (2025)
        month: 'long',      // Mes (Enero, Febrero, etc.)
        day: 'numeric',     // Día del mes (1, 2, 3, etc.)
        hour: '2-digit',    // Hora en formato de 2 dígitos
        minute: '2-digit',  // Minutos en formato de 2 dígitos
        second: '2-digit',  // Segundos en formato de 2 dígitos
        hour12: false       // Si se usa el formato de 24 horas
    });
}

/**
 * Returns False if num is null, NaN or +/-Infinite
 *
 * @param {Number} num
 * @returns {boolean}
 */
export function isSafeNum(num) {
    return !(num == null || isNaN(num) || !isFinite(num));
}

/**
 *
 * @param {Date[]} dateArray
 * @returns
 */
export function getMaxDate(dateArray) {
    let date = new Date(0);
    dateArray.forEach(e => {
        if (e.getTime() > date.getTime())
            date = e;
    });
    return date;
}