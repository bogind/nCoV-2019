let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

let map = L.map('map', {
    center: [26.273714,100.23925],
    zoom: 3,
    layers: [basemap]
})

let CasesByProvince = L.esri.featureLayer({
    url: 'https://services.arcgis.com/5T5nSi527N4F7luB/arcgis/rest/services/Cases_at_province_level/FeatureServer/0',
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
            radius: 3,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
    },
    onEachFeature: function(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.ADM1_NAME && feature.properties.ConfCases ) {
            layer.bindPopup(`<h4>${feature.properties.ADM1_NAME}</h4>\
            Confirmed Cases: ${feature.properties.ConfCases}`);
        }
    }
  }).addTo(map);

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    
    var layer = e.target;

    layer.setStyle({
        weight: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 1
    });

    info.update();
}
function zoomToFeature(e) {
    var layer = e.target;
    layer.openPopup()
    
    //map.fitBounds(e.target.getBounds());
}

function getColor(d) {
return d > 1000 ? '#800026' :
        d > 500  ? '#BD0026' :
        d > 200  ? '#E31A1C' :
        d > 100  ? '#FC4E2A' :
        d > 50   ? '#FD8D3C' :
        d > 20   ? '#FEB24C' :
        d > 10   ? '#FED976' :
                    '#FFEDA0';
}

function polygonStyle(feature) {
    return {
        fillColor: getColor(feature.properties.ConfCases),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function onEachFeature(feature, layer) {
    if (feature.properties) {
        layer.bindPopup(`<h4>${feature.properties.ADM0_NAME}</h4>\
        Confirmed Cases: ${feature.properties.ConfCases}`);
    }
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}


let CasesByCountryPolygons =  L.esri.featureLayer({
    url: 'https://services.arcgis.com/5T5nSi527N4F7luB/ArcGIS/rest/services/Cases_by_country_Plg/FeatureServer/0',
    style:polygonStyle,
    onEachFeature: onEachFeature
    /*function(feature, layer) {
        if (feature.properties) {
            layer.bindPopup(`${feature.properties.ConfCases}`);
        }
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
        
    }*/
}).addTo(map)


    CasesByProvince.bringToFront()




//##################################33
// Chart Controls
//

L.Control.Chart = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('canvas', 'leaflet-bar');
        container.id = "myChart"
        container.style.backgroundColor = "#f7f7f7"
        container.style.padding = '8'

        L.DomEvent.disableClickPropagation(container);
        
        return container;
    }
})
L.control.chart = function(opts) {
    return new L.Control.Chart(opts);
}

L.Control.ChartToggle = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('i', 'leaflet-bar fa fa-bar-chart');
        
        container.style.backgroundColor = "#f7f7f7"
        container.style.width = '32px'
        container.style.height = '32px'
        container.style.fontSize = '24px'
        container.style.color = 'RGBA(255, 99, 132, 1)'
        container.style.padding = '2'
        container.style.paddingTop = '5'
        container.style.paddingleft = '4'
        

        botleft = document.getElementById("myChart").parentNode
        container.onclick = function(){
            if(botleft.style.display == 'block'){
                botleft.style.display = 'none'
            }else{
                botleft.style.display = 'block'
            }
            
        }
        
        L.DomEvent.disableClickPropagation(container);
        
        return container;
    }
})
L.control.charttoggle = function(opts) {
    return new L.Control.ChartToggle(opts);
}

//##############################
// get historic data
//


historicDataUrl =  "https://services.arcgis.com/5T5nSi527N4F7luB/ArcGIS/rest/services/Historic_adm0_v2/FeatureServer/0/query?where=OBJECTID+%3E0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=false&quantizationParameters=&sqlFormat=none&f=pjson&token="
let historicData
let dates =[]
let CumCase = []
let NewCase = []
let labels = []
let grouped = {};

let myChart
let xhr = new XMLHttpRequest();

xhr.open('GET', historicDataUrl);
xhr.onload = function() {
    if (xhr.status === 200) {
        historicData = JSON.parse(xhr.responseText);
        features =  historicData.features
        for(i = 0; i < features.length; i++){
            features[i].attributes.date = new Date(features[i].attributes.DateOfReport)
            features[i].attributes.dateString = new Date(features[i].attributes.DateOfReport).toLocaleDateString()
            
            if(!grouped[features[i].attributes.dateString]){
                newDate = {"dateString": features[i].attributes.dateString,
                "date": features[i].attributes.date,
                "CumCase": features[i].attributes.CumCase,
                "NewCase": features[i].attributes.NewCase}
                grouped[features[i].attributes.dateString] = newDate
            }else{
                grouped[features[i].attributes.dateString].CumCase += features[i].attributes.CumCase
                grouped[features[i].attributes.dateString].NewCase += features[i].attributes.NewCase
            }

        }
        arr = Object.values(grouped);
        arr.sort((a,b)=>a.date-b.date);
        for(i = 0; i < arr.length; i++){
            dates.push(arr[i].date)
            labels.push(arr[i].dateString)
            CumCase.push(arr[i].CumCase)
            NewCase.push(arr[i].NewCase)
        }
        //CumCase = CumCase.map(x => x.toLocaleString())
        
        var chartControl = L.control.chart({ position: 'bottomleft' }).addTo(map);
        var ctx = document.getElementById('myChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accumulated Cases',
                    borderColor: 'RGBA(255, 99, 132, 1)',
                    backgroundColor: 'RGBA(255, 99, 132, 0.6)',
                    borderWidth: 1,
                    data: CumCase
                }]
            },
            options: {
                title:{
                    display: true,
                    text: `Cases Over Time`
                },
                legend : {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return `${tooltipItem.yLabel.toLocaleString()} Confirmed cases`;
                        }
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            maxTicksLimit: 4,
                            callback: function(value, index, values) {
                                return value.toLocaleString();
                            }
                        }
                    }],
                    xAxes : [{
                      
                        ticks: {
                            maxTicksLimit: 2,
                            callback: function(value, index, values) {
                                return '';
                            }
                        }
                    }]
                }
            }
        });
        //myChart.canvas.parentNode.style.height = '50vh';
        myChart.canvas.parentNode.style.display = 'none'
        myChart.canvas.parentNode.style.width = '90vw';
        var chartToggle = L.control.charttoggle({ position: 'topleft' }).addTo(map);
        

    }
    else {
        alert('Request failed.  Returned status of ' + xhr.status);
    }
};
xhr.send();

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
        : 'Hover over a state');
};

info.addTo(map);


var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);