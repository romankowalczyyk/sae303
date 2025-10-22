// ---------------------------
// 1️⃣ Initialisation de la carte
// ---------------------------
const map = L.map('map').setView([49.1193, 6.1757], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// ---------------------------
// 2️⃣ Icônes
// ---------------------------
const purpleIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: rgb(141, 232, 254); width:30px; height:30px; border-radius:50%; border:3px solid white;"></div>`,
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
// 3️⃣ Marqueur Metz
// ---------------------------
L.marker([49.1193, 6.1757], {icon: metzIcon})
 .addTo(map)
 .bindPopup(`<div style="text-align:center;"><strong style="color:#88256F;">Metz</strong><br>Point de départ</div>`);

// ---------------------------
// 4️⃣ Conteneur cartes HTML
// ---------------------------
const cardsContainer = document.getElementById('destinations-container');

// ---------------------------
// 5️⃣ Animation scroll pour les cartes
// ---------------------------
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// ---------------------------
// 6️⃣ CSS animation fadeIn
// ---------------------------
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity:0; transform: translateY(20px); }
        to { opacity:1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// ---------------------------
// 7️⃣ Récupération du JSON et création marqueurs + cartes
// ---------------------------
fetch('data/csvjson.json')
.then(res => res.json())
.then(data => {
    data.forEach(dest => {
        // Conversion coordonnees "lat,lng" -> [lat,lng]
        const coords = dest.Coordonnees.split(',').map(Number);

        // Marqueur sur la carte
        L.marker(coords, {icon: purpleIcon}).addTo(map)
         .bindPopup(`
            <div style="text-align:center; min-width:200px;">
                <strong style="color:#88256F;">${dest.Ville}</strong><br>
                <span style="color:#53565A;">${dest.Site_touristique}</span><br>
                <span style="background:#88256F; color:white; padding:5px 10px; border-radius:15px; display:inline-block; margin-top:5px;">
                    🚄 ${dest.TempsDepuisMetz} depuis Metz
                </span>
            </div>
         `);

        // Ligne vers Metz
        L.polyline([[49.1193,6.1757], coords], {
            color:'#88256F',
            weight:3,
            opacity:0.6,
            dashArray:'8,12',
            lineJoin:'round'
        }).addTo(map);

        // Carte HTML pour filtrage
        if(cardsContainer){
            // Convertir le temps en minutes pour le filtrage (ex: "50 min" -> 50)
            const timeMinutes = parseInt(dest.TempsDepuisMetz);
            const card = document.createElement('div');
            card.className = 'destination-card';
            card.dataset.time = timeMinutes;
            card.innerHTML = `
                <h3>${dest.Ville}</h3>
                <p>${dest.Site_touristique}</p>
                <span>🚄 ${dest.TempsDepuisMetz} depuis Metz</span>
            `;
            cardsContainer.appendChild(card);
            observer.observe(card);
        }
    });
})
.catch(err => console.error('Erreur chargement JSON :', err));

// ---------------------------
// 8️⃣ Filtrage par temps
// ---------------------------
function filterTime(filter){
    const cards = document.querySelectorAll('.destination-card');
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    cards.forEach(card => {
        const time = parseInt(card.dataset.time);
        let show = false;
        switch(filter){
            case 'all': show=true; break;
            case '2h': show=time<=120; break;
            case '3h': show=time<=180; break;
            case '4h': show=time<=240; break;
        }
        if(show){
            card.style.display='block';
            card.style.animation='fadeIn 0.5s ease';
        }else{
            card.style.display='none';
        }
    });
}

// ---------------------------
// 9️⃣ Animation pour les stats
// ---------------------------
window.addEventListener('load', () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        let current = 0;
        const increment = finalValue.includes('+') ? 1 : 1;
        const duration = 2000;
        const steps = 50;
        const stepDuration = duration / steps;
        const counter = setInterval(() => {
            if(current < parseInt(finalValue)){
                current += increment;
                stat.textContent = current + (finalValue.includes('+') ? '+' : finalValue.includes('%') ? '%' : '');
            }else{
                stat.textContent = finalValue;
                clearInterval(counter);
            }
        }, stepDuration);
    });
});
