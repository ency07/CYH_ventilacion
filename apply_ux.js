const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
    }
}

const pages = [
    'app/(marketing)/catalogo/page.tsx',
    'app/(marketing)/contacto/page.tsx',
    'app/(marketing)/empresa/page.tsx',
    'app/(marketing)/proyectos/page.tsx',
    'app/(marketing)/servicios/page.tsx',
    'components/marketing/HeroSection.tsx',
    'components/marketing/ServicesSection.tsx',
    'components/marketing/ProjectsSection.tsx',
    'components/marketing/CTASection.tsx',
    'components/layout/Navbar.tsx'
];

for (const p of pages) {
    const fullPath = path.join(__dirname, p);
    replaceInFile(fullPath, [
        // 1. Quitar ALL CAPS de los títulos. Buscamos donde se usa "uppercase" en los h1/h2
        [/<h1([^>]*)uppercase([^>]*)>/g, '<h1$1$2>'],
        [/<h2([^>]*)uppercase([^>]*)>/g, '<h2$1$2>'],
        [/uppercase leading-tight/g, 'leading-tight'],
        [/uppercase text-text-primary/g, 'text-text-primary'],
        
        // 2. Refinar botones y CTA
        [/px-10 py-5/g, 'px-8 py-3.5'],
        [/px-5 py-2\.5/g, 'px-6 py-2.5'],
        
        // 3. Quitar escalas (zoom) agresivas y reemplazar por hover premium
        [/hover:scale-105/g, 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300'],
        [/hover:shadow-md/g, 'hover:shadow-lg hover:-translate-y-0.5'],
        
        // 4. Navbar clean
        [/bg-background\/88 backdrop-blur-xl/g, 'bg-background/90 backdrop-blur-2xl'],
    ]);
}
