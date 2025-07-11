import { onlyUnique, onlyUniqueDates, toDateHourString, isSafeNum, getMaxDate } from "./functions.js";
import { colorForPrec, colorForTemp, temperatureColors, precipitationColors } from "./color4map.js";
import { spainPoints, spainPointsHD } from "./spainGeoJSON.js";
const URL_AEMET = "https://opendata.aemet.es/opendata/api/observacion/convencional/todas";
const APIKEY_AEMET = "?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4YXZpZXIuaWJhY2F0QGdtYWlsLmNvbSIsImp0aSI6ImU0MzJhOTMwLTMzNmUtNDg4Ni1iNjY3LTgxMzcxMjEyZjJmZCIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzQxMTA4NTA4LCJ1c2VySWQiOiJlNDMyYTkzMC0zMzZlLTQ4ODYtYjY2Ny04MTM3MTIxMmYyZmQiLCJyb2xlIjoiIn0.2eQST-_KQvjRKLGwudOyrDU2fiD17c3aiZSzLtGkr3s"


let datos;
let datosTotalizados;
let maxDate;
let uniqueDates;
let uniqueUbic;
let heatLayer;
let leyenda;
let menuActive = true;
let markersOn = false;
let mapOn = false;
let btn_menu = document.getElementById("btn_menu");
btn_menu.onclick = () => clickMenu();

//Crear el mapa
const map = L.map('map').setView([39.5, -0.4], 10);
// map.createPane('polygonsPane');
// map.getPane('polygonsPane').style.zIndex = 400;

// map.createPane('markersPane');
// map.getPane('markersPane').style.zIndex = 650; // más alto que polygonsPane

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
//Grupo de markers que luego podré eliminar;
let markerGroup = L.layerGroup().addTo(map);

//Pedir los datos a la API
refreshData();

/**
 * Esconder y mostrar el panel lateral
 */
function clickMenu() {
    let sidebar = document.getElementById("sidebar");
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
/**
 * Pedir los datos a la API y habilitar la interfaz activa
 */
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
                    let allDates = data2.map(d => d.fint);

                    uniqueDates = allDates.filter(onlyUniqueDates);

                    console.log("UniqueDates:" + uniqueDates);
                    console.log("UniqueDates.map:" + uniqueDates);

                    maxDate = new Date(getMaxDate(allDates));
                    uniqueUbic = datos.map(d => d.ubi).filter(onlyUnique);
                    datosTotalizados = totalizarDatosPorUbicacion(datos.filter(d => d.lat > 35));

                    console.log("Max Date: " + maxDate)

                    //Habilitar botones y desplegables
                    habilitarInterfaz();

                })
                .catch(error => {
                    console.error('Hubo un problema con la solicitud fetch:', error);
                });
        })
        .catch(error => {
            console.error('Hubo un problema con la solicitud fetch:', error);
        });
}
function habilitarInterfaz() {
    //agregarDesplegable(uniqueDates);
    document.getElementById("form").style.visibility = "visible";
    enableHeatAndMarkers();
    document.getElementsByName("radios").forEach(r => { r.onchange = () => optionsChanged(); });
    //document.getElementById('desplegable').onchange = () => optionsChanged();
    //document.getElementById('totalizar').onchange = () => optionsChanged();

    //Habilitar pestañas
    document.getElementById("tab_tabla").onclick = () => enableTabla();
    document.getElementById("tab_mapa").onclick = () => enableMap();
}

function optionsChanged() {
    if (document.getElementById("tabla").style.display === "initial")
        poblarTabla(datos, 'tabla');
    if (document.getElementById("map").style.display === "") {

        plotInterpolatedMap(getSelectedData(datosTotalizados));
    }

}

