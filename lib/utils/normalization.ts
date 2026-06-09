export function normalizeCity(city: string | null | undefined): string {
  if (!city) return "";
  
  let cleaned = city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .trim();

  // Strip trailing 'q' characters from typos like "barranquillaq", "medellinq", "caliq"
  if (cleaned.endsWith("q")) {
    const stripped = cleaned.slice(0, -1).trim();
    const knownCities = [
      "barranquilla", "bogota", "medellin", "cali", "cartagena", "monteria", 
      "bucaramanga", "pereira", "manizales", "armenia", "ibague", "neiva", 
      "pasto", "popayan", "villavicencio", "santa marta", "valledupar", 
      "sincelejo", "riohacha", "quibdo", "florencia", "yopal", "tunja", 
      "arauca", "mocoa"
    ];
    if (knownCities.includes(stripped)) {
      cleaned = stripped;
    }
  }

  // Map to standard Title Case city names
  const cityMap: Record<string, string> = {
    "barranquilla": "Barranquilla",
    "bogota": "Bogotá",
    "bogota d.c.": "Bogotá",
    "bogotadc": "Bogotá",
    "medellin": "Medellín",
    "cali": "Cali",
    "cartagena": "Cartagena",
    "cartagena de indias": "Cartagena",
    "monteria": "Montería",
    "bucaramanga": "Bucaramanga",
    "pereira": "Pereira",
    "manizales": "Manizales",
    "armenia": "Armenia",
    "ibague": "Ibagué",
    "neiva": "Neiva",
    "pasto": "Pasto",
    "popayan": "Popayán",
    "villavicencio": "Villavicencio",
    "santa marta": "Santa Marta",
    "santamarta": "Santa Marta",
    "valledupar": "Valledupar",
    "sincelejo": "Sincelejo",
    "riohacha": "Riohacha",
    "quibdo": "Quibdó",
    "florencia": "Florencia",
    "yopal": "Yopal",
    "tunja": "Tunja",
    "arauca": "Arauca",
    "mocoa": "Mocoa"
  };

  return cityMap[cleaned] || (city.trim() ? city.trim().charAt(0).toUpperCase() + city.trim().slice(1) : "");
}

export const departmentCitiesMap: Record<string, string> = {
  "Barranquilla": "Atlántico",
  "Medellín": "Antioquia",
  "Bogotá": "Cundinamarca",
  "Cali": "Valle del Cauca",
  "Cartagena": "Bolívar",
  "Montería": "Córdoba",
  "Bucaramanga": "Santander",
  "Pereira": "Risaralda",
  "Manizales": "Caldas",
  "Armenia": "Quindío",
  "Ibagué": "Tolima",
  "Neiva": "Huila",
  "Pasto": "Nariño",
  "Popayán": "Cauca",
  "Villavicencio": "Meta",
  "Santa Marta": "Magdalena",
  "Valledupar": "Cesar",
  "Sincelejo": "Sucre",
  "Riohacha": "La Guajira",
  "Quibdó": "Chocó",
  "Florencia": "Caquetá",
  "Yopal": "Casanare",
  "Tunja": "Boyacá",
  "Arauca": "Arauca",
  "Mocoa": "Putumayo"
};

export function getDepartmentByCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const normalized = normalizeCity(city);
  return departmentCitiesMap[normalized] || null;
}
