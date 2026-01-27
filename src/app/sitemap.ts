import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/login",
    "/dashboard",
    "/portfolio",
    "/market",
    "/transactions",
    "/analytics",
    "/savings",
    "/alerts",
  ].map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
