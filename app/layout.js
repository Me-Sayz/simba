import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import AppShell from "@/components/AppShell"
import { CartProvider } from "@/context/CartContext"
import { ThemeProvider } from "next-themes"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata = { title: "SIMBA", description: "Monitoring stok & kasir untuk UMKM" }

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
          <CartProvider>
            <AppShell />
            <div id="main-content" className="md:ml-60 pb-20 md:pb-6 transition-all duration-300 min-h-screen bg-gray-100 dark:bg-gray-950">
              {children}
            </div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}