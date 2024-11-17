// Initialiser la carte centrée sur Lyon
let map = L.map('map').setView([45.75, 4.85], 13);

// Fonction pour ajouter des styles de carte personnalisés
function addCustomTileLayer(styleUrl, options) {
    // Crée et retourne une couche de tuiles personnalisée
    return L.tileLayer(styleUrl, options);
}

// Exemples de styles de cartes à utiliser
const mapStyles = {
    openStreetMap: {
        // URL et options pour la carte OpenStreetMap
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    cartoDBPositron: {
        // URL et options pour la carte CartoDB Positron (noir et blanc)
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        options: {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    },
};

// Créer les couches de tuiles mais ne pas les ajouter directement à la carte
let openStreetMapLayer = addCustomTileLayer(mapStyles.openStreetMap.url, mapStyles.openStreetMap.options);
let cartoDBPositronLayer = addCustomTileLayer(mapStyles.cartoDBPositron.url, mapStyles.cartoDBPositron.options);

// Ajouter initialement une seule couche de base (par exemple OpenStreetMap)
openStreetMapLayer.addTo(map);

// Ajouter le sélecteur de styles de carte en haut à droite
let baseMaps = {
    "OpenStreetMap": openStreetMapLayer,
    "CartoDB Positron": cartoDBPositronLayer
};
L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

// Ajouter le style par défaut de la carte Leaflet
L.control.scale().addTo(map); // Ajouter une échelle pour montrer la distance

// Supprimer le contrôle de zoom personnalisé qui causait des conflits avec les autres contrôles
// L.control.zoom({
//     position: 'bottomright' // Positionner le contrôle de zoom en bas à droite pour éviter le conflit
// }).addTo(map);

// URL GeoJSON corrigée pour obtenir les lignes de bus, métro, funiculaire, tramway, et travaux
const wfsUrls = {
    ligne_1: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-1.json',
    ligne_2: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-2.json',
    ligne_3: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-3.json',
    ligne_4: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-4.json',
    ligne_5: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-5.json',
    ligne_6: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-6.json',
    ligne_7: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-7.json',
    ligne_8: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-8.json',
    ligne_9: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-9.json',
    ligne_10: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-10.json',
    ligne_11: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-11.json',
    ligne_12: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/ligne-12.json',
    Reseau_projete_site_propre: 'https://wqqsuybmyqemhojsamgq.supabase.co/storage/v1/object/public/image/Reseau_projete_en_site_propre.geojson',
    bus: 'https://data.grandlyon.com/geoserver/sytral/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=sytral:tcl_sytral.tcllignebus_2_0_0&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    metroFuniculaire: 'https://data.grandlyon.com/geoserver/sytral/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=sytral:tcl_sytral.tcllignemf_2_0_0&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    tramway: 'https://data.grandlyon.com/geoserver/sytral/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=sytral:tcl_sytral.tcllignetram_2_0_0&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    travaux: 'https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:lyv_lyvia.lyvchantier&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    territoire_QPV: 'https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:ter_territoire.qpv_2024&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    plan_velo: 'https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:pvo_patrimoine_voirie.pvoplanmodesdoux&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    amenagement_cyclable: 'https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:pvo_patrimoine_voirie.pvoamenagementcyclable&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid',
    emplacement_reserve: 'https://data.grandlyon.com/geoserver/metropole-de-lyon/ows?SERVICE=WFS&VERSION=2.0.0&request=GetFeature&typename=metropole-de-lyon:pos_opposable.posreserv&outputFormat=application/json&SRSNAME=EPSG:4171&startIndex=0&sortBy=gid'
};

// Définir les couleurs pour chaque type de données importées avec des nuances de bleu foncé
const transportColors = {
    ligne_1: '#71A563',          
    ligne_2: '#A0533C',          
    ligne_3: '#4B7A65',          
    ligne_4: '#D08D5D',          
    ligne_5: '#A67691',          
    ligne_6: '#425F80',          
    ligne_7: '#67ABC6',          
    ligne_8: '#7B6E95',          
    ligne_9: '#E0AE60',          
    ligne_10: '#978B54',         
    ligne_11: '#4DADC9',         
    ligne_12: '#D4ADB7',         
    bus: '#0284C7',              
    metroFuniculaire: '#0284C7', 
    tramway: '#0284C7',          
    travaux: '#0284C7',          
    territoire_QPV: '#0284C7',   
    plan_velo: '#0D9488',        
    amenagement_cyclable: '#0D9488',
    emplacement_reserve: '#0284C7'  
};



// Variables pour stocker les couches par type
let layersByKey = {}; // Stocke les différentes couches ajoutées à la carte
let currentLayer = L.featureGroup().addTo(map); // Groupe de fonctionnalités pour l'affichage sur la carte