function enableTabla() {
    document.getElementById("tabla").style.display = "initial";
    document.getElementById("map").style.display = "none";
    disableHeatAndMarkers();
    poblarTabla(datos, 'tabla');
}
function enableMap() {
    document.getElementById("tabla").style.display = "none";
    document.getElementById("map").style.display = "";
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
    document.getElementById("btn_markers").onclick = () => setMarkers(datosTotalizados);
    document.getElementById("btn_heatmap").classList.replace("btn-default", "btn-positive");
    document.getElementById("btn_heatmap").onclick = () => plotInterpolatedMap(getSelectedData(datosTotalizados));

}
function getSelectedData(points) {
    switch (document.querySelector('input[name="radios"]:checked').id) {
        case "tavg":
            return { data: points.filter(d => isSafeNum(d.tavg)).map(d => turf.point([d.lon, d.lat], { name: d.ubi, dato: d.tavg })), isPrec: false }

        case "tamin":
            return { data: points.filter(d => isSafeNum(d.tamin)).map(d => turf.point([d.lon, d.lat], { name: d.ubi, dato: d.tamin })), isPrec: false }

        case "prec":
            return { data: points.filter(d => isSafeNum(d.prec)).map(d => turf.point([d.lon, d.lat], { name: d.ubi, dato: d.prec })), isPrec: true }

        default: //tamax
            return { data: points.filter(d => isSafeNum(d.tamax)).map(d => turf.point([d.lon, d.lat], { name: d.ubi, dato: d.tamax })), isPrec: false }

    }
}

//TODO ajustar el mapa al contorno del mapa con más fidelidad y markers por encima del mapa
function plotInterpolatedMap(points) {
    let isPrec = points.isPrec;

    if (mapOn) {
        //TODO esto no debería hacerse aquí, sino fuera
        map.removeLayer(heatLayer);
        leyenda.remove();
        mapOn = false;
        document.getElementById("btn_heatmap").innerHTML = "Plot Color Map"
    }
    else {

        //convert to Turf featureCollection
        points = turf.featureCollection(points.data);

        //interpolation options: rectangular grid using 'dato' variable in kilometers using the power of 2, higher values result in smoother result
        let options = { gridType: 'square', property: 'dato', units: 'kilometers', weight: 5 };
        //create Turf grid
        let malla = turf.interpolate(points, 10, options);

        let spainPolygon = turf.polygon(spainPoints);
        malla = malla.features.filter(i => turf.booleanContains(spainPolygon, i));
        //add to Leaflet
        heatLayer = L.geoJSON(malla, {
            // pane: 'polygonsPane',
            interactive: false,
            style: function (feature) {
                let val = feature.properties.dato;
                if (isPrec)
                    return colorForPrec(val)
                else
                    return colorForTemp(val);

            }//,
            // onEachFeature: function (feature, layer) {
            //     layer.on({
            //         mouseover: function (e) {
            //             val = e.target.feature.properties.dato.toFixed(2);
            //             e.target.bindTooltip(val).openTooltip();
            //         }
            //     });
            // }
        }).addTo(map);

        //heatLayer.eachLayer(l => l.bringToBack());
        mapOn = true;
        document.getElementById("btn_heatmap").innerHTML = "Delete Color Map"

        leyenda = crearLeyenda(isPrec ? precipitationColors : temperatureColors);
    }
}
function crearLeyenda(rangos) {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');

        // Agregar una clase CSS básica
        let labels = [];

        rangos.forEach(rango => {
            const label = `
      <i style=
        "background:${rango.color};

         width: 18px;
         height: 18px;
         display: inline-block;
         margin-right: 8px;"
         ></i>
      ${rango.min} – ${rango.max}
    `;
            labels.push(label);
        });

        div.innerHTML = labels.join('<br>');
        return div;
    };

    legend.addTo(map);
    return legend;
}

