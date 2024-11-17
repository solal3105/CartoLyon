// *** Initialisation des Conteneurs et Filtres ***

// Fonction utilitaire pour créer un conteneur s'il n'existe pas 
function createContainerIfNotExists(id, className) {
    let container = document.getElementById(id);
    if (!container) {
        container = document.createElement('div');
        container.id = id;
        container.classList.add(className);
        document.body.appendChild(container);
    }
    return container;
}

// Créer dynamiquement des conteneurs pour les filtres
let filtersContainer = createContainerIfNotExists('filters', 'filters-container');

// *** Gestion des Filtres ***

// Créer les filtres et ajouter des écouteurs d'événements
function createFilterForLayer(key) {
    const filterHtml = `
        <div class="filter-section" id="filter-section-${key}">
            <div style="display:flex;justify-content: space-between;">
                <div style="display: flex;">
                    <input type="checkbox" id="toggle_${key}" class="layer-toggle">
                    <label for="toggle_${key}">${getLayerLabel(key)}</label>
                </div>
                <img src="img/caret-down.svg" id="toggle-column-filter-${key}" class="toggle-column-filter-btn" ></img>
            </div>
            <div class="column-filter-section" id="column-filter-${key}" style="display: none;"></div>
        </div>
    `;
    filtersContainer.insertAdjacentHTML('beforeend', filterHtml);
    document.getElementById(`toggle_${key}`).addEventListener('change', (event) => handleLayerToggle(key, event.target.checked));
    document.getElementById(`toggle-column-filter-${key}`).addEventListener('click', () => toggleColumnFilterVisibility(key));
}

function getLayerLabel(key) {
    switch (key.toLowerCase()) {
        case 'ligne_1': return 'Voie lyonnaise 1';
        case 'ligne_2': return 'Voie lyonnaise 2';
        case 'ligne_3': return 'Voie lyonnaise 3';
        case 'ligne_4': return 'Voie lyonnaise 4';
        case 'ligne_5': return 'Voie lyonnaise 5';
        case 'ligne_6': return 'Voie lyonnaise 6';
        case 'ligne_7': return 'Voie lyonnaise 7';
        case 'ligne_8': return 'Voie lyonnaise 8';
        case 'ligne_9': return 'Voie lyonnaise 9';
        case 'ligne_10': return 'Voie lyonnaise 10';
        case 'ligne_11': return 'Voie lyonnaise 11';
        case 'ligne_12': return 'Voie lyonnaise 12';
        case 'reseau_projete_site_propre': return 'Réseau projeté en site propre';
        case 'bus': return 'Réseau de bus';
        case 'metrofuniculaire': return 'Métro et Funiculaire';
        case 'tramway': return 'Réseau de tramway';
        case 'travaux': return 'Zones de travaux';
        case 'territoire_qpv': return 'Quartiers prioritaires(QPV)';
        case 'plan_velo': return 'Plan vélo';
        case 'amenagement_cyclable': return 'Aménagements cyclables';
        case 'emplacement_reserve': return 'Emplacements réservé';
        default: return key.toLowerCase();
    }
}

// Fonction pour afficher ou cacher les filtres de colonnes
function toggleColumnFilterVisibility(key) {
    const columnFilterContainer = document.getElementById(`column-filter-${key}`);
    const toggleColumnFilterButton = document.getElementById(`toggle-column-filter-${key}`);
    if (columnFilterContainer.style.display === 'none' || columnFilterContainer.style.display === '') {
        columnFilterContainer.style.display = 'block';
        toggleColumnFilterButton.src = 'img/caret-up.svg';
    } else {
        columnFilterContainer.style.display = 'none';
        toggleColumnFilterButton.src = 'img/caret-down.svg';
    }
}

// *** Gestion de l'Affichage des Couches ***

function handleLayerToggle(key, isChecked) {
    const columnFilterContainer = document.getElementById(`column-filter-${key}`);
    if (isChecked) {
        if (layersByKey[key] && layersByKey[key].getLayers().length > 0) {
            currentLayer.addLayer(layersByKey[key]);
            columnFilterContainer.style.display = 'block';
        } else {
            applyColumnFilters(key);
            columnFilterContainer.style.display = 'block';
        }
    } else {
        currentLayer.removeLayer(layersByKey[key]);
        columnFilterContainer.style.display = 'none';
    }
}

// *** Chargement et Affichage des Données ***

