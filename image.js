// script.js: Script autonome pour ajouter des images sur une carte Leaflet existante avec des options de déplacement, redimensionnement et contrôle via une popup

// Vérifier l'existence de la carte Leaflet 'map'
if (typeof map === 'undefined') {
    console.error("La carte 'map' n'est pas définie. Assurez-vous que la carte est initialisée avant de charger ce script.");
} else {
    
    // Fonction pour ajouter une ou plusieurs images sur la carte avec déplacement et affichage d'une popup au clic
    function addImagesWithPopup(images) {
        images.forEach(image => {
            const { url, bounds } = image;
            if (url && bounds) {
                // Utiliser L.imageOverlay pour ajouter une image sur la carte
                const overlay = L.imageOverlay(url, bounds).addTo(map);
                const element = overlay.getElement();

                if (!element) {
                    console.error("Élément de l'image non trouvé pour l'URL: ", url);
                    return;
                }

                element.style.cursor = 'move';
                element.style.zIndex = '1000';
                element.style.opacity = '0.5'; // Ajouter une transparence de 50%

                // Ajouter la fonctionnalité de déplacement par glisser-déposer
                let isDragging = false;
                let startLatLng;

                element.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    isDragging = true;
                    startLatLng = map.mouseEventToLatLng(e);
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });

                function onMouseMove(e) {
                    if (!isDragging) return;
                    const currentLatLng = map.mouseEventToLatLng(e);
                    const deltaLat = currentLatLng.lat - startLatLng.lat;
                    const deltaLng = currentLatLng.lng - startLatLng.lng;
                    
                    const newBounds = overlay.getBounds();
                    const southWest = newBounds.getSouthWest();
                    const northEast = newBounds.getNorthEast();
                    
                    const newSouthWest = [southWest.lat + deltaLat, southWest.lng + deltaLng];
                    const newNorthEast = [northEast.lat + deltaLat, northEast.lng + deltaLng];
                    
                    overlay.setBounds([newSouthWest, newNorthEast]);
                    startLatLng = currentLatLng;
                }

                function onMouseUp() {
                    isDragging = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }

                // Ajouter un événement de clic pour afficher une popup en plein milieu de l'écran avec des contrôles
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Clic sur l'image pour afficher la popup de contrôle.");
                    
                    // Supprimer la popup précédente si elle existe
                    const existingPopup = document.querySelector('.image-control-popup');
                    if (existingPopup) {
                        existingPopup.remove();
                    }

                    // Créer la popup
                    const popup = document.createElement('div');
                    popup.className = 'image-control-popup';
                    popup.style.position = 'fixed';
                    popup.style.top = '50%';
                    popup.style.left = '50%';
                    popup.style.transform = 'translate(-50%, -50%)';
                    popup.style.background = 'white';
                    popup.style.padding = '20px';
                    popup.style.boxShadow = '0px 0px 15px rgba(0, 0, 0, 0.5)';
                    popup.style.zIndex = '2000';
                    popup.innerHTML = `
                        <h3>Contrôles de l'image</h3>
                        <div class="control-grid-cross">
                            <div>
                                <button id="resize-up">+ Haut</button>
                                <button id="resize-shrink-up">- Haut</button>
                            </div>
                            <div>
                                <button id="resize-left">+ Gauche</button>
                                <button id="resize-shrink-left">- Gauche</button>
                            </div>
                            <div>
                                <button id="resize-right">+ Droite</button>
                                <button id="resize-shrink-right">- Droite</button>
                            </div>
                            <div>
                                <button id="resize-down">+ Bas</button>
                                <button id="resize-shrink-down">- Bas</button>
                            </div>
                        </div>
                        <button id="close-popup">Fermer</button>
                    `;
                    document.body.appendChild(popup);

                    // Ajouter des événements aux boutons de redimensionnement
                    document.getElementById('resize-up').addEventListener('click', () => {
                        resizeOverlay(overlay, 'up', 0.0001);
                    });
                    document.getElementById('resize-down').addEventListener('click', () => {
                        resizeOverlay(overlay, 'down', 0.0001);
                    });
                    document.getElementById('resize-left').addEventListener('click', () => {
                        resizeOverlay(overlay, 'left', 0.0001);
                    });
                    document.getElementById('resize-right').addEventListener('click', () => {
                        resizeOverlay(overlay, 'right', 0.0001);
                    });
                    document.getElementById('resize-shrink-left').addEventListener('click', () => {
                        resizeOverlay(overlay, 'left', -0.0001);
                    });
                    document.getElementById('resize-shrink-right').addEventListener('click', () => {
                        resizeOverlay(overlay, 'right', -0.0001);
                    });
                    document.getElementById('resize-shrink-up').addEventListener('click', () => {
                        resizeOverlay(overlay, 'up', -0.0001);
                    });
                    document.getElementById('resize-shrink-down').addEventListener('click', () => {
                        resizeOverlay(overlay, 'down', -0.0001);
                    });

                    document.getElementById('close-popup').addEventListener('click', () => {
                        popup.remove();
                    });
                });
            } else {
                console.warn('Image ignorée : URL ou limites manquantes', image);
            }
        });
    }

    // Fonction générique pour redimensionner l'image
    function resizeOverlay(overlay, direction, value) {
        let newBounds = overlay.getBounds();
        const southWest = newBounds.getSouthWest();
        const northEast = newBounds.getNorthEast();

        switch (direction) {
            case 'up':
                newBounds = L.latLngBounds([southWest, [northEast.lat + value, northEast.lng]]);
                break;
            case 'down':
                newBounds = L.latLngBounds([[southWest.lat + value, southWest.lng], northEast]);
                break;
            case 'left':
                newBounds = L.latLngBounds([[southWest.lat, southWest.lng + value], northEast]);
                break;
            case 'right':
                newBounds = L.latLngBounds([southWest, [northEast.lat, northEast.lng + value]]);
                break;
        }

        overlay.setBounds(newBounds);
    }

    // Exemple d'images à ajouter
    //const imagesToAdd = [
    //    {
    //        url: 'https://cdn-s-www.leprogres.fr/images/75B99923-E776-4813-A7BF-730967DB91FD/NW_raw/zac-de-villeurbane-la-soie-2-pdf-1487537671.jpg',
    //        bounds: [[45.765201, 4.913017], [45.759228, 4.922042]]
    //    }
    //];

    // Appeler la fonction pour ajouter les images avec options de déplacement et popup de contrôle
    // addImagesWithPopup(imagesToAdd);

    // Réactiver le double-clic pour zoomer uniquement sur la carte, pas sur les images
    map.on('dblclick', function(e) {
        if (!e.originalEvent.target.classList.contains('leaflet-image-layer')) {
            map.zoomIn();
        }
    });
}
