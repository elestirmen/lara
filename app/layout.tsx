import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {title: "Lara'nın Dersleri · Küçük adımlar, büyük keşifler", description: 'Lara için oyunlarla, hikâyelerle ve keşiflerle dolu bir öğrenme dünyası. 2. sınıf, 2026–2027.', manifest: '/manifest.webmanifest', icons: {icon: '/icon.svg', apple:'/icon-192.png'}};
export const viewport: Viewport = {width:'device-width', initialScale:1, themeColor:'#357b62'};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="tr"><body>{children}</body></html>}