// Fonction pour charger et afficher les données en parallèle de manière robuste
async function loadAndDisplayDataInParallel() {
    const MAX_ATTEMPTS = 3;

    // Fonction utilitaire pour appliquer un délai
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Fonction utilitaire pour effectuer une requête avec un timeout
    const fetchWithTimeout = async (url, timeout = 10000) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
    };

    // Charger les données de manière asynchrone avec gestion des erreurs
    await Promise.all(Object.entries(wfsUrls).map(async ([key, url]) => {
        let attempts = 0;
        let success = false;

        while (attempts < MAX_ATTEMPTS && !success) {
            attempts++;
            try {
                const response = await fetchWithTimeout(url, 10000);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP! Statut: ${response.status}`);
                }
                const data = await response.json();

                // Valider les données (par exemple, vérifier s'il y a un contenu attendu)
                if (!data || typeof data !== 'object') {
                    throw new Error('Les données reçues sont invalides');
                }

                handleDataForLayer(key, data);
                success = true; // Si tout s'est bien passé, indiquer le succès
            } catch (error) {
                console.error(`Erreur lors du chargement de la couche ${key}: ${error.message}`);
                if (attempts < MAX_ATTEMPTS) {
                    console.log(`Tentative ${attempts} de rechargement pour la couche ${key}`);
                    await delay(2000 * attempts); // Appliquer un délai croissant avant de réessayer
                } else {
                    console.error(`Échec du chargement des données pour la couche ${key} après ${MAX_ATTEMPTS} tentatives`);
                    handleDataForLayer(key, null); // Gérer les erreurs avec des données nulles après 3 tentatives
                }
            }
        }
    }));
}

// Fonction principale 
function handleDataForLayer(key, data) {
    if (data && data.features && data.features.length > 0) {
        initializeLayerIfNeeded(key);
        createColumnFilters(key, data);
        addFeaturesToLayer(key, data);
    } else {
        initializeLayerIfNeeded(key);
    }
}

// Initialisation du Layer s'il n'existe pas encore
function initializeLayerIfNeeded(key) {
    if (!layersByKey[key]) {
        layersByKey[key] = L.layerGroup();
        createFilterForLayer(key);
    }
}

// Création des filtres de colonnes pour un Layer donné
function createColumnFilters(key, data) {
    const columnTitles = Object.keys(data.features[0].properties);
    const columnFilterHtml = columnTitles.map(title => createFilterForColumn(key, title, data)).join('');
    const columnFilterContainer = document.getElementById(`column-filter-${key}`);
    columnFilterContainer.innerHTML = columnFilterHtml;
    addColumnFilterListeners(key);
}

// Création d'un filtre de colonne spécifique
function createFilterForColumn(key, title, data) {
    const type = typeof data.features[0].properties[title];
    if (type === 'object') {
        return '';
    } else if (type === 'string') {
        return createStringFilter(key, title, data);
    } else {
        return createDefaultFilter(key, title, type);
    }
}

// Création d'un filtre pour les colonnes de type string
function createStringFilter(key, title, data) {
    const uniqueValues = [...new Set(data.features.map(f => f.properties[title]))].filter(v => v && v !== 'Non spécifié');
    if (uniqueValues.length === 1 || uniqueValues.length > 15) {
        return `
            <div style="display: none;">
                <select id="filter_${key}_${title}" class="column-filter" data-key="${key}" data-column="${title}">
                    ${uniqueValues.length === 1 ? `<option value="${uniqueValues[0].toLowerCase()}">${uniqueValues[0]}</option>` : ''}
                </select>
            </div>
        `;
    } else {
        return `
            <div>
                <select id="filter_${key}_${title}" class="column-filter" data-key="${key}" data-column="${title}">
                    <option value="">➡️ ${title}</option>
                    ${uniqueValues.map(value => `<option value="${value.toLowerCase()}">${value}</option>`).join('')}
                </select>
            </div>
        `;
    }
}

// Création d'un filtre par défaut pour les autres types de colonnes
function createDefaultFilter(key, title, type) {
    return `
        <div style="display: none;">
            <label for="filter_${key}_${title}">${title} (${type})</label>
            <input type="text" id="filter_${key}_${title}" class="column-filter" data-key="${key}" data-column="${title}">
        </div>
    `;
}

// Ajout des fonctionnalités au Layer à partir des features du GeoJSON
function addFeaturesToLayer(key, data) {
    data.features.forEach(feature => {
        if (feature.properties && feature.geometry) {
            const layer = L.geoJSON(feature, {
                style: () => getFeatureStyle(feature, key),
                onEachFeature: (feature, layer) => bindFeatureTooltip(feature, layer)
            });
            layersByKey[key].addLayer(layer);
        }
    });
}

// Définir le style de chaque feature en fonction du type de géométrie
function getFeatureStyle(feature, key) {

    // Vérification de la validité de la géométrie
    if (!feature.geometry || !feature.geometry.type) {
        console.error('Feature is missing geometry or geometry type.');
        return {};
    }

    // Style par défaut si la clé de couleur n'est pas trouvée
    const defaultStyle = {
        color: '#888', // Couleur par défaut
        weight: 2, // Largeur de ligne par défaut
        fillColor: '#888', // Remplissage par défaut pour les Polygons
        fillOpacity: 0.3, // Opacité de remplissage
        radius: 6, // Rayon par défaut pour les points
    };

    // Vérification de la disponibilité de la couleur personnalisée
    const styleColor = transportColors[key] || defaultStyle.color;

    // Gestion de tous les cas de géométrie possibles
    switch (feature.geometry.type) {
        case 'Point':
        case 'MultiPoint':
            return {
                color: styleColor,
                fillColor: styleColor,
                fillOpacity: 0.8,
                radius: 6, // Taille du point
            };
        case 'LineString':
        case 'MultiLineString':
            return {
                color: styleColor,
                weight: 4, // Largeur de la ligne
                opacity: 0.9,
            };
        case 'Polygon':
        case 'MultiPolygon':
            return {
                color: styleColor,
                fillColor: styleColor,
                fillOpacity: 0.4,
                weight: 2,
                opacity: 0.8,
            };
        default:
            console.warn('Unsupported geometry type:', feature.geometry.type);
            return defaultStyle; // Style par défaut pour les géométries non supportées
    }
}


// Lier un tooltip à chaque feature pour l'affichage des propriétés
function bindFeatureTooltip(feature, layer) {
    const tooltipContent = Object.entries(feature.properties)
        .filter(([_, value]) => value && value !== 'Non spécifié')
        .map(([key, value]) => {
            if (key === 'imgUrl') {
                return `<b>${key}:</b> <img src="${value}" alt="Image" style="width:100px;"><br>`;
            }
            return `<b>${key}:</b> ${value}<br>`;
        })
        .join('');
    layer.bindTooltip(tooltipContent, { permanent: false, direction: 'auto', sticky: true });
}

// *** Création des Filtres et Affichage des Données ***
loadAndDisplayDataInParallel();
