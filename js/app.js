const URL_AEMET = "https://opendata.aemet.es/opendata/api/observacion/convencional/todas";
const APIKEY_AEMET = "?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4YXZpZXIuaWJhY2F0QGdtYWlsLmNvbSIsImp0aSI6ImU0MzJhOTMwLTMzNmUtNDg4Ni1iNjY3LTgxMzcxMjEyZjJmZCIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzQxMTA4NTA4LCJ1c2VySWQiOiJlNDMyYTkzMC0zMzZlLTQ4ODYtYjY2Ny04MTM3MTIxMmYyZmQiLCJyb2xlIjoiIn0.2eQST-_KQvjRKLGwudOyrDU2fiD17c3aiZSzLtGkr3s"


let datos;
let maxDate;
let uniqueDates;
let uniqueUbic;
let heatLayer;
let menuActive = true;
let btn_menu = document.getElementById("btn_menu");
btn_menu.onclick = () => clickMenu();

//Crear el mapa
const map = L.map('map').setView([39.5, -0.4], 10);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


//Pedir los datos a la API
refreshData();

function clickMenu() {
    var sidebar = document.getElementById("sidebar");
    if (menuActive) {
        btn_menu.innerHTML = '<span class="icon icon-menu"></span>';
        sidebar.style.display = "none";
        menuActive = false;
    } else {
        btn_menu.innerHTML = '<span class="icon icon-cancel-squared"></span>';
        sidebar.style.display = "initial";
        menuActive = true;
    }
 }

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
                    datos = data2;
                    for (let i = 0; i < data2.length; i++) {
                        datos[i].fint = new Date(data2[i].fint);
                    }
                    var allDates = data2.map(d => d.fint);

                    uniqueDates = allDates.filter(onlyUniqueDates);

                    console.log("UniqueDates:" + uniqueDates);
                    console.log("UniqueDates.map:" + uniqueDates);

                    maxDate = new Date(getMaxDate(allDates));
                    uniqueUbic = datos.map(d => d.ubi).filter(onlyUnique);

                    console.log("Max Date: " + maxDate)



                    //Habilitar botones y desplegables
                    agregarDesplegable(uniqueDates);
                    document.getElementById("form").style.visibility = "visible";
                    enableHeatAndMarkers();

                    //Habilitar pestañas
                    document.getElementById("tab_tabla").onclick = () => enableTabla();
                    document.getElementById("tab_mapa").onclick = () => enableMap();

                })
                .catch(error => {
                    console.error('Hubo un problema con la solicitud fetch:', error);
                });
        })
        .catch(error => {
            console.error('Hubo un problema con la solicitud fetch:', error);
        });
}

function poblarTabla(data) {
    // Obtener el elemento de la tabla en el HTML
    const tabla = document.getElementById('tabla');

    // Asegurarse de que la tabla esté vacía antes de agregar nuevos datos
    tabla.innerHTML = '';

    // Crear la cabecera de la tabla
    const cabecera = document.createElement('thead');
    const filaCabecera = document.createElement('tr');

    // Los encabezados de la tabla
    const encabezados = ['Ubi', 'Tamax', 'Tamin', 'Ta', 'Prec'];

    // Crear celdas para los encabezados
    encabezados.forEach(encabezado => {
        const celda = document.createElement('th');
        celda.textContent = encabezado;
        filaCabecera.appendChild(celda);
    });

    cabecera.appendChild(filaCabecera);
    tabla.appendChild(cabecera);

    // Crear el cuerpo de la tabla
    const cuerpo = document.createElement('tbody');
    var select = document.getElementById('desplegable');
    var selectedDate = new Date(select.options[select.selectedIndex].value);
    // Recorrer cada objeto del array de datos y crear una fila
    data.filter(d => d.fint.getTime() === selectedDate.getTime())
        .forEach(item => {
            const fila = document.createElement('tr');

            // Crear celdas para cada propiedad del objeto
            const celdas = [item.ubi, item.tamax, item.tamin, item.ta, item.prec];
            celdas.forEach(valor => {
                const celda = document.createElement('td');
                celda.textContent = valor;
                fila.appendChild(celda);
            });

            cuerpo.appendChild(fila);
        });

    tabla.appendChild(cuerpo);
}

function enableTabla() {
    document.getElementById("tabla").style.display = "initial";
    document.getElementById("map").style.display = "none";
    disableHeatAndMarkers();
    poblarTabla(datos);
}
function enableMap() {
    document.getElementById("tabla").style.display = "none";
    document.getElementById("map").style.display = "block";
    enableHeatAndMarkers();
}

function disableHeatAndMarkers() {
    document.getElementById("btn_markers").classList.replace("btn-positive", "btn-default");
    document.getElementById("btn_markers").onclick = null;
    document.getElementById("btn_heatmap").classList.replace("btn-positive", "btn-default");
    document.getElementById("btn_heatmap").onclick = null;
}
function enableHeatAndMarkers() {
    document.getElementById("btn_markers").classList.replace("btn-default", "btn-positive");
    document.getElementById("btn_markers").onclick = () => setMarkers();
    document.getElementById("btn_heatmap").classList.replace("btn-default", "btn-positive");
    document.getElementById("btn_heatmap").onclick = () => plotHeatMap();
}

function plotHeatMap() {
    var heatData = datos.filter(d => d.fint.getTime() === maxDate.getTime())
        .map(d => [d.lat, d.lon, d.tamax]);

    //Si tengo alguna capa de calor la borro
    if (heatLayer != null)
        map.removeLayer(heatLayer);
    //Mostrar datos heat
    heatLayer = L.heatLayer(heatData, {
        radius: 25, // radio de los puntos de calor
        blur: 25, // difuminado de los puntos
        maxZoom: 13 // zoom máximo en el que se puede ver el mapa de calor
    }).addTo(map);
}

/**
 *
 * @param {Date[]} dateArray
 */
function agregarDesplegable(dateArray) {
    //alert(dateArray);
    // Crear el elemento <select>
    var select = document.getElementById('desplegable');//document.createElement('select');

    // Crear opciones para el desplegable
    dateArray.forEach(e => {
        var option1 = document.createElement('option');
        option1.value = e;
        option1.text = toDateHourString(e);
        select.appendChild(option1);
    });

    // Obtener el objeto con id 'sidepane'
    //var sidepane = document.getElementById('sidebar');

    // Añadir el <select> al innerHTML del objeto con id 'sidepane'
    //sidepane.innerHTML = ''; // Limpiar el contenido anterior (opcional)
    //sidepane.appendChild(select);
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
                "<br>Hora: " + toDateHourString(d.fint) +
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