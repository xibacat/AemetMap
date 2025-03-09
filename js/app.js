const URL_AEMET = "https://opendata.aemet.es/opendata/api/observacion/convencional/todas"; //https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/";
const APIKEY_AEMET = "?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4YXZpZXIuaWJhY2F0QGdtYWlsLmNvbSIsImp0aSI6ImU0MzJhOTMwLTMzNmUtNDg4Ni1iNjY3LTgxMzcxMjEyZjJmZCIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzQxMTA4NTA4LCJ1c2VySWQiOiJlNDMyYTkzMC0zMzZlLTQ4ODYtYjY2Ny04MTM3MTIxMmYyZmQiLCJyb2xlIjoiIn0.2eQST-_KQvjRKLGwudOyrDU2fiD17c3aiZSzLtGkr3s"

"https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4YXZpZXIuaWJhY2F0QGdtYWlsLmNvbSIsImp0aSI6ImU0MzJhOTMwLTMzNmUtNDg4Ni1iNjY3LTgxMzcxMjEyZjJmZCIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzQxMTA4NTA4LCJ1c2VySWQiOiJlNDMyYTkzMC0zMzZlLTQ4ODYtYjY2Ny04MTM3MTIxMmYyZmQiLCJyb2xlIjoiIn0.2eQST-_KQvjRKLGwudOyrDU2fiD17c3aiZSzLtGkr3s"

let datos;
let maxDate;
let uniqueDates;
let uniqueUbic;

//Crear el mapa
const map = L.map('map').setView([39.5, -0.4], 10);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


document.getElementById("btn_refresh").onclick = () => refreshData();




function refreshData() {

    fetch(URL_AEMET + APIKEY_AEMET) // Reemplaza con tu URL de API
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud');
            }
            return response.json(); // Convertir la respuesta a formato JSON
        })
        .then(data => {
            console.log(data); // Mostrar los datos en la consola
            fetch(data.datos) // Reemplaza con tu URL de API
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la solicitud');
                    }
                    return response.json(); // Convertir la respuesta a formato JSON
                })
                .then(data2 => {
                    //filtrar datos para que sea como en heatmap
                    // var heatData = [];
                    // data2.forEach(e => {
                    //     if(e.provincia===)
                    // });
                    datos = data2;
                    for (let i = 0; i < data2.length; i++) {
                        datos[i].fint = new Date(data2[i].fint);

                    }
                    var allDates = data2.map(d => d.fint);

                    uniqueDates = allDates.filter(onlyUniqueDates);
                    // uniqueDates = allDates.filter((fecha, index, self) =>
                    //     index === self.findIndex((f) => f.getTime() === fecha.getTime())
                    // );
                    //uniqueDates = allDates.filter(onlyUnique);
                    console.log("UniqueDates:" + uniqueDates);
                    //uniqueDates = uniqueDates.map(d => new Date(d));
                    console.log("UniqueDates.map:" + uniqueDates);

                    maxDate = new Date(getMaxDate(allDates));
                    uniqueUbic = datos.map(d => d.ubi).filter(onlyUnique);

                    console.log("Max Date: " + maxDate)

                    var heatData = datos.filter(d => d.fint.getTime() === maxDate.getTime())
                        .map(d => [d.lat, d.lon, d.tamax]);

                    //Mostrar datos heat
                    L.heatLayer(heatData, {
                        radius: 25, // radio de los puntos de calor
                        blur: 25,   // difuminado de los puntos
                        maxZoom: 13 // zoom máximo en el que se puede ver el mapa de calor
                    }).addTo(map);

                    //Habilitar uso de markers
                    agregarDesplegable(uniqueDates);
                    document.getElementById("btn_markers").classList.replace("btn-default", "btn-primary");
                    document.getElementById("btn_markers").onclick = () => setMarkers();

                })
                .catch(error => {
                    console.error('Hubo un problema con la solicitud fetch:', error);
                });
        })
        .catch(error => {
            console.error('Hubo un problema con la solicitud fetch:', error);
        });
}
/**
 *
 * @param {Date[]} dateArray
 */
function agregarDesplegable(dateArray) {
    //alert(dateArray);
    // Crear el elemento <select>
    var select = document.createElement('select');

    // Crear opciones para el desplegable
    dateArray.forEach(e => {
        var option1 = document.createElement('option');
        option1.value = e;
        option1.text = toDateHourString(e);
        select.appendChild(option1);
    });

    // Obtener el objeto con id 'sidepane'
    var sidepane = document.getElementById('sidebar');

    // Añadir el <select> al innerHTML del objeto con id 'sidepane'
    sidepane.innerHTML = ''; // Limpiar el contenido anterior (opcional)
    sidepane.appendChild(select);
}
/**
 *
 * @param {Date} fecha
 * @returns
 */
function toDateHourString(fecha) {
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


function setMarkers() {
    if (datos.length == 0)
        refreshData();

    var myRenderer = L.canvas({ padding: 0.5 });
    datos.filter(d => d.fint.getTime() === maxDate.getTime())
        .forEach(d => {
            L.circleMarker([d.lat, d.lon], {
                renderer: myRenderer,
                radius: 5
            }).addTo(map).bindPopup(
                '<b> Ubicación: ' + d.ubi + "</b>" +
                "<br>Hora: " + d.fint.toISOString() +
                "<br>Precipitación: " + d.prec + " mm" +
                "<br>Tª min: " + d.tamin + " ºC" +
                "<br>Tª max: " + d.tamax + " ºC" +
                "<br>Tª actual: " + d.ta + " ºC"
            );
        });
}
/**
 *
 * @param {Date[]} dateArray
 * @returns
 */
function getMaxDate(dateArray) {
    var date = new Date(0);
    dateArray.forEach(e => {
        if (e.getTime() > date.getTime())
            date = e;
    });
    return date;
}
function onlyUniqueDates(fecha, index, self) {

    return index === self.findIndex((f) => f.getTime() === fecha.getTime());
}

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}