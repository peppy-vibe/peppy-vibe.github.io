/**
 * Peppy Tools — i18n Engine
 * Supported languages: en (default), es, fr, de, zh-CN, th
 *
 * Usage in HTML:
 *   data-i18n="key"           → sets textContent
 *   data-i18n-html="key"      → sets innerHTML (safe static strings only)
 *   data-i18n-ph="key"        → sets placeholder
 *   data-i18n-title="key"     → sets title attribute
 *   data-i18n-aria="key"      → sets aria-label
 */
(function (win) {
  'use strict';

  var LANG_KEY = 'stp-lang';
  var DEFAULT_LANG = 'en';
  var SUPPORTED = ['en', 'es', 'fr', 'de', 'zh-CN', 'th'];

  /* ─────────────────────────────────────────────────────────────────
     TRANSLATION DICTIONARY
     ─────────────────────────────────────────────────────────────── */
  var T = {

    /* ══ ENGLISH (default) ═════════════════════════════════════════ */
    en: {
      /* Common UI */
      'skip-link':             'Skip to main content',
      'theme-light':           'Light',
      'theme-dark':            'Dark',
      'btn-fullscreen':        'Fullscreen',
      'btn-home':              'Home',
      'btn-toggle-menu':       'Toggle navigation menu',
      'btn-toggle-theme':      'Toggle theme',
      'btn-toggle-fs':         'Toggle fullscreen',
      'lang-label':            'Language',
      'lang-en':               'English',
      'lang-es':               'Español',
      'lang-fr':               'Français',
      'lang-de':               'Deutsch',
      'lang-zh-CN':            '中文(简体)',
      'lang-th':               'ภาษาไทย',

      /* Badges */
      'badge-live':            'Live',
      'badge-soon':            'Soon',
      'badge-new':             'New',
      'badge-public':          'Public',
      'badge-proprietary':     'Proprietary',
      'badge-visual-editor':   'Visual Editor',

      /* Buttons */
      'btn-open-app':          'Open App',
      'btn-learn-more':        'Learn More',
      'btn-view-github':       'View on GitHub',
      'btn-launch':            'Launch',
      'btn-install-app':       'Install App',

      /* Nav / footer */
      'nav-home-aria':         'Back to Peppy Vibe home',
      'footer-tagline':        'Hobby-driven software lab — Python & JavaScript',
      'footer-open-source':    'Open source',
      'footer-client-side':    'Fully client-side',
      'footer-no-data':        'No data collection',
      'footer-offline':        'Works offline',
      'footer-contact':        'Contact Us',

      /* ── Root portal (index.html) ── */
      'root-hero-line1':       'Build Something',
      'root-hero-accent':      'Peppy',
      'root-hero-sub':         'A hobby-driven software lab crafting developer tools, data pipelines, and AI experiments.',
      'root-cta-explore':      'Explore Peppy Tools',
      'root-cta-github':       'View on GitHub',
      'root-since':            'Since Mar 2026',
      'root-section-featured': 'Featured',
      'root-section-software': 'Software',
      'root-section-python':   'Python Packages & Tools',

      /* Root — card descriptions */
      'card-peppy-tools-desc':         'Nine fully client-side browser utilities — PDF tools & editor, notepad, table generator, dev tools, random tools, people & group tools, QR & barcode, and clock tools. Nothing ever leaves your browser.',
      'card-form-extractor-desc':      'Offline AI document data extraction from invoices, receipts & forms. Best-in-class Thai language OCR. Use any AI provider — OpenAI, Ollama, Anthropic & more.',
      'card-spreadsheetql-desc':       'Query Excel, CSV & Parquet files with standard SQL — no database required. JOIN across spreadsheets, GROUP BY, aggregate, and export results. Powered by DuckDB.',
      'card-python-scripts-desc':      'A growing collection of Python utility and toy scripts — experiments, automation snippets, and small tools built for fun and learning.',
      'card-gtec-desc':                'Keep Teams status green. A Python CLI package that simulates mouse activity during configured working hours, preventing inactivity timeouts.',
      'card-vlp-desc':                 'Visual Link Protocol — transfer files between two devices using only cameras and screens via QR codes. No network, no cables, no pairing required.',

      /* ── Peppy Tools portal (peppy-tools/index.html) ── */
      'portal-eyebrow':        'Free & Open Source',
      'portal-hero-line1':     'Peppy',
      'portal-hero-accent':    'Tools',
      'portal-hero-sub':       'Powerful browser utilities that run entirely on your device. No sign-up, no uploads, no tracking.',
      'portal-stat-tools':     'Tools',
      'portal-stat-features':  'Features',
      'portal-stat-uploaded':  'Uploaded',
      'portal-stat-offline':   'Ready',
      'portal-stat-offline-label': 'Offline',
      'portal-search-ph':      'Search tools\u2026',
      'portal-search-aria':    'Search tools',
      'portal-recent-label':   'Recently Used',
      'portal-privacy':        'Everything runs locally in your browser. No data is ever sent to any server. All tools work offline.',
      'portal-no-results':     'No tools match your search.',
      'portal-update-banner':  'A new version is available — click to reload.',
      'portal-offline-banner': 'You are offline — all tools still work from cache.',

      /* Portal — card: Advanced Notepad */
      'card-notepad-desc':   'A feature-rich text editor running entirely in your browser. Open & save local files, preview Markdown + LaTeX in real time.',
      'card-notepad-f1':     'Open & save local files',
      'card-notepad-f2':     'Find & Replace with regex & case options',
      'card-notepad-f3':     'Word wrap, font family & size controls',
      'card-notepad-f4':     'Live split Markdown + LaTeX preview',
      'card-notepad-f5':     'Export Markdown as HTML',
      'card-notepad-f6':     'Text Case Converter',

      /* Portal — card: Table Generator */
      'card-table-desc':     'Create, style, and export HTML tables with full feature parity with TablesGenerator.com — all client-side.',
      'card-table-f1':       'Cell & table-level styling',
      'card-table-f2':       'Merge, split, insert & delete cells',
      'card-table-f3':       'Export: HTML, Markdown, LaTeX, CSV',

      /* Portal — card: PDF Tools */
      'card-pdf-desc':       '18 powerful PDF utilities — all client-side, no uploads, nothing leaves your browser.',
      'card-pdf-f1':         'Merge, Split, Extract, Delete & Rearrange pages',
      'card-pdf-f2':         'Rotate pages, Add Watermark (with position) & Page Numbers',
      'card-pdf-f3':         'Convert Images to PDF & PDF Viewer',
      'card-pdf-f4':         'Compress, Crop, Resize & Flatten',
      'card-pdf-f5':         'Add Password & Permissions, Remove Password, Redact & Sanitize PDF',

      /* Portal — card: PDF Editor */
      'card-pdf-editor-desc':  'Interactive visual PDF workspace — import, view page thumbnails, drag to rearrange, and apply edits. Supports encrypted PDFs throughout.',
      'card-pdf-editor-f1':    'Open / Merge PDFs & Images with encrypted PDF support',
      'card-pdf-editor-f2':    'Drag-to-rearrange page thumbnails',
      'card-pdf-editor-f3':    'Delete, Rotate, Crop & Resize pages',
      'card-pdf-editor-f4':    'Watermark (with position), Page Numbers & Text Annotation',
      'card-pdf-editor-f5':    'Export with AES-256 password protection & permissions',

      /* Portal — card: Random Tools */
      'card-random-desc':    '10 decision & randomisation tools for choices, games, and activities — all in one app.',
      'card-random-f1':      'Wheel Spinner, Yes/No Generator',
      'card-random-f2':      'Option Picker & Winner Picker',
      'card-random-f3':      'Number, Dice, Coin, Card & Day Generators',

      /* Portal — card: People & Group Tools */
      'card-people-desc':    '11 tools for teams, classrooms, and events — pickers, team builder, pairs, seating, Secret Santa, and more.',
      'card-people-f1':      'Random Person Picker, Host & Speaker Selector',
      'card-people-f2':      'Team Generator, Pair Generator & Group Creator',
      'card-people-f3':      'Attendance Roll Call & Seating Chart',
      'card-people-f4':      'Secret Santa with reveal & export',

      /* Portal — card: QR & Barcode */
      'card-qr-desc':        'Generate, scan, and export QR codes and barcodes — fully client-side, no uploads.',
      'card-qr-f1':          'QR Generator: URL, Text, WiFi, vCard, Email, SMS',
      'card-qr-f2':          'Logo overlay, colour pickers & batch QR export',
      'card-qr-f3':          'QR Scanner via device camera',
      'card-qr-f4':          'Barcode Generator in 15+ formats',

      /* Portal — card: Clock Tools */
      'card-clock-desc':     '5 time utilities — stopwatch, countdown timer, world clocks, pomodoro timer, and alarm clock.',
      'card-clock-f1':       'Stopwatch with lap tracking',
      'card-clock-f2':       'Countdown Timer with presets',
      'card-clock-f3':       'World Clocks for 30+ time zones',
      'card-clock-f4':       'Pomodoro Timer (work/break cycles)',
      'card-clock-f5':       'Alarm Clock with audio notification',

      /* Portal — card: Dev Tools */
      'card-dev-desc':       'All developer utility suites in one unified app with a grouped, collapsible sidebar — no switching between tabs.',
      'card-dev-f1':         'Encoding & Security (Base64, URL, Hash, JWT, UUID)',
      'card-dev-f2':         'Text Tools (Diff, Sort, Dedup, Random, Lorem)',
      'card-dev-f3':         'JSON / YAML / XML (8 tools)',
      'card-dev-f4':         'Color Tools, Timestamps & Regex Builder',

      /* Contact page */
      'contact-title':       'Contact Us',
      'contact-sub':         'Get in touch with the Peppy Vibe team.',
    },

    /* ══ SPANISH ════════════════════════════════════════════════════ */
    es: {
      'skip-link':             'Saltar al contenido principal',
      'theme-light':           'Claro',
      'theme-dark':            'Oscuro',
      'btn-fullscreen':        'Pantalla completa',
      'btn-home':              'Inicio',
      'btn-toggle-menu':       'Alternar menú de navegación',
      'btn-toggle-theme':      'Alternar tema',
      'btn-toggle-fs':         'Alternar pantalla completa',
      'lang-label':            'Idioma',
      'badge-live':            'En vivo',
      'badge-soon':            'Próximamente',
      'badge-new':             'Nuevo',
      'badge-public':          'Público',
      'badge-proprietary':     'Propietario',
      'badge-visual-editor':   'Editor Visual',
      'btn-open-app':          'Abrir App',
      'btn-learn-more':        'Más información',
      'btn-view-github':       'Ver en GitHub',
      'btn-launch':            'Lanzar',
      'btn-install-app':       'Instalar App',
      'nav-home-aria':         'Volver al inicio de Peppy Vibe',
      'footer-tagline':        'Laboratorio de software hobby — Python & JavaScript',
      'footer-open-source':    'Código abierto',
      'footer-client-side':    'Completamente en el cliente',
      'footer-no-data':        'Sin recopilación de datos',
      'footer-offline':        'Funciona sin conexión',
      'footer-contact':        'Contáctenos',
      'root-hero-line1':       'Construye Algo',
      'root-hero-accent':      'Peppy',
      'root-hero-sub':         'Un laboratorio de software hobby que crea herramientas para desarrolladores, pipelines de datos y experimentos de IA.',
      'root-cta-explore':      'Explorar Peppy Tools',
      'root-cta-github':       'Ver en GitHub',
      'root-since':            'Desde marzo 2026',
      'root-section-featured': 'Destacado',
      'root-section-software': 'Software',
      'root-section-python':   'Paquetes y herramientas Python',
      'card-peppy-tools-desc':        'Nueve utilidades de navegador completamente del lado del cliente — herramientas PDF, editor, bloc de notas, generador de tablas, herramientas dev, herramientas aleatorias, QR y más.',
      'card-form-extractor-desc':     'Extracción de datos de documentos IA sin conexión — facturas, recibos y formularios. OCR de thai de primer nivel. Compatible con OpenAI, Ollama, Anthropic y más.',
      'card-spreadsheetql-desc':      'Consulta archivos Excel, CSV y Parquet con SQL estándar — sin base de datos. JOIN entre hojas de cálculo, GROUP BY, agregaciones y exportación. Motor: DuckDB.',
      'card-python-scripts-desc':     'Una colección creciente de scripts Python de utilidad — experimentos, fragmentos de automatización y pequeñas herramientas creadas por diversión.',
      'card-gtec-desc':               'Mantén el estado de Teams en verde. Un paquete CLI de Python que simula actividad del ratón durante las horas de trabajo configuradas, evitando tiempos de espera e inactividad.',
      'card-vlp-desc':                'Protocolo de Enlace Visual — transfiere archivos entre dos dispositivos usando solo cámaras y pantallas mediante códigos QR. Sin red, sin cables, sin emparejamiento.',
      'portal-eyebrow':        'Gratis y de Código Abierto',
      'portal-hero-line1':     'Peppy',
      'portal-hero-accent':    'Tools',
      'portal-hero-sub':       'Potentes utilidades de navegador que funcionan completamente en tu dispositivo. Sin registro, sin subidas, sin rastreo.',
      'portal-stat-tools':     'Herramientas',
      'portal-stat-features':  'Funciones',
      'portal-stat-uploaded':  'Subidos',
      'portal-stat-offline':   'Listo',
      'portal-stat-offline-label': 'Sin conexión',
      'portal-search-ph':      'Buscar herramientas\u2026',
      'portal-search-aria':    'Buscar herramientas',
      'portal-recent-label':   'Usados recientemente',
      'portal-privacy':        'Todo se ejecuta localmente en tu navegador. Nunca se envían datos a ningún servidor. Todas las herramientas funcionan sin conexión.',
      'portal-no-results':     'Ninguna herramienta coincide con tu búsqueda.',
      'portal-update-banner':  'Hay una nueva versión disponible — haz clic para recargar.',
      'portal-offline-banner': 'Estás sin conexión — todas las herramientas siguen funcionando desde caché.',
      'card-notepad-desc':   'Un editor de texto rico que funciona completamente en tu navegador. Abre y guarda archivos locales, previsualiza Markdown + LaTeX en tiempo real.',
      'card-notepad-f1':     'Abrir y guardar archivos locales',
      'card-notepad-f2':     'Buscar y reemplazar con regex y opciones de mayúsculas',
      'card-notepad-f3':     'Ajuste de línea, familia de fuente y controles de tamaño',
      'card-notepad-f4':     'Vista previa dividida en vivo de Markdown + LaTeX',
      'card-notepad-f5':     'Exportar Markdown como HTML',
      'card-notepad-f6':     'Convertidor de mayúsculas/minúsculas',
      'card-table-desc':     'Crea, estiliza y exporta tablas HTML con total compatibilidad de funciones con TablesGenerator.com — todo en el cliente.',
      'card-table-f1':       'Estilo a nivel de celda y tabla',
      'card-table-f2':       'Combinar, dividir, insertar y eliminar celdas',
      'card-table-f3':       'Exportar: HTML, Markdown, LaTeX, CSV',
      'card-pdf-desc':       '18 potentes utilidades PDF — todo en el cliente, sin subidas, nada sale de tu navegador.',
      'card-pdf-f1':         'Combinar, dividir, extraer, eliminar y reorganizar páginas',
      'card-pdf-f2':         'Rotar páginas, añadir marca de agua (con posición) y numeración',
      'card-pdf-f3':         'Convertir imágenes a PDF y visor de PDF',
      'card-pdf-f4':         'Comprimir, recortar, redimensionar y aplanar',
      'card-pdf-f5':         'Añadir/eliminar contraseña, redactar y sanear PDF',
      'card-pdf-editor-desc':  'Espacio de trabajo visual interactivo de PDF — importar, ver miniaturas, arrastrar para reordenar y aplicar ediciones.',
      'card-pdf-editor-f1':    'Abrir/combinar PDFs e imágenes con soporte de PDF cifrado',
      'card-pdf-editor-f2':    'Arrastrar miniaturas de páginas para reordenar',
      'card-pdf-editor-f3':    'Eliminar, rotar, recortar y redimensionar páginas',
      'card-pdf-editor-f4':    'Marca de agua, números de página y anotación de texto',
      'card-pdf-editor-f5':    'Exportar con protección de contraseña AES-256 y permisos',
      'card-random-desc':    '10 herramientas de decisión y aleatorización — opciones, juegos y actividades en una sola app.',
      'card-random-f1':      'Ruleta giratoria, Generador de Sí/No',
      'card-random-f2':      'Selector de opciones y Selector de ganador',
      'card-random-f3':      'Generadores de número, dados, moneda, carta y día',
      'card-people-desc':    '11 herramientas para equipos, aulas y eventos — selectores, creador de equipos, parejas, disposición de asientos y más.',
      'card-people-f1':      'Selector de persona aleatoria, Selección de anfitrión y ponente',
      'card-people-f2':      'Generador de equipos, parejas y grupos',
      'card-people-f3':      'Lista de asistencia y mapa de asientos',
      'card-people-f4':      'Amigo Invisible con revelación y exportación',
      'card-qr-desc':        'Genera, escanea y exporta códigos QR y de barras — completamente en el cliente, sin subidas.',
      'card-qr-f1':          'Generador QR: URL, Texto, WiFi, vCard, Email, SMS',
      'card-qr-f2':          'Superposición de logo, paletas de colores y exportación de QR en lote',
      'card-qr-f3':          'Escáner QR mediante cámara del dispositivo',
      'card-qr-f4':          'Generador de códigos de barras en más de 15 formatos',
      'card-clock-desc':     '5 utilidades de tiempo — cronómetro, temporizador de cuenta regresiva, relojes mundiales, temporizador pomodoro y reloj despertador.',
      'card-clock-f1':       'Cronómetro con registro de vueltas',
      'card-clock-f2':       'Temporizador de cuenta regresiva con preajustes',
      'card-clock-f3':       'Relojes mundiales para más de 30 zonas horarias',
      'card-clock-f4':       'Temporizador Pomodoro (ciclos de trabajo/descanso)',
      'card-clock-f5':       'Reloj despertador con notificación de audio',
      'card-dev-desc':       'Todas las utilidades de desarrollador en una sola app con barra lateral agrupada y colapsable — sin cambiar de pestaña.',
      'card-dev-f1':         'Codificación y seguridad (Base64, URL, Hash, JWT, UUID)',
      'card-dev-f2':         'Herramientas de texto (Diff, Ordenar, Deduplicar, Aleatorio, Lorem)',
      'card-dev-f3':         'JSON / YAML / XML (8 herramientas)',
      'card-dev-f4':         'Herramientas de color, marcas de tiempo y creador de expresiones regulares',
      'contact-title':       'Contáctenos',
      'contact-sub':         'Ponte en contacto con el equipo de Peppy Vibe.',
    },

    /* ══ FRENCH ═════════════════════════════════════════════════════ */
    fr: {
      'skip-link':             'Passer au contenu principal',
      'theme-light':           'Clair',
      'theme-dark':            'Sombre',
      'btn-fullscreen':        'Plein écran',
      'btn-home':              'Accueil',
      'btn-toggle-menu':       'Basculer le menu de navigation',
      'btn-toggle-theme':      'Changer le thème',
      'btn-toggle-fs':         'Basculer le plein écran',
      'lang-label':            'Langue',
      'badge-live':            'En ligne',
      'badge-soon':            'Bientôt',
      'badge-new':             'Nouveau',
      'badge-public':          'Public',
      'badge-proprietary':     'Propriétaire',
      'badge-visual-editor':   'Éditeur visuel',
      'btn-open-app':          'Ouvrir l\'app',
      'btn-learn-more':        'En savoir plus',
      'btn-view-github':       'Voir sur GitHub',
      'btn-launch':            'Lancer',
      'btn-install-app':       'Installer l\'app',
      'nav-home-aria':         'Retour à l\'accueil Peppy Vibe',
      'footer-tagline':        'Laboratoire logiciel hobby — Python & JavaScript',
      'footer-open-source':    'Open source',
      'footer-client-side':    'Entièrement côté client',
      'footer-no-data':        'Aucune collecte de données',
      'footer-offline':        'Fonctionne hors ligne',
      'footer-contact':        'Contactez-nous',
      'root-hero-line1':       'Créez quelque chose de',
      'root-hero-accent':      'Peppy',
      'root-hero-sub':         'Un laboratoire logiciel hobby créant des outils pour développeurs, des pipelines de données et des expériences IA.',
      'root-cta-explore':      'Explorer Peppy Tools',
      'root-cta-github':       'Voir sur GitHub',
      'root-since':            'Depuis mars 2026',
      'root-section-featured': 'À la une',
      'root-section-software': 'Logiciels',
      'root-section-python':   'Packages et outils Python',
      'card-peppy-tools-desc':        'Neuf utilitaires navigateur entièrement côté client — outils PDF, éditeur, bloc-notes, générateur de tableaux, outils dev, outils aléatoires, QR et plus.',
      'card-form-extractor-desc':     'Extraction de données de documents IA hors ligne — factures, reçus et formulaires. OCR thaï de premier plan. Compatible avec OpenAI, Ollama, Anthropic et plus.',
      'card-spreadsheetql-desc':      'Interrogez des fichiers Excel, CSV et Parquet avec du SQL standard — sans base de données. JOIN entre feuilles de calcul, GROUP BY, agrégations et exportation. Moteur : DuckDB.',
      'card-python-scripts-desc':     'Une collection croissante de scripts Python utilitaires — expériences, extraits d\'automatisation et petits outils créés pour le plaisir.',
      'card-gtec-desc':               'Gardez le statut Teams au vert. Un package CLI Python qui simule l\'activité de la souris pendant les heures de travail configurées, empêchant les délais d\'expiration d\'inactivité.',
      'card-vlp-desc':                'Protocole de lien visuel — transférez des fichiers entre deux appareils en utilisant uniquement des caméras et des écrans via des codes QR. Pas de réseau, pas de câbles.',
      'portal-eyebrow':        'Gratuit & Open Source',
      'portal-hero-line1':     'Peppy',
      'portal-hero-accent':    'Tools',
      'portal-hero-sub':       'Des utilitaires navigateur puissants qui s\'exécutent entièrement sur votre appareil. Sans inscription, sans téléchargement, sans suivi.',
      'portal-stat-tools':     'Outils',
      'portal-stat-features':  'Fonctionnalités',
      'portal-stat-uploaded':  'Téléchargé',
      'portal-stat-offline':   'Prêt',
      'portal-stat-offline-label': 'Hors ligne',
      'portal-search-ph':      'Rechercher des outils\u2026',
      'portal-search-aria':    'Rechercher des outils',
      'portal-recent-label':   'Récemment utilisés',
      'portal-privacy':        'Tout s\'exécute localement dans votre navigateur. Aucune donnée n\'est jamais envoyée à un serveur. Tous les outils fonctionnent hors ligne.',
      'portal-no-results':     'Aucun outil ne correspond à votre recherche.',
      'portal-update-banner':  'Une nouvelle version est disponible — cliquez pour recharger.',
      'portal-offline-banner': 'Vous êtes hors ligne — tous les outils fonctionnent toujours depuis le cache.',
      'card-notepad-desc':   'Un éditeur de texte riche fonctionnant entièrement dans votre navigateur. Ouvrez et enregistrez des fichiers locaux, prévisualisez Markdown + LaTeX en temps réel.',
      'card-notepad-f1':     'Ouvrir et enregistrer des fichiers locaux',
      'card-notepad-f2':     'Rechercher et remplacer avec regex et options de casse',
      'card-notepad-f3':     'Retour à la ligne, famille de polices et contrôles de taille',
      'card-notepad-f4':     'Prévisualisation fractionnée en direct Markdown + LaTeX',
      'card-notepad-f5':     'Exporter Markdown en HTML',
      'card-notepad-f6':     'Convertisseur de casse de texte',
      'card-table-desc':     'Créez, stylisez et exportez des tableaux HTML avec une parité complète des fonctionnalités avec TablesGenerator.com — entièrement côté client.',
      'card-table-f1':       'Style au niveau cellule et tableau',
      'card-table-f2':       'Fusionner, diviser, insérer et supprimer des cellules',
      'card-table-f3':       'Exporter : HTML, Markdown, LaTeX, CSV',
      'card-pdf-desc':       '18 puissants utilitaires PDF — entièrement côté client, sans téléchargement, rien ne quitte votre navigateur.',
      'card-pdf-f1':         'Fusionner, diviser, extraire, supprimer et réorganiser les pages',
      'card-pdf-f2':         'Faire pivoter les pages, ajouter un filigrane (avec position) et numéros de page',
      'card-pdf-f3':         'Convertir des images en PDF et visionneuse PDF',
      'card-pdf-f4':         'Compresser, rogner, redimensionner et aplatir',
      'card-pdf-f5':         'Ajouter/supprimer un mot de passe, rédiger et assainir le PDF',
      'card-pdf-editor-desc':  'Espace de travail PDF visuel interactif — importer, voir les vignettes, glisser-déposer pour réorganiser et appliquer des modifications.',
      'card-pdf-editor-f1':    'Ouvrir/fusionner des PDF et images avec prise en charge des PDF chiffrés',
      'card-pdf-editor-f2':    'Glisser-déposer les vignettes pour réorganiser',
      'card-pdf-editor-f3':    'Supprimer, faire pivoter, rogner et redimensionner les pages',
      'card-pdf-editor-f4':    'Filigrane, numéros de page et annotation de texte',
      'card-pdf-editor-f5':    'Exporter avec protection par mot de passe AES-256 et autorisations',
      'card-random-desc':    '10 outils de décision et de randomisation — choix, jeux et activités dans une seule application.',
      'card-random-f1':      'Roulette, Générateur Oui/Non',
      'card-random-f2':      'Sélecteur d\'options et Sélecteur de gagnant',
      'card-random-f3':      'Générateurs de nombre, dés, pièce, carte et jour',
      'card-people-desc':    '11 outils pour les équipes, les classes et les événements — sélecteurs, créateur d\'équipes, paires, disposition des places et plus.',
      'card-people-f1':      'Sélecteur de personne aléatoire, Sélection d\'hôte et de conférencier',
      'card-people-f2':      'Générateur d\'équipes, de paires et de groupes',
      'card-people-f3':      'Appel de présence et plan de salle',
      'card-people-f4':      'Père Noël secret avec révélation et exportation',
      'card-qr-desc':        'Générez, scannez et exportez des codes QR et des codes-barres — entièrement côté client, sans téléchargement.',
      'card-qr-f1':          'Générateur QR : URL, Texte, WiFi, vCard, Email, SMS',
      'card-qr-f2':          'Superposition de logo, sélecteurs de couleurs et exportation QR en lot',
      'card-qr-f3':          'Scanner QR via la caméra de l\'appareil',
      'card-qr-f4':          'Générateur de codes-barres dans plus de 15 formats',
      'card-clock-desc':     '5 utilitaires temporels — chronomètre, minuterie de compte à rebours, horloges mondiales, minuterie pomodoro et réveil.',
      'card-clock-f1':       'Chronomètre avec suivi des tours',
      'card-clock-f2':       'Minuterie de compte à rebours avec préréglages',
      'card-clock-f3':       'Horloges mondiales pour plus de 30 fuseaux horaires',
      'card-clock-f4':       'Minuterie Pomodoro (cycles travail/pause)',
      'card-clock-f5':       'Réveil avec notification audio',
      'card-dev-desc':       'Toutes les suites utilitaires de développeur dans une seule application avec une barre latérale groupée et réductible.',
      'card-dev-f1':         'Encodage & Sécurité (Base64, URL, Hash, JWT, UUID)',
      'card-dev-f2':         'Outils texte (Diff, Trier, Dédupliquer, Aléatoire, Lorem)',
      'card-dev-f3':         'JSON / YAML / XML (8 outils)',
      'card-dev-f4':         'Outils de couleur, horodatages et générateur de regex',
      'contact-title':       'Contactez-nous',
      'contact-sub':         'Prenez contact avec l\'équipe Peppy Vibe.',
    },

    /* ══ GERMAN ══════════════════════════════════════════════════════ */
    de: {
      'skip-link':             'Zum Hauptinhalt springen',
      'theme-light':           'Hell',
      'theme-dark':            'Dunkel',
      'btn-fullscreen':        'Vollbild',
      'btn-home':              'Startseite',
      'btn-toggle-menu':       'Navigationsmenü umschalten',
      'btn-toggle-theme':      'Design wechseln',
      'btn-toggle-fs':         'Vollbild umschalten',
      'lang-label':            'Sprache',
      'badge-live':            'Live',
      'badge-soon':            'Demnächst',
      'badge-new':             'Neu',
      'badge-public':          'Öffentlich',
      'badge-proprietary':     'Proprietär',
      'badge-visual-editor':   'Visueller Editor',
      'btn-open-app':          'App öffnen',
      'btn-learn-more':        'Mehr erfahren',
      'btn-view-github':       'Auf GitHub ansehen',
      'btn-launch':            'Starten',
      'btn-install-app':       'App installieren',
      'nav-home-aria':         'Zurück zur Peppy Vibe-Startseite',
      'footer-tagline':        'Hobby-Software-Labor — Python & JavaScript',
      'footer-open-source':    'Open Source',
      'footer-client-side':    'Vollständig clientseitig',
      'footer-no-data':        'Keine Datenerfassung',
      'footer-offline':        'Offline nutzbar',
      'footer-contact':        'Kontaktieren Sie uns',
      'root-hero-line1':       'Bauen Sie etwas',
      'root-hero-accent':      'Peppy',
      'root-hero-sub':         'Ein hobby-gesteuertes Software-Labor, das Entwickler-Tools, Datenpipelines und KI-Experimente erstellt.',
      'root-cta-explore':      'Peppy Tools erkunden',
      'root-cta-github':       'Auf GitHub ansehen',
      'root-since':            'Seit März 2026',
      'root-section-featured': 'Hervorgehoben',
      'root-section-software': 'Software',
      'root-section-python':   'Python-Pakete & Tools',
      'card-peppy-tools-desc':        'Neun vollständig clientseitige Browser-Dienstprogramme — PDF-Tools, Editor, Notizblock, Tabellengenerator, Dev-Tools, Zufallstools, QR und mehr.',
      'card-form-extractor-desc':     'Offline-KI-Dokumentendatenextraktion aus Rechnungen, Belegen & Formularen. Erstklassige Thai-OCR. Kompatibel mit OpenAI, Ollama, Anthropic u.v.m.',
      'card-spreadsheetql-desc':      'Excel-, CSV- und Parquet-Dateien mit Standard-SQL abfragen — keine Datenbank erforderlich. JOIN über Tabellen, GROUP BY, Aggregation und Export. Motor: DuckDB.',
      'card-python-scripts-desc':     'Eine wachsende Sammlung von Python-Dienstprogramm- und Spielskripten — Experimente, Automatisierungsschnipsel und kleine Tools zum Spaß.',
      'card-gtec-desc':               'Teams-Status grün halten. Ein Python-CLI-Paket, das Mausaktivität während konfigurierter Arbeitszeiten simuliert, um Inaktivitäts-Timeouts zu verhindern.',
      'card-vlp-desc':                'Visual Link Protocol — Dateien zwischen zwei Geräten mit nur Kameras und Bildschirmen über QR-Codes übertragen. Kein Netzwerk, keine Kabel.',
      'portal-eyebrow':        'Kostenlos & Open Source',
      'portal-hero-line1':     'Peppy',
      'portal-hero-accent':    'Tools',
      'portal-hero-sub':       'Leistungsstarke Browser-Dienstprogramme, die vollständig auf Ihrem Gerät laufen. Keine Registrierung, keine Uploads, kein Tracking.',
      'portal-stat-tools':     'Tools',
      'portal-stat-features':  'Funktionen',
      'portal-stat-uploaded':  'Hochgeladen',
      'portal-stat-offline':   'Bereit',
      'portal-stat-offline-label': 'Offline',
      'portal-search-ph':      'Tools suchen\u2026',
      'portal-search-aria':    'Tools suchen',
      'portal-recent-label':   'Zuletzt verwendet',
      'portal-privacy':        'Alles läuft lokal in Ihrem Browser. Es werden niemals Daten an einen Server gesendet. Alle Tools funktionieren offline.',
      'portal-no-results':     'Keine Tools entsprechen Ihrer Suche.',
      'portal-update-banner':  'Eine neue Version ist verfügbar — klicken Sie zum Neuladen.',
      'portal-offline-banner': 'Sie sind offline — alle Tools funktionieren weiterhin aus dem Cache.',
      'card-notepad-desc':   'Ein funktionsreicher Texteditor, der vollständig in Ihrem Browser läuft. Öffnen und speichern Sie lokale Dateien, Markdown + LaTeX live in Echtzeit.',
      'card-notepad-f1':     'Lokale Dateien öffnen und speichern',
      'card-notepad-f2':     'Suchen & Ersetzen mit Regex und Groß-/Kleinschreibungsoptionen',
      'card-notepad-f3':     'Zeilenumbruch, Schriftfamilie und Größensteuerung',
      'card-notepad-f4':     'Live-geteilte Markdown + LaTeX-Vorschau',
      'card-notepad-f5':     'Markdown als HTML exportieren',
      'card-notepad-f6':     'Textgroßschreibungskonverter',
      'card-table-desc':     'HTML-Tabellen erstellen, gestalten und exportieren — vollständig clientseitig.',
      'card-table-f1':       'Zell- und Tabellenebenen-Styling',
      'card-table-f2':       'Zellen zusammenführen, teilen, einfügen und löschen',
      'card-table-f3':       'Exportieren: HTML, Markdown, LaTeX, CSV',
      'card-pdf-desc':       '18 leistungsstarke PDF-Dienstprogramme — vollständig clientseitig, keine Uploads, nichts verlässt Ihren Browser.',
      'card-pdf-f1':         'Seiten zusammenführen, teilen, extrahieren, löschen und neu anordnen',
      'card-pdf-f2':         'Seiten drehen, Wasserzeichen (mit Position) und Seitenzahlen hinzufügen',
      'card-pdf-f3':         'Bilder in PDF konvertieren und PDF-Betrachter',
      'card-pdf-f4':         'Komprimieren, Zuschneiden, Skalieren und Reduzieren',
      'card-pdf-f5':         'Passwort hinzufügen/entfernen, Redigieren und Bereinigen',
      'card-pdf-editor-desc':  'Interaktiver visueller PDF-Arbeitsbereich — importieren, Seitenminiaturen anzeigen, per Drag-and-Drop neu anordnen und Bearbeitungen anwenden.',
      'card-pdf-editor-f1':    'PDFs und Bilder öffnen/zusammenführen mit verschlüsselter PDF-Unterstützung',
      'card-pdf-editor-f2':    'Seitenminiaturen per Drag-and-Drop neu anordnen',
      'card-pdf-editor-f3':    'Seiten löschen, drehen, zuschneiden und skalieren',
      'card-pdf-editor-f4':    'Wasserzeichen, Seitenzahlen und Textanmerkungen',
      'card-pdf-editor-f5':    'Mit AES-256-Passwortschutz und Berechtigungen exportieren',
      'card-random-desc':    '10 Entscheidungs- und Zufallstools — Entscheidungen, Spiele und Aktivitäten in einer App.',
      'card-random-f1':      'Glücksrad, Ja/Nein-Generator',
      'card-random-f2':      'Optionenauswahl & Gewinnerauswahl',
      'card-random-f3':      'Zahl-, Würfel-, Münz-, Karten- & Tagesgeneratoren',
      'card-people-desc':    '11 Tools für Teams, Klassen und Veranstaltungen — Auswähler, Teambuilder, Paare, Sitzplan, Wichteln und mehr.',
      'card-people-f1':      'Zufälliger Personenauswähler, Gastgeber & Rednerauswahl',
      'card-people-f2':      'Team-, Paar- und Gruppengenerator',
      'card-people-f3':      'Anwesenheitsliste & Sitzplan',
      'card-people-f4':      'Wichteln mit Enthüllung und Export',
      'card-qr-desc':        'QR-Codes und Barcodes generieren, scannen und exportieren — vollständig clientseitig, ohne Uploads.',
      'card-qr-f1':          'QR-Generator: URL, Text, WLAN, vCard, E-Mail, SMS',
      'card-qr-f2':          'Logo-Überlagerung, Farbauswahl & Batch-QR-Export',
      'card-qr-f3':          'QR-Scanner über Gerätekamera',
      'card-qr-f4':          'Barcode-Generator in 15+ Formaten',
      'card-clock-desc':     '5 Zeitdienstprogramme — Stoppuhr, Countdown-Timer, Weltuhren, Pomodoro-Timer und Wecker.',
      'card-clock-f1':       'Stoppuhr mit Rundenerfassung',
      'card-clock-f2':       'Countdown-Timer mit Voreinstellungen',
      'card-clock-f3':       'Weltuhren für 30+ Zeitzonen',
      'card-clock-f4':       'Pomodoro-Timer (Arbeits-/Pausenzyklen)',
      'card-clock-f5':       'Wecker mit Audiobenachrichtigung',
      'card-dev-desc':       'Alle Entwickler-Dienstprogramm-Suiten in einer einzigen App mit gruppierbarer, einklappbarer Seitenleiste.',
      'card-dev-f1':         'Kodierung & Sicherheit (Base64, URL, Hash, JWT, UUID)',
      'card-dev-f2':         'Textwerkzeuge (Diff, Sortieren, Deduplizieren, Zufällig, Lorem)',
      'card-dev-f3':         'JSON / YAML / XML (8 Tools)',
      'card-dev-f4':         'Farbwerkzeuge, Zeitstempel & Regex-Builder',
      'contact-title':       'Kontaktieren Sie uns',
      'contact-sub':         'Nehmen Sie Kontakt mit dem Peppy Vibe-Team auf.',
    },

    /* ══ CHINESE SIMPLIFIED ═════════════════════════════════════════ */
    'zh-CN': {
      'skip-link':             '跳至主要内容',
      'theme-light':           '浅色',
      'theme-dark':            '深色',
      'btn-fullscreen':        '全屏',
      'btn-home':              '首页',
      'btn-toggle-menu':       '切换导航菜单',
      'btn-toggle-theme':      '切换主题',
      'btn-toggle-fs':         '切换全屏',
      'lang-label':            '语言',
      'badge-live':            '上线',
      'badge-soon':            '即将推出',
      'badge-new':             '新',
      'badge-public':          '公开',
      'badge-proprietary':     '专有',
      'badge-visual-editor':   '可视化编辑器',
      'btn-open-app':          '打开应用',
      'btn-learn-more':        '了解更多',
      'btn-view-github':       '在 GitHub 上查看',
      'btn-launch':            '启动',
      'btn-install-app':       '安装应用',
      'nav-home-aria':         '返回 Peppy Vibe 首页',
      'footer-tagline':        '兴趣驱动的软件实验室 — Python & JavaScript',
      'footer-open-source':    '开源',
      'footer-client-side':    '完全客户端',
      'footer-no-data':        '不收集数据',
      'footer-offline':        '支持离线',
      'footer-contact':        '联系我们',
      'root-hero-line1':       '构建一些',
      'root-hero-accent':      'Peppy',
      'root-hero-sub':         '一个兴趣驱动的软件实验室，专注于开发者工具、数据管道和AI实验。',
      'root-cta-explore':      '探索 Peppy Tools',
      'root-cta-github':       '在 GitHub 上查看',
      'root-since':            '自 2026 年 3 月起',
      'root-section-featured': '精选',
      'root-section-software': '软件',
      'root-section-python':   'Python 包和工具',
      'card-peppy-tools-desc':        '九款完全客户端浏览器工具 — PDF工具及编辑器、记事本、表格生成器、开发工具、随机工具、人员和团队工具、二维码等。任何数据都不会离开您的浏览器。',
      'card-form-extractor-desc':     '离线AI文档数据提取，支持发票、收据和表单。顶级泰语OCR。支持 OpenAI、Ollama、Anthropic 等任意AI提供商。',
      'card-spreadsheetql-desc':      '使用标准SQL查询Excel、CSV和Parquet文件 — 无需数据库。支持跨表JOIN、GROUP BY、聚合和导出。由DuckDB驱动。',
      'card-python-scripts-desc':     '不断增长的Python实用脚本集合 — 实验、自动化片段和为乐趣而构建的小工具。',
      'card-gtec-desc':               '保持 Teams 状态为绿色。一个Python CLI包，在配置的工作时间内模拟鼠标活动，防止不活动超时。',
      'card-vlp-desc':                '视觉链接协议 — 仅使用摄像头和屏幕通过二维码在两台设备之间传输文件。无需网络、电缆或配对。',
      'portal-eyebrow':        '免费 & 开源',
      'portal-hero-line1':     'Peppy',
      'portal-hero-accent':    'Tools',
      'portal-hero-sub':       '完全在您的设备上运行的强大浏览器工具。无需注册、无需上传、无跟踪。',
      'portal-stat-tools':     '工具',
      'portal-stat-features':  '功能',
      'portal-stat-uploaded':  '已上传',
      'portal-stat-offline':   '就绪',
      'portal-stat-offline-label': '离线',
      'portal-search-ph':      '搜索工具\u2026',
      'portal-search-aria':    '搜索工具',
      'portal-recent-label':   '最近使用',
      'portal-privacy':        '一切都在您的浏览器本地运行。数据绝不会发送到任何服务器。所有工具均可离线使用。',
      'portal-no-results':     '没有与您搜索匹配的工具。',
      'portal-update-banner':  '有新版本可用 — 点击重新加载。',
      'portal-offline-banner': '您已离线 — 所有工具仍可从缓存中使用。',
      'card-notepad-desc':   '在浏览器中完全运行的功能丰富文本编辑器。打开和保存本地文件，实时预览 Markdown + LaTeX。',
      'card-notepad-f1':     '打开和保存本地文件',
      'card-notepad-f2':     '支持正则和大小写选项的查找和替换',
      'card-notepad-f3':     '自动换行、字体系列和大小控制',
      'card-notepad-f4':     '实时分屏 Markdown + LaTeX 预览',
      'card-notepad-f5':     '将 Markdown 导出为 HTML',
      'card-notepad-f6':     '文本大小写转换器',
      'card-table-desc':     '创建、设计和导出HTML表格，功能完全对标 TablesGenerator.com — 全客户端。',
      'card-table-f1':       '单元格和表格级别样式',
      'card-table-f2':       '合并、拆分、插入和删除单元格',
      'card-table-f3':       '导出：HTML、Markdown、LaTeX、CSV',
      'card-pdf-desc':       '18款强大的PDF工具 — 全客户端，无需上传，任何数据都不会离开您的浏览器。',
      'card-pdf-f1':         '合并、拆分、提取、删除和重新排列页面',
      'card-pdf-f2':         '旋转页面，添加水印（带位置）和页码',
      'card-pdf-f3':         '将图片转换为PDF和PDF查看器',
      'card-pdf-f4':         '压缩、裁剪、调整大小和展平',
      'card-pdf-f5':         '添加/删除密码、编辑和净化PDF',
      'card-pdf-editor-desc':  '交互式可视化PDF工作区 — 导入、查看页面缩略图、拖动重新排列并应用编辑。',
      'card-pdf-editor-f1':    '打开/合并支持加密PDF的PDF和图片',
      'card-pdf-editor-f2':    '拖动页面缩略图重新排列',
      'card-pdf-editor-f3':    '删除、旋转、裁剪和调整页面大小',
      'card-pdf-editor-f4':    '水印、页码和文字注释',
      'card-pdf-editor-f5':    '使用AES-256密码保护和权限导出',
      'card-random-desc':    '10款决策和随机化工具 — 选择、游戏和活动，一个应用全搞定。',
      'card-random-f1':      '转盘抽奖、是/否生成器',
      'card-random-f2':      '选项选择器和获胜者选择器',
      'card-random-f3':      '数字、骰子、硬币、卡片和日期生成器',
      'card-people-desc':    '11款团队、教室和活动工具 — 随机选人、团队构建、配对、座位表、圣诞秘密天使等。',
      'card-people-f1':      '随机选人、主持人和演讲者选择',
      'card-people-f2':      '团队、配对和小组生成器',
      'card-people-f3':      '出勤点名和座位图',
      'card-people-f4':      '圣诞秘密天使（含揭示和导出）',
      'card-qr-desc':        '生成、扫描和导出二维码和条形码 — 全客户端，无需上传。',
      'card-qr-f1':          '二维码生成器：URL、文本、WiFi、名片、邮件、短信',
      'card-qr-f2':          'Logo叠加、颜色选择器和批量二维码导出',
      'card-qr-f3':          '通过设备摄像头扫描二维码',
      'card-qr-f4':          '15+格式条形码生成器',
      'card-clock-desc':     '5款时间工具 — 秒表、倒计时、世界时钟、番茄时钟和闹钟。',
      'card-clock-f1':       '带圈数记录的秒表',
      'card-clock-f2':       '带预设的倒计时器',
      'card-clock-f3':       '30+时区的世界时钟',
      'card-clock-f4':       '番茄时钟（工作/休息循环）',
      'card-clock-f5':       '带音频通知的闹钟',
      'card-dev-desc':       '所有开发者工具套件集成在一个应用中，带分组可折叠侧边栏 — 无需切换标签页。',
      'card-dev-f1':         '编码与安全（Base64、URL、哈希、JWT、UUID）',
      'card-dev-f2':         '文本工具（差异、排序、去重、随机、Lorem）',
      'card-dev-f3':         'JSON / YAML / XML（8款工具）',
      'card-dev-f4':         '颜色工具、时间戳和正则表达式构建器',
      'contact-title':       '联系我们',
      'contact-sub':         '联系 Peppy Vibe 团队。',
    },

    /* ══ THAI ════════════════════════════════════════════════════════ */
    th: {
      'skip-link':             'ข้ามไปยังเนื้อหาหลัก',
      'theme-light':           'สว่าง',
      'theme-dark':            'มืด',
      'btn-fullscreen':        'เต็มหน้าจอ',
      'btn-home':              'หน้าหลัก',
      'btn-toggle-menu':       'สลับเมนูนำทาง',
      'btn-toggle-theme':      'สลับธีม',
      'btn-toggle-fs':         'สลับโหมดเต็มหน้าจอ',
      'lang-label':            'ภาษา',
      'badge-live':            'ใช้งานได้',
      'badge-soon':            'เร็วๆ นี้',
      'badge-new':             'ใหม่',
      'badge-public':          'สาธารณะ',
      'badge-proprietary':     'กรรมสิทธิ์',
      'badge-visual-editor':   'โปรแกรมแก้ไขแบบภาพ',
      'btn-open-app':          'เปิดแอป',
      'btn-learn-more':        'เรียนรู้เพิ่มเติม',
      'btn-view-github':       'ดูบน GitHub',
      'btn-launch':            'เปิดใช้งาน',
      'btn-install-app':       'ติดตั้งแอป',
      'nav-home-aria':         'กลับไปหน้าหลัก Peppy Vibe',
      'footer-tagline':        'ห้องปฏิบัติการซอฟต์แวร์งานอดิเรก — Python & JavaScript',
      'footer-open-source':    'โอเพนซอร์ส',
      'footer-client-side':    'ทำงานในเบราว์เซอร์ทั้งหมด',
      'footer-no-data':        'ไม่มีการเก็บข้อมูล',
      'footer-offline':        'ใช้งานออฟไลน์ได้',
      'footer-contact':        'ติดต่อเรา',
      'root-hero-line1':       'สร้างสิ่งที่',
      'root-hero-accent':      'Peppy',
      'root-hero-sub':         'ห้องปฏิบัติการซอฟต์แวร์งานอดิเรกที่สร้างเครื่องมือนักพัฒนา ไปป์ไลน์ข้อมูล และการทดลอง AI',
      'root-cta-explore':      'สำรวจ Peppy Tools',
      'root-cta-github':       'ดูบน GitHub',
      'root-since':            'ตั้งแต่มีนาคม 2026',
      'root-section-featured': 'แนะนำ',
      'root-section-software': 'ซอฟต์แวร์',
      'root-section-python':   'แพ็กเกจและเครื่องมือ Python',
      'card-peppy-tools-desc':        'เครื่องมือเบราว์เซอร์ฝั่งไคลเอนต์ 9 รายการ — เครื่องมือ PDF, บันทึกย่อ, ตัวสร้างตาราง, เครื่องมือพัฒนา, เครื่องมือสุ่ม, เครื่องมือทีม, QR และอื่นๆ ไม่มีข้อมูลออกจากเบราว์เซอร์ของคุณ',
      'card-form-extractor-desc':     'การดึงข้อมูลเอกสาร AI แบบออฟไลน์จากใบแจ้งหนี้ ใบเสร็จ และแบบฟอร์ม OCR ภาษาไทยระดับดีที่สุด รองรับ OpenAI, Ollama, Anthropic และอื่นๆ',
      'card-spreadsheetql-desc':      'สืบค้นไฟล์ Excel, CSV และ Parquet ด้วย SQL มาตรฐาน — ไม่ต้องใช้ฐานข้อมูล รองรับ JOIN ข้ามชีต, GROUP BY, การรวมและการส่งออก ขับเคลื่อนโดย DuckDB',
      'card-python-scripts-desc':     'คอลเลกชันสคริปต์ Python ที่เติบโตอย่างต่อเนื่อง — การทดลอง ชิ้นส่วนอัตโนมัติ และเครื่องมือเล็กๆ ที่สร้างขึ้นเพื่อความสนุก',
      'card-gtec-desc':               'รักษาสถานะ Teams ให้เป็นสีเขียว แพ็กเกจ CLI Python ที่จำลองการเคลื่อนไหวของเมาส์ในช่วงเวลาทำงานที่กำหนด',
      'card-vlp-desc':                'Visual Link Protocol — ถ่ายโอนไฟล์ระหว่างสองอุปกรณ์โดยใช้เพียงกล้องและหน้าจอผ่าน QR code ไม่ต้องใช้เครือข่าย สาย หรือการจับคู่',
      'portal-eyebrow':        'ฟรี & โอเพนซอร์ส',
      'portal-hero-line1':     'Peppy',
      'portal-hero-accent':    'Tools',
      'portal-hero-sub':       'เครื่องมือเบราว์เซอร์อันทรงพลังที่ทำงานทั้งหมดบนอุปกรณ์ของคุณ ไม่ต้องสมัครสมาชิก ไม่ต้องอัปโหลด ไม่มีการติดตาม',
      'portal-stat-tools':     'เครื่องมือ',
      'portal-stat-features':  'คุณสมบัติ',
      'portal-stat-uploaded':  'อัปโหลด',
      'portal-stat-offline':   'พร้อม',
      'portal-stat-offline-label': 'ออฟไลน์',
      'portal-search-ph':      'ค้นหาเครื่องมือ\u2026',
      'portal-search-aria':    'ค้นหาเครื่องมือ',
      'portal-recent-label':   'ใช้ล่าสุด',
      'portal-privacy':        'ทุกอย่างทำงานในเบราว์เซอร์ของคุณในระบบ ข้อมูลจะไม่ถูกส่งไปยังเซิร์ฟเวอร์ใดๆ เครื่องมือทั้งหมดทำงานออฟไลน์ได้',
      'portal-no-results':     'ไม่พบเครื่องมือที่ตรงกับการค้นหาของคุณ',
      'portal-update-banner':  'มีเวอร์ชันใหม่ — คลิกเพื่อโหลดใหม่',
      'portal-offline-banner': 'คุณออฟไลน์ — เครื่องมือทั้งหมดยังคงทำงานจากแคช',
      'card-notepad-desc':   'โปรแกรมแก้ไขข้อความที่มีคุณสมบัติครบครันทำงานทั้งหมดในเบราว์เซอร์ เปิดและบันทึกไฟล์ท้องถิ่น แสดงตัวอย่าง Markdown + LaTeX แบบเรียลไทม์',
      'card-notepad-f1':     'เปิดและบันทึกไฟล์ท้องถิ่น',
      'card-notepad-f2':     'ค้นหาและแทนที่ด้วย regex และตัวเลือกตัวพิมพ์ใหญ่',
      'card-notepad-f3':     'การตัดคำ ตระกูลแบบอักษร และการควบคุมขนาด',
      'card-notepad-f4':     'ตัวอย่างแยกหน้าจอแบบสด Markdown + LaTeX',
      'card-notepad-f5':     'ส่งออก Markdown เป็น HTML',
      'card-notepad-f6':     'ตัวแปลงตัวพิมพ์ข้อความ',
      'card-table-desc':     'สร้าง จัดรูปแบบ และส่งออกตาราง HTML ฝั่งไคลเอนต์ทั้งหมด',
      'card-table-f1':       'การจัดสไตล์ระดับเซลล์และตาราง',
      'card-table-f2':       'รวม แยก แทรก และลบเซลล์',
      'card-table-f3':       'ส่งออก: HTML, Markdown, LaTeX, CSV',
      'card-pdf-desc':       'เครื่องมือ PDF 18 รายการ — ทั้งหมดฝั่งไคลเอนต์ ไม่ต้องอัปโหลด ไม่มีอะไรออกจากเบราว์เซอร์ของคุณ',
      'card-pdf-f1':         'รวม แยก ดึง ลบ และจัดเรียงหน้าใหม่',
      'card-pdf-f2':         'หมุนหน้า เพิ่มลายน้ำ (พร้อมตำแหน่ง) และเลขหน้า',
      'card-pdf-f3':         'แปลงรูปภาพเป็น PDF และโปรแกรมดู PDF',
      'card-pdf-f4':         'บีบอัด ครอบ ปรับขนาด และ Flatten',
      'card-pdf-f5':         'เพิ่ม/ลบรหัสผ่าน แก้ไข และล้างข้อมูล PDF',
      'card-pdf-editor-desc':  'พื้นที่ทำงาน PDF แบบภาพแบบโต้ตอบ — นำเข้า ดูภาพขนาดย่อหน้า ลากเพื่อจัดเรียงใหม่ และใช้การแก้ไข',
      'card-pdf-editor-f1':    'เปิด/รวม PDF และรูปภาพพร้อมรองรับ PDF ที่เข้ารหัส',
      'card-pdf-editor-f2':    'ลากภาพขนาดย่อของหน้าเพื่อจัดเรียงใหม่',
      'card-pdf-editor-f3':    'ลบ หมุน ครอบ และปรับขนาดหน้า',
      'card-pdf-editor-f4':    'ลายน้ำ เลขหน้า และคำอธิบายข้อความ',
      'card-pdf-editor-f5':    'ส่งออกพร้อมการป้องกันรหัสผ่าน AES-256 และสิทธิ์',
      'card-random-desc':    'เครื่องมือการตัดสินใจและสุ่ม 10 รายการ สำหรับตัวเลือก เกม และกิจกรรม',
      'card-random-f1':      'วงล้อหมุน, ตัวสร้างใช่/ไม่',
      'card-random-f2':      'เครื่องมือเลือกตัวเลือกและเลือกผู้ชนะ',
      'card-random-f3':      'ตัวสร้างตัวเลข ลูกเต๋า เหรียญ ไพ่ และวัน',
      'card-people-desc':    'เครื่องมือ 11 รายการสำหรับทีม ห้องเรียน และกิจกรรม — ตัวเลือกคน สร้างทีม จับคู่ ผัง Secret Santa และอื่นๆ',
      'card-people-f1':      'เครื่องมือเลือกคนแบบสุ่ม เลือกโฮสต์และวิทยากร',
      'card-people-f2':      'สร้างทีม คู่ และกลุ่ม',
      'card-people-f3':      'เช็คชื่อและผังที่นั่ง',
      'card-people-f4':      'Secret Santa พร้อมการเปิดเผยและการส่งออก',
      'card-qr-desc':        'สร้าง สแกน และส่งออก QR code และบาร์โค้ด — ทั้งหมดฝั่งไคลเอนต์ ไม่ต้องอัปโหลด',
      'card-qr-f1':          'ตัวสร้าง QR: URL, ข้อความ, WiFi, vCard, อีเมล, SMS',
      'card-qr-f2':          'ซ้อนโลโก้ เลือกสี และส่งออก QR เป็นชุด',
      'card-qr-f3':          'สแกน QR ผ่านกล้องอุปกรณ์',
      'card-qr-f4':          'ตัวสร้างบาร์โค้ด 15+ รูปแบบ',
      'card-clock-desc':     'เครื่องมือเวลา 5 รายการ — นาฬิกาจับเวลา นับถอยหลัง นาฬิกาโลก โพโมโดโร และนาฬิกาปลุก',
      'card-clock-f1':       'นาฬิกาจับเวลาพร้อมบันทึกรอบ',
      'card-clock-f2':       'ตัวจับเวลาถอยหลังพร้อมตั้งค่าล่วงหน้า',
      'card-clock-f3':       'นาฬิกาโลกสำหรับ 30+ เขตเวลา',
      'card-clock-f4':       'ตัวจับเวลาโพโมโดโร (รอบทำงาน/พัก)',
      'card-clock-f5':       'นาฬิกาปลุกพร้อมแจ้งเตือนเสียง',
      'card-dev-desc':       'เครื่องมือนักพัฒนาทั้งหมดในแอปเดียวพร้อมแถบด้านข้างแบบจัดกลุ่มและยุบได้',
      'card-dev-f1':         'การเข้ารหัสและความปลอดภัย (Base64, URL, Hash, JWT, UUID)',
      'card-dev-f2':         'เครื่องมือข้อความ (Diff, เรียงลำดับ, ลบซ้ำ, สุ่ม, Lorem)',
      'card-dev-f3':         'JSON / YAML / XML (8 เครื่องมือ)',
      'card-dev-f4':         'เครื่องมือสี Timestamps และตัวสร้าง Regex',
      'contact-title':       'ติดต่อเรา',
      'contact-sub':         'ติดต่อทีม Peppy Vibe',
    }
  };

  /* ─────────────────────────────────────────────────────────────────
     ENGINE
     ─────────────────────────────────────────────────────────────── */
  var currentLang = DEFAULT_LANG;

  function detectLang() {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('zh')) return 'zh-CN';
    if (nav.startsWith('th')) return 'th';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('es')) return 'es';
    return DEFAULT_LANG;
  }

  function t(key) {
    var dict = T[currentLang] || T[DEFAULT_LANG];
    return (dict && dict[key] !== undefined) ? dict[key] : (T[DEFAULT_LANG][key] || key);
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      // Only used for pre-approved static template strings
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.documentElement.lang = currentLang;
    // Sync any other open switchers
    document.querySelectorAll('.peppy-lang-select').forEach(function (s) {
      s.value = currentLang;
    });
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations();
  }

  /**
   * Inject a language-selector <select> into a container element.
   * @param {string|HTMLElement} container  CSS selector or element
   * @param {string} [cls]  extra CSS class(es) for the <select>
   */
  function injectSwitcher(container, cls) {
    var wrap = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!wrap) return;

    var sel = document.createElement('select');
    sel.className = 'peppy-lang-select' + (cls ? ' ' + cls : '');
    sel.setAttribute('aria-label', t('lang-label'));
    sel.title = t('lang-label');
    sel.value = currentLang;

    var labels = {
      en: '🌐 EN', es: '🌐 ES', fr: '🌐 FR',
      de: '🌐 DE', 'zh-CN': '🌐 中文', th: '🌐 ไทย'
    };
    SUPPORTED.forEach(function (code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = labels[code] || code;
      if (code === currentLang) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', function () { setLang(this.value); });
    wrap.appendChild(sel);
  }

  /* ─────────────────────────────────────────────────────────────────
     INJECT STYLES for .peppy-lang-select
     ─────────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('peppy-i18n-css')) return;
    var s = document.createElement('style');
    s.id = 'peppy-i18n-css';
    s.textContent = [
      '.peppy-lang-select {',
      '  background: rgba(255,255,255,0.18);',
      '  border: 1px solid rgba(255,255,255,0.28);',
      '  color: #fff;',
      '  padding: 0.28rem 0.65rem;',
      '  border-radius: 20px;',
      '  cursor: pointer;',
      '  font-size: 0.82rem;',
      '  font-family: inherit;',
      '  transition: background 0.2s;',
      '  appearance: none;',
      '  -webkit-appearance: none;',
      '  outline: none;',
      '}',
      '.peppy-lang-select:hover { background: rgba(255,255,255,0.30); }',
      '.peppy-lang-select option { background: #1e1860; color: #fff; }',
      '[data-theme="light"] .peppy-lang-select {',
      '  background: rgba(86,70,245,0.12);',
      '  border-color: rgba(86,70,245,0.28);',
      '  color: #0e0b2e;',
      '}',
      '[data-theme="light"] .peppy-lang-select:hover { background: rgba(86,70,245,0.22); }',
      '[data-theme="light"] .peppy-lang-select option { background: #e0ddfb; color: #0e0b2e; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────────
     AUTO-INJECT switchers into elements with data-i18n-switcher
     ─────────────────────────────────────────────────────────────── */
  function autoInjectSwitchers() {
    document.querySelectorAll('[data-i18n-switcher]').forEach(function (el) {
      if (el.querySelector('.peppy-lang-select')) return; // already injected
      injectSwitcher(el, el.getAttribute('data-i18n-switcher') || '');
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     INIT — run after DOM is ready
     ─────────────────────────────────────────────────────────────── */
  function init() {
    currentLang = detectLang();
    injectStyles();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        autoInjectSwitchers();
        applyTranslations();
      });
    } else {
      autoInjectSwitchers();
      applyTranslations();
    }
  }

  /* Public API */
  win.PeppyI18n = {
    init: init,
    setLang: setLang,
    t: t,
    injectSwitcher: injectSwitcher,
    currentLang: function () { return currentLang; }
  };

  // Auto-init
  init();

}(window));
