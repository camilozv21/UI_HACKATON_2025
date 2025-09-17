import type { Metadata } from "next";
import "./globals.css";

import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

import { Manrope } from "next/font/google";
import Header from "@/components/Header/Header";
import { MantineProvider } from "@mantine/core";
import { auth } from "@/auth";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "700"] 
});

export const metadata: Metadata = {
  title: "ADA compliance | Generate Descriptions Online",
  description: "Boost video accessibility and SEO with AI-generated, ADA-compliant descriptions in multiple languages. Expand your global reach and improve user experience.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body
        className={manrope.variable}
      >
        <MantineProvider>
          <Header session={session} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
