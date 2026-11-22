import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/pwa/brand-mark";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
    // Maskable: the mark stays inside the 80% safe zone.
    { id: "maskable", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const key = String(await id);
  const size = key === "maskable" ? 512 : Number(key);
  const padding = key === "maskable" ? size * 0.2 : size * 0.08;
  return new ImageResponse(<BrandMark size={size} padding={padding} />, { width: size, height: size });
}
