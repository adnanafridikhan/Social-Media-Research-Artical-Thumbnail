import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidPipeline - YouTube Video Builder",
  description: "Go from idea to upload-ready YouTube package in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "font-sans rounded-2xl border border-gray-100 shadow-card-hover",
              title: "font-semibold text-gray-900",
              description: "text-gray-500",
              success: "border-emerald-100",
              error: "border-red-100",
            },
          }}
        />
      </body>
    </html>
  );
}
