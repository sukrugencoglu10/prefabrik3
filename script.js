// Mobile Menu Toggle
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// DataLayer Tracking Functions

/**
 * Triggered when a search is initiated
 * @param {string} source - Where the search originated ('hero' or 'floating')
 */
function triggerSearch(source) {
    let searchTerm = '';
    if (source === 'hero') {
        searchTerm = document.getElementById('hero-search-input').value;
    }
    window.dataLayer.push({
        'event': 'search_intent',
        'search_source': source,
        'search_term': searchTerm || 'boş arama'
    });
    console.log(`Search triggered from ${source} with term: ${searchTerm}`);
    
    // Perform the actual search
    runSearch();
}

/**
 * Lokasyon <-> data-lokasyon eşleştirme tablosu
 */
const LOKASYON_MAP = {
    'istanbul': 'istanbul',
    'İstanbul': 'istanbul',
    'izmir': 'izmir',
    'İzmir': 'izmir',
    'ankara': 'ankara',
    'Ankara': 'ankara',
    'antalya': 'antalya',
    'Antalya': 'antalya',
    'sapanca': 'sapanca'
};

/**
 * Katalog seçimi <-> data-kategori eşleştirme tablosu
 */
const KATALOG_MAP = {
    'Çelik Villa Kataloğu': 'celik-villa',
    'Prefabrik Ev Kataloğu': 'prefabrik-ev',
    'Tiny House Kataloğu': 'tiny-house',
    'Konteyner Kataloğu': 'konteyner'
};

/**
 * Fiyat aralığı parse
 */
function parsePriceFilter(label) {
    if (!label || label === 'Seçiniz' || label === 'Tüm Fiyatlar') return null;
    if (label.startsWith('0-500')) return { min: 0, max: 500000 };
    if (label.startsWith('500.000-1')) return { min: 500000, max: 1000000 };
    if (label.startsWith('1.000.000-2')) return { min: 1000000, max: 2000000 };
    if (label.startsWith('2.000.000+')) return { min: 2000000, max: Infinity };
    return null;
}

/**
 * Arama ve filtreleme ana fonksiyonu
 */
function runSearch() {
    const lokasyon = document.getElementById('selected-location')?.textContent.trim();
    const katalog  = document.getElementById('selected-catalog')?.textContent.trim();
    const fiyatLbl = document.getElementById('selected-price')?.textContent.trim();
    const keyword  = document.getElementById('hero-search-input')?.value.trim().toLowerCase();

    // Filtre aktif mi?
    const filterLokasyon = (lokasyon && lokasyon !== 'Seçiniz' && lokasyon !== 'Tüm Lokasyonlar')
        ? lokasyon.toLowerCase() : null;
    const filterKatalog  = (katalog && katalog !== 'Seçiniz' && katalog !== 'Tüm Kataloglar')
        ? KATALOG_MAP[katalog] || null : null;
    const filterFiyat    = parsePriceFilter(fiyatLbl);
    const filterKeyword  = keyword || null;

    // Kaynak kartları tara
    const sourceCards = document.querySelectorAll('.most-viewed .card');
    const matched = [];

    sourceCards.forEach(card => {
        const cardLokasyon = card.dataset.lokasyon || '';
        const cardKategori = card.dataset.kategori || '';
        const cardFiyat    = parseInt(card.dataset.fiyat || '0', 10);

        let ok = true;
        if (filterLokasyon && !cardLokasyon.includes(filterLokasyon)) ok = false;
        if (filterKatalog  && cardKategori !== filterKatalog) ok = false;
        if (filterFiyat    && (cardFiyat < filterFiyat.min || cardFiyat > filterFiyat.max)) ok = false;
        
        if (filterKeyword) {
            const cardTitle = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const cardDesc = card.querySelector('.card-info p')?.textContent.toLowerCase() || '';
            if (!cardTitle.includes(filterKeyword) && !cardDesc.includes(filterKeyword)) {
                ok = false;
            }
        }

        if (ok) matched.push(card);
    });

    // Sonuçları göster
    const resultsSection = document.getElementById('search-results');
    const resultsGrid    = document.getElementById('results-grid');
    const noResults      = document.getElementById('no-results');
    const countEl        = document.getElementById('results-count');

    resultsGrid.innerHTML = '';
    resultsSection.style.display = 'block';

    if (matched.length === 0) {
        noResults.style.display = 'block';
        countEl.textContent = '';
    } else {
        noResults.style.display = 'none';
        countEl.textContent = matched.length + ' sonuç bulundu';
        matched.forEach(card => {
            resultsGrid.appendChild(card.cloneNode(true));
        });
    }

    // Sayfayı results bölümüne kaydır
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // DataLayer event
    window.dataLayer.push({
        'event': 'search_intent',
        'search_source': 'floating',
        'filter_lokasyon': lokasyon,
        'filter_katalog': katalog,
        'filter_fiyat': fiyatLbl,
        'results_count': matched.length
    });
    console.log(`Arama: lokasyon=${lokasyon}, katalog=${katalog}, fiyat=${fiyatLbl} → ${matched.length} sonuç`);
}

