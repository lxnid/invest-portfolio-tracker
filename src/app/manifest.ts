import { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "CSE Tracker",
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/demo.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Portfolio Tracker Dashboard",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard",
        description: "View your portfolio dashboard",
      },
      {
        name: "Portfolio",
        short_name: "Portfolio",
        url: "/portfolio",
        description: "View and manage your holdings",
      },
      {
        name: "Market",
        short_name: "Market",
        url: "/market",
        description: "Browse CSE market data",
      },
    ],
  };
}
