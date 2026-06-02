import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/crm", "/crm/"],
    },
    sitemap: "https://cyh-ingenieria.com/sitemap.xml",
  };
}
