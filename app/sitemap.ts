import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cyh-ingenieria.com";
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/catalogo`, lastModified: new Date() },
    { url: `${baseUrl}/servicios`, lastModified: new Date() },
    { url: `${baseUrl}/proyectos`, lastModified: new Date() },
    { url: `${baseUrl}/empresa`, lastModified: new Date() },
    { url: `${baseUrl}/contacto`, lastModified: new Date() },
  ];
}
