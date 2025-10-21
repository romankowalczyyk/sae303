// Initialisation de la carte centrée sur Metz
const map = L.map('map').setView([49.1193, 6.1757], 7);

// Ajout du fond de carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Icône personnalisée pour les destinations (couleur SNCF)
const purpleIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="
        background: #88256F; 
        width: 30px; 
        height: 30px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 8px rgba(136, 37, 111, 0.5);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Icône spéciale pour Metz (point de départ)
const metzIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="
        background: #88256F; 
        width: 45px; 
        height: 45px; 
        border-radius: 50%; 
        border: 4px solid white; 
        box-shadow: 0 3px 12px rgba(136, 37, 111, 0.6); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-weight: bold; 
        font-size: 24px;
    ">🏠</div>`,
    iconSize: [45, 45],
    iconAnchor: [22.5, 22.5]
});

// Marqueur pour Metz (point de départ)
const metzMarker = L.marker([49.1193, 6.1757], { icon: metzIcon }).addTo(map);
metzMarker.bindPopup(`
    <div style="text-align: center;">
        <strong style="color: #88256F; font-size: 1.2em;">Metz</strong><br>
        <span style="color: #53565A;">Point de départ</span>
    </div>
`);

// Liste des destinations avec coordonnées
const destinations = [
    { 
        name: 'Paris', 
        coords: [48.8566, 2.3522], 
        time: '1h25',
        description: 'Capitale française'
    },
    { 
        name: 'Strasbourg', 
        coords: [48.5734, 7.7521], 
        time: '1h35',
        description: 'Capitale européenne'
    },
    { 
        name: 'Luxembourg', 
        coords: [49.6116, 6.1319], 
        time: '50min',
        description: 'Grand-Duché'
    },
    { 
        name: 'Nancy', 
        coords: [48.6921, 6.1844], 
        time: '35min',
        description: 'Art Nouveau'
    },
    { 
        name: 'Reims', 
        coords: [49.2583, 4.0317], 
        time: '40min',
        description: 'Cité des Sacres'
    },
    { 
        name: 'Colmar', 
        coords: [48.0779, 7.3580], 
        time: '2h10',
        description: 'Alsace authentique'
    }
];

// Ajout des marqueurs pour chaque destination
destinations.forEach(dest => {
    // Créer le marqueur
    const marker = L.marker(dest.coords, { icon: purpleIcon }).addTo(map);
    
    // Popup avec informations
    marker.bindPopup(`
        <div style="text-align: center; min-width: 150px;">
            <strong style="color: #88256F; font-size: 1.2em;">${dest.name}</strong><br>
            <span style="color: #53565A;">${dest.description}</span><br>
            <span style="background: #88256F; color: white; padding: 5px 10px; border-radius: 15px; display: inline-block; margin-top: 8px;">
                🚄 ${dest.time} depuis Metz
            </span>
        </div>
    `);
    
    // Ligne de connexion vers Metz (couleur SNCF)
    L.polyline(
        [[49.1193, 6.1757], dest.coords], 
        {
            color: '#88256F',
            weight: 3,
            opacity: 0.6,
            dashArray: '8, 12',
            lineJoin: 'round'
        }
    ).addTo(map);
});

// Fonction de filtrage par temps de trajet
function filterTime(filter) {
    const cards = document.querySelectorAll('.destination-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    // Gérer l'état actif des boutons
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filtrer les cartes
    cards.forEach(card => {
        const time = parseInt(card.dataset.time);
        let shouldShow = false;
        
        switch(filter) {
            case 'all':
                shouldShow = true;
                break;
            case '2h':
                shouldShow = time <= 120;
                break;
            case '3h':
                shouldShow = time <= 180;
                break;
            case '4h':
                shouldShow = time <= 240;
                break;
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            // Animation d'apparition
            card.style.animation = 'fadeIn 0.5s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// Animation CSS pour les cartes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Animation au scroll pour les cartes de destination
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observer toutes les cartes
document.querySelectorAll('.destination-card').forEach(card => {
    observer.observe(card);
});

// Animation pour les stats au chargement
window.addEventListener('load', () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        let currentValue = 0;
        const increment = finalValue.includes('+') ? 1 : 1;
        const duration = 2000;
        const steps = 50;
        const stepDuration = duration / steps;
        
        const counter = setInterval(() => {
            if (currentValue < parseInt(finalValue)) {
                currentValue += increment;
                stat.textContent = currentValue + (finalValue.includes('+') ? '+' : finalValue.includes('%') ? '%' : '');
            } else {
                stat.textContent = finalValue;
                clearInterval(counter);
            }
        }, stepDuration);
    });
});