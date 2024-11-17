
// *** Contrôles de Dessin ***

let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Ajouter le contrôle de dessin uniquement si non défini précédemment
if (typeof drawControl === 'undefined') {
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);
}

// Ajouter un contrôle de dessin
if (typeof drawControl === 'undefined') {
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: currentLayer
        },
        draw: {
            polygon: true,
            polyline: true,
            rectangle: true,
            circle: true,
            marker: true
        }
    });
    map.addControl(drawControl);
}

// Ajouter les nouvelles couches dessinées à la couche actuelle
map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    currentLayer.addLayer(layer);
});
