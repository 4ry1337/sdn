import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import { GraphProvider } from "@/widgets/topology_viewer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: {
    default: "OpenVis",
    template: `%s | App`,
  },
  description: "SDN Network Visualizor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={0}>
            <GraphProvider>
              {children}
              <Toaster />
            </GraphProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
