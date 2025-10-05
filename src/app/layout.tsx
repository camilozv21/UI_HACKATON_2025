import type { Metadata } from "next";
import "./globals.css";

import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';

import { Manrope } from "next/font/google";
import Header from "@/components/Header/Header";
import { MantineProvider } from "@mantine/core";
import StoreProvider from "./StoreProvider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "700"] 
});

export const metadata: Metadata = {
  title: "A World Away: Hunting for Exoplanets",
  description: "Data from several different space-based exoplanet surveying missions have enabled discovery of thousands of new planets outside our solar system, but most of these exoplanets were identified manually. With advances in artificial intelligence and machine learning (AI/ML), it is possible to automatically analyze large sets of data collected by these missions to identify exoplanets. Your challenge is to create an AI/ML model that is trained on one or more of the open-source exoplanet datasets offered by NASA and that can analyze new data to accurately identify exoplanets.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <StoreProvider>
      <html lang="en">
        <body
          className={manrope.variable}
        >
          <MantineProvider>
            <Header />
            {children}
          </MantineProvider>
        </body>
      </html>
    </StoreProvider>
  );
}
