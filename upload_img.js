// *** Gestion de l'Upload d'Image sur Clic Droit de la Carte et Upload vers Supabase ***

const supabaseUrl = "https://wqqsuybmyqemhojsamgq.supabase.co";  // Remplacez par votre URL Supabase
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcXN1eWJteXFlbWhvanNhbWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAxNDYzMDQsImV4cCI6MjA0NTcyMjMwNH0.OpsuMB9GfVip2BjlrERFA_CpCOLsjNGn-ifhqwiqLl0";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Fonction pour gérer le clic droit sur la carte et lancer l'upload de l'image
function handleMapRightClick(e) {
    const latlng = e.latlng;
    const inputElement = createFileInput(latlng);
    document.body.appendChild(inputElement);
    inputElement.click();
    setTimeout(() => removeInputElement(inputElement), 1000);
}

// Fonction pour créer l'input de fichier
function createFileInput(latlng) {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = "image/*";
    inputElement.style.display = "none";

    inputElement.addEventListener("change", (event) => handleFileSelect(event, latlng));
    return inputElement;
}

// Fonction pour gérer la sélection de fichier
function handleFileSelect(event, latlng) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const marker = addMarkerToCluster(latlng, imageUrl, file.name);
            uploadImageToSupabase(file, latlng, marker);
        };
        reader.readAsDataURL(file);
    }
}


// Fonction pour ajouter un marqueur au groupe de clusters avec un tooltip et popup
function addMarker(latlng, imageUrl, imagePath) {
    const marker = L.marker(latlng); // Crée un marqueur mais ne l'ajoute pas directement à la carte
    configureMarker(marker, imageUrl, latlng, imagePath);
    markers.addLayer(marker); // Ajoute le marqueur au groupe de clusters (markers), pas directement à la carte
    return marker;
}


// Fonction utilitaire pour configurer le tooltip et popup d'un marqueur
function configureMarker(marker, imageUrl, latlng, imagePath) {
    const tooltipContent = createTooltipContent(imageUrl);
    const popupContent = createPopupContent(imageUrl, latlng, marker._leaflet_id, imagePath);

    marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
        offset: L.point(-15, 0)
    });

    marker.on('click', () => {
        marker.bindPopup(popupContent).openPopup();
    });

    marker.on('popupclose', () => {
        marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: "top",
            offset: L.point(-15, 0)
        });
    });

    marker.on('mouseover', () => marker.openTooltip());
    marker.on('mouseout', () => {
        if (!marker.isPopupOpen()) {
            marker.closeTooltip();
        }
    });
}

// Fonction pour créer le contenu du tooltip
function createTooltipContent(imageUrl) {
    return `
        <div style="text-align: center;">
            <img src="${imageUrl}" alt="Image" style="max-width:40vw;max-height:40vh;">
        </div>
    `;
}

// Fonction pour créer le contenu du popup
function createPopupContent(imageUrl, latlng, markerId, imagePath) {
    return `
        <div style="text-align: center;">
            <img src="${imageUrl}" alt="Image" style="width:100px;"><br>
            <button onclick="initiateRepositioning(${latlng.lat}, ${latlng.lng}, ${markerId}, '${imagePath}')">Repositionner</button>
            <button onclick="deleteImage('${imagePath}', ${latlng.lat}, ${latlng.lng}, ${markerId})">Supprimer</button>
            <button onclick="downloadImage('${imageUrl}')">Télécharger</button>
        </div>
    `;
}

// Fonction pour uploader l'image vers Supabase
function uploadImageToSupabase(file, latlng, marker) {
    const sanitizedFileName = encodeURIComponent(file.name.replace(/[^a-zA-Z0-9.]/g, '_'));
    const filePath = `uploads/${Date.now()}_${sanitizedFileName}`;

    supabase.storage.from("image").upload(filePath, file)
        .then(({ data, error }) => {
            if (error) {
                console.error("Erreur lors de l'upload:", error.message);
            } else {
                saveImageMetadata(latlng, filePath, marker);
            }
        }).catch(err => {
            console.error("Erreur inattendue lors de l'upload de l'image:", err);
        });
}

