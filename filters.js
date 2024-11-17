
// *** Gestion des Filtres de Colonnes ***

// Ajouter des écouteurs pour les filtres de colonnes
function addColumnFilterListeners(key) {
    document.querySelectorAll(`#column-filter-${key} .column-filter`).forEach(inputElement => {
        inputElement.addEventListener('input', () => applyColumnFilters(key));
    });
}

// Appliquer les filtres aux colonnes
function applyColumnFilters(key) {
    if (!layersByKey[key]) return;

    // Récupérer les filtres actifs et appliquer les changements
    const filters = Array.from(document.querySelectorAll(`#column-filter-${key} .column-filter`))
        .reduce((acc, input) => {
            const column = input.getAttribute('data-column');
            const value = input.value.trim().toLowerCase();
            if (value) {
                acc[column] = value;
            }
            return acc;
        }, {});

    layersByKey[key].clearLayers();
    fetch(wfsUrls[key])
        .then(response => response.json())
        .then(data => {
            data.features.forEach(feature => {
                if (feature.properties && feature.geometry) {
                    // Vérifier si chaque fonctionnalité correspond aux filtres actifs
                    const matchesFilters = Object.entries(filters).every(([column, value]) =>
                        feature.properties[column] && feature.properties[column].toLowerCase().includes(value)
                    );
                    if (matchesFilters) {
                        const layer = L.geoJSON(feature, {
                            style: () => {
                                // Appliquer un style en fonction du type de géométrie
                                if (feature.geometry.type === 'LineString') {
                                    return transportColors[key] ? { color: transportColors[key], weight: 4 } : {};
                                } else if (feature.geometry.type === 'Point') {
                                    return transportColors[key] ? { color: transportColors[key] } : {};
                                } else {
                                    return {}; // Style par défaut
                                }
                            },
                            onEachFeature: (feature, layer) => {
                                // Créer un tooltip avec les informations pertinentes
                                const tooltipContent = Object.entries(feature.properties)
                                    .filter(([_, value]) => value && value !== 'Non spécifié')
                                    .map(([key, value]) => {
                                        if (key === 'imgUrl') {
                                            return `<b>${key}:</b> <img src="${value}" alt="Image" style="width:100px;"><br>`;
                                        }
                                        return `<b>${key}:</b> ${value}<br>`;
                                    })
                                    .join('');
                                layer.bindTooltip(tooltipContent, { permanent: false, direction: 'top' });
                            }
                        });
                        layersByKey[key].addLayer(layer);
                    }
                }
            });
        });
}