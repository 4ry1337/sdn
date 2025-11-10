import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import { GraphProvider } from "@/features/topology";

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
            <GraphProvider
              default_params={{
                centerForce: 0.5,
                repelForce: 10,
                linkForce: 0.5,
                linkDistance: 250,
              }}
              default_filters={{
                showControllers: true,
                showSwitches: true,
                showHosts: true,
              }}
            >
              {children}
            </GraphProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html >
  );
}