// Fonction pour enregistrer les métadonnées de l'image
function saveImageMetadata(latlng, filePath, marker) {
    supabase.from("image_metadata").insert([
        {
            latitude: latlng.lat,
            longitude: latlng.lng,
            image_path: filePath
        }
    ]).then(({ data, error }) => {
        if (error) {
            console.error("Erreur lors de l'enregistrement des coordonnées:", error.message);
        } else {
            if (marker) {
                const publicURL = `${supabaseUrl}/storage/v1/object/public/image/${filePath}`;
                configureMarker(marker, publicURL, latlng, filePath);
            }
        }
    }).catch(err => {
        console.error("Erreur inattendue lors de l'insertion des métadonnées:", err);
    });
}

// Fonction pour visualiser les images à partir des coordonnées GPS et du lien vers le bucket
function visualiserImages() {
    supabase.from("image_metadata").select("*").then(({ data, error }) => {
        if (error) {
            console.error("Erreur lors de la récupération des métadonnées des images:", error.message);
            return;
        }
        if (data.length === 0) {
            return;
        }

        data.forEach(image => {
            const { latitude, longitude, image_path } = image;
            const publicURL = `${supabaseUrl}/storage/v1/object/public/image/${image_path}`;
            addMarker([latitude, longitude], publicURL, image_path);
        });
    }).catch(err => {
        console.error("Erreur inattendue lors de la récupération des métadonnées des images:", err);
    });
}

// Fonction pour supprimer une image et ses métadonnées
function deleteImage(imagePath, lat, lng, markerId) {
    supabase.storage.from("image").remove([imagePath])
        .then(({ data, error }) => {
            if (error) {
                console.error("Erreur lors de la suppression de l'image:", error.message);
            } else {
                console.log("Image supprimée avec succès");
                removeMarker(lat, lng, markerId);
                deleteImageMetadata(imagePath);
            }
        }).catch(err => {
            console.error("Erreur inattendue lors de la suppression de l'image:", err);
        });
}

// Fonction pour supprimer les métadonnées de l'image
function deleteImageMetadata(imagePath) {
    supabase.from("image_metadata").delete()
        .eq("image_path", imagePath)
        .then(({ data, error }) => {
            if (error) {
                console.error("Erreur lors de la suppression des métadonnées de l'image:", error.message);
            } else {
                console.log("Métadonnées de l'image supprimées avec succès");
            }
        }).catch(err => {
            console.error("Erreur inattendue lors de la suppression des métadonnées de l'image:", err);
        });
}

// Fonction pour initier le repositionnement d'une image
function initiateRepositioning(lat, lng, markerId, imagePath) {
    map.once('click', function (e) {
        const newLatLng = e.latlng;
        repositionImage(newLatLng, markerId, imagePath);
    });
}

// Fonction pour repositionner une image
function repositionImage(newLatLng, markerId, imagePath) {
    supabase.from("image_metadata").update({
        latitude: newLatLng.lat,
        longitude: newLatLng.lng
    }).eq("image_path", imagePath)
    .then(({ data, error }) => {
        if (error) {
            console.error("Erreur lors de la mise à jour des coordonnées de l'image:", error.message);
        } else {
            console.log("Image repositionnée avec succès");
            const marker = map._layers[markerId];
            if (marker) {
                const publicURL = `${supabaseUrl}/storage/v1/object/public/image/${imagePath}`;
                marker.setLatLng(newLatLng);
                configureMarker(marker, publicURL, newLatLng, imagePath);
            }
        }
    }).catch(err => {
        console.error("Erreur inattendue lors de la mise à jour des coordonnées de l'image:", err);
    });
}

// Fonction pour télécharger une image
function downloadImage(url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Fonction pour supprimer un marqueur de la carte
function removeMarker(lat, lng, markerId) {
    const marker = map._layers[markerId];
    if (marker) {
        map.removeLayer(marker);
    }
}

// Appeler la fonction pour visualiser les images lors du chargement de la page
window.onload = visualiserImages;

// Attacher l'événement de clic droit sur
map.on("contextmenu", handleMapRightClick);



// Fonction pour ajouter un marqueur au cluster de marqueurs
function addMarkerToCluster(latlng, imageUrl, imagePath) {
    const marker = L.marker(latlng);
    configureMarker(marker, imageUrl, latlng, imagePath);
    markers.addLayer(marker); // Ajoute le marqueur au groupe de clusters
    return marker;
}

// Création du groupe de clusters
var markers = L.markerClusterGroup();

// Ajouter le groupe de clusters à la carte
map.addLayer(markers);