"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: ["400"],
});

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname?.startsWith("/suspended") || pathname?.startsWith("/banned");

  return (
    <>
      {!hideChrome && <Header pacificoClassName={pacifico.className} />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}


