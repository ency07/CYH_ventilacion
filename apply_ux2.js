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
];

for (const p of pages) {
    const fullPath = path.join(__dirname, p);
    replaceInFile(fullPath, [
        // Ensure h1 has font-display but NO uppercase
        [/<h1([^>]*)uppercase([^>]*)>/g, '<h1$1$2>'],
        [/font-display(.*?)uppercase/g, 'font-display$1'],
        
        // Ensure h2, h3, h4 are font-sans and NOT uppercase (unless they are small labels, but usually h2/h3 are titles)
        [/<h2([^>]*)font-display([^>]*)>/g, '<h2$1font-sans font-bold$2>'],
        [/<h3([^>]*)font-display([^>]*)>/g, '<h3$1font-sans font-bold$2>'],
        [/<h4([^>]*)font-display([^>]*)>/g, '<h4$1font-sans font-bold$2>'],
        
        [/<h2([^>]*)uppercase([^>]*)>/g, '<h2$1$2>'],
        [/<h3([^>]*)uppercase([^>]*)>/g, '<h3$1$2>'],
        [/<h4([^>]*)uppercase([^>]*)>/g, '<h4$1$2>'],
        
        // Remove tracking-wide from h2/h3/h4 since it's an Inter font now, tight is better
        [/<h2([^>]*)tracking-wide([^>]*)>/g, '<h2$1$2>'],
        [/<h3([^>]*)tracking-wide([^>]*)>/g, '<h3$1$2>'],
        [/<h4([^>]*)tracking-wide([^>]*)>/g, '<h4$1$2>'],
        
        [/<h2([^>]*)tracking-wider([^>]*)>/g, '<h2$1$2>'],
        [/<h3([^>]*)tracking-wider([^>]*)>/g, '<h3$1$2>'],
        [/<h4([^>]*)tracking-wider([^>]*)>/g, '<h4$1$2>'],
        
        // Specific button cleanups to standard px-8 py-3.5 or px-6 py-2.5
        [/px-10 py-5/g, 'px-8 py-3.5'],
        [/px-5 py-2\.5/g, 'px-6 py-2.5'],
        
        // Make sure Navbar active effect is clean
        [/bg-accent-cyan\/10/g, 'bg-bg-secondary/50'],
    ]);
}
