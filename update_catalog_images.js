const fs = require('fs');

let content = fs.readFileSync('app/(marketing)/catalogo/page.tsx', 'utf8');

// 1. Add image to interface
content = content.replace('eficiencia: "IE2" | "IE3" | "IE4" | "N/A";', 'eficiencia: "IE2" | "IE3" | "IE4" | "N/A";\n  image: string;');

// 2. Add specific images to each product
content = content.replace('name: "Ventilador Axial AX-800 Premium",', 'name: "Ventilador Axial AX-800 Premium",\n    image: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Ventilador Axial AX-1200 Heavy Duty",', 'name: "Ventilador Axial AX-1200 Heavy Duty",\n    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Ventilador Centrífugo CN-400 Curva Atrás",', 'name: "Ventilador Centrífugo CN-400 Curva Atrás",\n    image: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Ventilador Centrífugo CN-630 Curva Adelante",', 'name: "Ventilador Centrífugo CN-630 Curva Adelante",\n    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Extractor Helicoidal Mural EXT-500",', 'name: "Extractor Helicoidal Mural EXT-500",\n    image: "https://images.unsplash.com/photo-1522069818816-e41c463cb9bb?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Extractor Industrial de Tejado EXT-900",', 'name: "Extractor Industrial de Tejado EXT-900",\n    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Unidad Manejadora HVAC Industrial PKG-20",', 'name: "Unidad Manejadora HVAC Industrial PKG-20",\n    image: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Colector de Polvo Tipo Baghouse CP-8",', 'name: "Colector de Polvo Tipo Baghouse CP-8",\n    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Ductería Rectangular de Alta Presión DCT-GALV",', 'name: "Ductería Rectangular de Alta Presión DCT-GALV",\n    image: "https://images.unsplash.com/photo-1504917595217-d4f50260eb32?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Motor Trifásico Super Premium IE4-20",', 'name: "Motor Trifásico Super Premium IE4-20",\n    image: "https://images.unsplash.com/photo-1632731557002-99577c3eecf8?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Tablero Eléctrico SCADA T-PLC-440",', 'name: "Tablero Eléctrico SCADA T-PLC-440",\n    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=500&h=500",');
content = content.replace('name: "Sistema de Extracción Portuaria SYS-MON",', 'name: "Sistema de Extracción Portuaria SYS-MON",\n    image: "https://images.unsplash.com/photo-1518625624795-3652f19ea3ab?auto=format&fit=crop&q=80&w=500&h=500",');

// Rewrite the Layout Grid
content = content.replace('grid-cols-1 lg:grid-cols-5 gap-8', 'grid-cols-1 lg:grid-cols-12 gap-8 items-center');

// Add Image Column
const imageCol = `
                  {/* Left Column: Image */}
                  <div className="lg:col-span-3 flex justify-center items-center h-full">
                    <div className="w-full aspect-square rounded-sm overflow-hidden border border-border-subtle bg-bg-primary p-2">
                      <div 
                        className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 hover:scale-105 rounded-sm"
                        style={{ backgroundImage: \`url(\${product.image})\` }}
                      />
                    </div>
                  </div>
`;

content = content.replace('{/* Left Column: Product header, Curva & badging */}', imageCol + '\n                  {/* Center Column: Product header, Curva & badging */}');

// Adjust existing columns from 2 and 3 to 4 and 5
content = content.replace('className="lg:col-span-2 space-y-6 flex flex-col justify-between"', 'className="lg:col-span-4 space-y-6 flex flex-col justify-between"');
content = content.replace('className="lg:col-span-3 flex flex-col justify-between gap-6"', 'className="lg:col-span-5 flex flex-col justify-between gap-6"');

// Reduce curve height to fit the new tighter layout
content = content.replace('className="h-20 w-full relative flex items-end"', 'className="h-16 w-full relative flex items-end"');

fs.writeFileSync('app/(marketing)/catalogo/page.tsx', content, 'utf8');
console.log('Catalogo layout updated with images!');
