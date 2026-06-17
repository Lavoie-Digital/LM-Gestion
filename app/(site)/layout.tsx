import type { ReactNode } from "react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
