import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Navbar } from "@/components/navbar";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

// Embed metadata for Farcaster sharing
const frame = {
  version: "1",
  imageUrl: `${appUrl}/opengraph-image.png`,
  button: {
    title: "Launch vamos",
    action: {
      type: "launch_frame",
      name: "vamos",
      url: appUrl,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#FCFDF5",
    },
  },
};

export const metadata: Metadata = {
  title: "Vamos.Fun",
  description: "Vamos Predictable Market",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Vamos.Fun",
    description: "Vamos Predictable Market",
    images: [`${appUrl}/opengraph-image.png`],
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Providers>
            <Navbar />
            <main className="flex-1 pt-24">{children}</main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
