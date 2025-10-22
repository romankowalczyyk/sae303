// ---------------------------
// 1️⃣ Initialisation de la carte
// ---------------------------
const map = L.map('map').setView([49.1193, 6.1757], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// ---------------------------
// 2️⃣ Icônes personnalisées
// ---------------------------
const purpleIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: #0c131f; width:20px; height:20px; border-radius:50%; border:3px solid white;"></div>`,
    iconSize: [30,30],
    iconAnchor: [15,15]
});

const metzIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background:#88256F; width:45px; height:45px; border-radius:50%; border:4px solid white; display:flex; align-items:center; justify-content:center; color:white;">🏠</div>`,
    iconSize: [45,45],
    iconAnchor: [22.5,22.5]
});

// ---------------------------
// 3️⃣ Marqueur Metz (toujours visible)
// ---------------------------
const metzMarker = L.marker([49.1193, 6.1757], {icon: metzIcon})
 .addTo(map)
 .bindPopup(`
    <div style="text-align:center;">
        <strong style="color:#88256F;">Metz (Point de départ)</strong><br>
        Jeu de piste le Palais, De jardins en musique...
    </div>
 `);

// ---------------------------
// 4️⃣ Stockage global
// ---------------------------
const allDestinations = [];

// ---------------------------
// 5️⃣ Fonction SUPER ROBUSTE pour extraire les minutes
// ---------------------------
function extractMinutes(timeStr) {
    console.log(`⏱️ Conversion de "${timeStr}"`);
    
    let totalMinutes = 0;
    
    // Chercher les heures (1 h, 1h, 1 H, etc.)
    const hoursMatch = timeStr.match(/(\d+)\s*h/i);
    if (hoursMatch) {
        const hours = parseInt(hoursMatch[1]);
        totalMinutes += hours * 60;
        console.log(`  → ${hours} heure(s) = ${hours * 60} min`);
    }
    
    // Chercher les minutes (35 min, 35min, etc.)
    const minutesMatch = timeStr.match(/(\d+)\s*min/i);
    if (minutesMatch) {
        const minutes = parseInt(minutesMatch[1]);
        totalMinutes += minutes;
        console.log(`  → ${minutes} minute(s)`);
    }
    
    console.log(`  ✅ Total = ${totalMinutes} minutes`);
    return totalMinutes;
}

// ---------------------------
// 6️⃣ Chargement des données JSON
// ---------------------------
console.log('🔄 Chargement du fichier JSON...');

fetch('data/csvjson.json')
.then(res => {
    if (!res.ok) throw new Error('Fichier JSON introuvable');
    return res.json();
})
.then(data => {
    console.log(`✅ ${data.length} destinations trouvées dans le JSON`);
    console.log('📊 Première destination :', data[0]);
    
    // Traiter chaque destination
    data.forEach((dest, index) => {
        const coords = dest.Coordonnees.split(',').map(c => parseFloat(c.trim()));
        const timeMinutes = extractMinutes(dest.TempsDepuisMetz);
        
        console.log(`\n🏙️ ${index + 1}. ${dest.Ville} → ${timeMinutes} minutes`);
        
        // Créer le marqueur
        const marker = L.marker(coords, {icon: purpleIcon});
        marker.bindPopup(`
            <div style="text-align:center; min-width:200px;">
                <strong style="color:#88256F;">${dest.Ville}</strong><br>
                <span style="color:#53565A;">${dest.Site_touristique || 'Destination touristique'}</span><br>
                <span style="background:#88256F; color:white; padding:5px 10px; border-radius:15px; display:inline-block; margin-top:5px;">
                    🚄 ${dest.TempsDepuisMetz} depuis Metz
                </span>
            </div>
        `);
        
        // Créer la ligne vers Metz
        const polyline = L.polyline([[49.1193, 6.1757], coords], {
            color: '#0c131f',
            weight: 3,
            opacity: 0.6,
            dashArray: '8,12',
            lineJoin: 'round'
        });
        
        // Stocker tout ensemble
        allDestinations.push({
            ville: dest.Ville,
            timeMinutes: timeMinutes,
            timeString: dest.TempsDepuisMetz,
            marker: marker,
            polyline: polyline,
            coords: coords
        });
    });
    
    console.log(`\n✅ ${allDestinations.length} destinations chargées avec succès !`);
    
    // Afficher toutes les destinations au départ
    showDestinations('all');
    
    // Activer les boutons de filtre
    setupFilters();
    
    console.log('✅ Tout est prêt ! Clique sur les boutons pour filtrer.');
})
.catch(err => {
    console.error('❌ ERREUR lors du chargement :', err);
    alert('❌ Impossible de charger les données.\n\nVérifie que le fichier "data/csvjson.json" existe !');
});

