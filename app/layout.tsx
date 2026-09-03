import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "cutly — бърз видео редактор", description: "Изрежи, ускори, добави музика и субтитри, после изнеси готово видео." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="bg"><body>{children}</body></html>; }