/**
 * Aramayı sıfırla
 */
function clearSearch() {
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('results-grid').innerHTML = '';
    // Dropdown değerlerini sıfırla
    ['selected-location', 'selected-catalog', 'selected-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Seçiniz';
    });
}

/**
 * Triggered when a property card is clicked
 * @param {string} itemName - Name of the property
 * @param {string|number} itemPrice - Price of the property
 */
function triggerItemView(itemName, itemPrice) {
    window.dataLayer.push({
        'event': 'view_item',
        'ecommerce': {
            'items': [{
                'item_name': itemName,
                'price': itemPrice,
                'item_category': 'Prefabrik Ev'
            }]
        }
    });
    
    console.log(`Viewed item: ${itemName}`);
}

/**
 * Triggered for generic button clicks (Try Now, Learn More, etc.)
 * @param {string} eventName - Custom event name
 */
function triggerEvent(eventName) {
    window.dataLayer.push({
        'event': eventName
    });
    console.log(`Event triggered: ${eventName}`);
}

/**
 * Triggered when WhatsApp icon is clicked
 */
function triggerWhatsAppClick() {
    window.dataLayer.push({
        'event': 'contact_whatsapp',
        'contact_method': 'WhatsApp Floating Icon'
    });
    console.log('WhatsApp clicked');
}

// Add scroll listener for subtle animations if needed
window.addEventListener('scroll', () => {
    // We could add simple parallax or fade-ins here
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 23, 42, 0.9)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = 'transparent';
        navbar.style.backdropFilter = 'none';
    }
});

// Custom Dropdown Logic
function toggleDropdown(element, event) {
    // Prevent the click from immediately bubbling up and closing
    event.stopPropagation();
    
    // Close any other open dropdowns
    document.querySelectorAll('.custom-dropdown.active').forEach(dropdown => {
        if (dropdown !== element) {
            dropdown.classList.remove('active');
        }
    });
    
    // Toggle the clicked one
    element.classList.toggle('active');
}

function selectOption(event, text, targetId) {
    // Prevent toggleDropdown from running again when clicking an option
    event.stopPropagation();
    
    // Set the selected text
    document.getElementById(targetId).textContent = text;
    
    // Close the dropdown
    event.target.closest('.custom-dropdown').classList.remove('active');
}

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
});

// FAQ Accordion Logic
function toggleFaq(element) {
    const item = element.closest('.faq-item');
    const icon = element.querySelector('i');
    
    // Close other open FAQs
    const allItems = document.querySelectorAll('.faq-item');
    allItems.forEach(faq => {
        if (faq !== item && faq.classList.contains('active')) {
            faq.classList.remove('active');
            const otherIcon = faq.querySelector('.faq-question i');
            otherIcon.classList.remove('fa-minus');
            otherIcon.classList.add('fa-plus');
        }
    });

    // Toggle current FAQ
    item.classList.toggle('active');
    if (item.classList.contains('active')) {
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
    } else {
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
    }
}
// Enter key listener for search inputs
document.addEventListener('DOMContentLoaded', () => {
    const heroSearchInput = document.getElementById('hero-search-input');
    if (heroSearchInput) {
        heroSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                triggerSearch('hero');
            }
        });
    }

    // Mobile Bottom Nav — active state based on URL
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    if (currentPath.includes('projelerimiz')) {
        document.getElementById('bnav-projects')?.classList.add('active');
    } else if (currentPath.includes('galeri')) {
        document.getElementById('bnav-gallery')?.classList.add('active');
    } else if (currentPath.includes('hakkimizda')) {
        document.getElementById('bnav-about')?.classList.add('active');
    } else if (currentPath.includes('iletisim')) {
        document.getElementById('bnav-contact')?.classList.add('active');
    } else {
        document.getElementById('bnav-home')?.classList.add('active');
    }

    // Tap ripple effect on bottom nav items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