// ---------------------------
// 7️⃣ Configuration des boutons de filtre
// ---------------------------
function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    console.log(`🔘 ${buttons.length} boutons de filtre trouvés`);
    
    buttons.forEach((btn, index) => {
        const filterValue = btn.getAttribute('data-filter');
        console.log(`  Bouton ${index + 1}: "${btn.textContent.trim()}" → filtre="${filterValue}"`);
        
        btn.addEventListener('click', function() {
            console.log(`\n🖱️ CLIC sur le bouton : ${filterValue}`);
            
            // Retirer la classe active de tous les boutons
            buttons.forEach(b => b.classList.remove('active'));
            
            // Ajouter au bouton cliqué
            this.classList.add('active');
            
            // Appliquer le filtre
            showDestinations(filterValue);
        });
    });
}

// ---------------------------
// 8️⃣ Affichage des destinations selon le filtre
// ---------------------------
function showDestinations(filter) {
    console.log(`\n🔍 Application du filtre : "${filter}"`);
    
    let maxTime = Infinity;
    
    // Déterminer le temps max selon le filtre
    switch(filter) {
        case '1h':
            maxTime = 60;
            console.log('  → Afficher destinations ≤ 60 minutes');
            break;
        case '1h30':
            maxTime = 90;
            console.log('  → Afficher destinations ≤ 90 minutes');
            break;
        case '2h':
            maxTime = 120;
            console.log('  → Afficher destinations ≤ 120 minutes');
            break;
        case 'all':
        default:
            maxTime = Infinity;
            console.log('  → Afficher TOUTES les destinations');
            break;
    }
    
    // Filtrer et afficher
    const visibleMarkers = [metzMarker];
    let countShown = 0;
    let countHidden = 0;
    
    allDestinations.forEach(dest => {
        const shouldShow = dest.timeMinutes <= maxTime;
        
        if (shouldShow) {
            // Ajouter à la carte
            if (!map.hasLayer(dest.marker)) {
                dest.marker.addTo(map);
            }
            if (!map.hasLayer(dest.polyline)) {
                dest.polyline.addTo(map);
            }
            visibleMarkers.push(dest.marker);
            countShown++;
        } else {
            // Retirer de la carte
            if (map.hasLayer(dest.marker)) {
                map.removeLayer(dest.marker);
            }
            if (map.hasLayer(dest.polyline)) {
                map.removeLayer(dest.polyline);
            }
            countHidden++;
        }
    });
    
    console.log(`✅ Résultat : ${countShown} affichées, ${countHidden} masquées`);
    
    // Ajuster la vue de la carte
    if (visibleMarkers.length > 1) {
        const group = L.featureGroup(visibleMarkers);
        map.fitBounds(group.getBounds(), { 
            padding: [50, 50],
            maxZoom: 10
        });
        console.log('📍 Carte ajustée aux marqueurs visibles');
    } else {
        console.log('📍 Aucune destination à afficher, vue par défaut');
    }
}

// ---------------------------
// 9️⃣ Animation des stats (optionnel)
// ---------------------------
window.addEventListener('load', () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        const numValue = parseInt(finalValue);
        
        if (isNaN(numValue)) return;
        
        let current = 0;
        const duration = 2000;
        const steps = 60;
        const increment = Math.ceil(numValue / steps);
        const stepDuration = duration / steps;
        
        const counter = setInterval(() => {
            current += increment;
            if (current >= numValue) {
                stat.textContent = finalValue;
                clearInterval(counter);
            } else {
                const suffix = finalValue.includes('+') ? '+' : finalValue.includes('%') ? '%' : '';
                stat.textContent = current + suffix;
            }
        }, stepDuration);
    });
});

console.log('🚀 Script chargé, en attente du DOM...');