function totalizarDatosPorUbicacion(datosAtotalizar) {
    // Objeto para almacenar los resultados agrupados por ubicación
    const resultado = {};

    // Iterar sobre cada elemento en el array
    datosAtotalizar.forEach(item => {
        const ubicacion = item.ubi;

        // Si no existe la ubicación en el objeto resultado, inicializarla
        if (!resultado[ubicacion]) {
            resultado[ubicacion] = {
                prec: 0,
                tamax: -Infinity,
                tamin: Infinity,
                sumaTa: 0,
                contadorTa: 0,
                ubi: item.ubi,
                lat: item.lat,
                lon: item.lon
            };
        }

        // Sumar el valor de prec
        resultado[ubicacion].prec += item.prec;

        // Encontrar el máximo de tamax
        if (item.tamax > resultado[ubicacion].tamax) {
            resultado[ubicacion].tamax = item.tamax;
        }

        // Encontrar el mínimo de tamin
        if (item.tamin < resultado[ubicacion].tamin) {
            resultado[ubicacion].tamin = item.tamin;
        }

        // Sumar el valor de ta y contar el número de elementos para el promedio
        resultado[ubicacion].sumaTa += item.ta;
        resultado[ubicacion].contadorTa++;


    });
    let aux = Array(resultado.length);
    let i = 0;
    // Calcular el promedio de ta para cada ubicación
    for (let ubi in resultado) {
        resultado[ubi].tavg = Math.floor(10 * (resultado[ubi].sumaTa / resultado[ubi].contadorTa)) / 10;
        aux[i++] = resultado[ubi];
    }


    // Devolver el objeto con los resultados
    return aux;
}

/**
 *
 * @param {Array} data
 * @param String tablaHtmlId
 */
function poblarTabla(data,tablaHtmlId) {
    // Obtener el elemento de la tabla en el HTML
    const tabla = document.getElementById(tablaHtmlId);

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

    data.forEach(item => {
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

/**
 *
 * @param {Date[]} dateArray
 */
function agregarDesplegable(dateArray) {
    //alert(dateArray);
    // Crear el elemento <select>
    let select = document.getElementById('desplegable');//document.createElement('select');

    // Crear opciones para el desplegable
    dateArray.forEach(e => {
        let option1 = document.createElement('option');
        option1.value = e;
        option1.text = toDateHourString(e);
        select.appendChild(option1);
    });

    // Obtener el objeto con id 'sidepane'
    //let sidepane = document.getElementById('sidebar');

    // Añadir el <select> al innerHTML del objeto con id 'sidepane'
    //sidepane.innerHTML = ''; // Limpiar el contenido anterior (opcional)
    //sidepane.appendChild(select);
}

/**
 *
 * @returns
 */
function getSelectedDate() {
    let select = document.getElementById('desplegable');
    return new Date(select.options[select.selectedIndex].value);
}
function setMarkers(datosMarkers) {
    if (datosMarkers.length == 0)
        refreshData();

    if (markersOn) {
        markerGroup.clearLayers();
        markersOn = false;
        document.getElementById("btn_markers").innerHTML = "Add Markers to Map"
    }
    else {
        let markerRenderer = L.canvas({ padding: 0.5 });
        datosMarkers//.filter(d => d.fint.getTime() === maxDate.getTime())
            .forEach(d => {
                L.circleMarker([d.lat, d.lon], {
                    // pane: 'markersPane',
                    renderer: markerRenderer,
                    radius: 5
                }).addTo(markerGroup).bindPopup(
                    '<b> Ubicación: ' + d.ubi + "</b>" +
                    //"<br>Hora: " + toDateHourString(d.fint) +
                    "<br>Precipitación: " + d.prec + " mm" +
                    "<br>Tª min: " + d.tamin + " ºC" +
                    "<br>Tª max: " + d.tamax + " ºC" +
                    "<br>Tª media: " + d.tavg + " ºC"
                );
            });
        //markerGroup.eachLayer(l => l.bringToFront());
        markersOn = true;
        document.getElementById("btn_markers").innerHTML = "Remove Markers"
    }
}

//TODO añadir pestaña con gráfica que muestre valores de una sola estación ¿La seleccionada en un marker?
