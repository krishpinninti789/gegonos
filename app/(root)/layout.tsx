import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen m-2 flex-col">
      <Header />
      <main className="flex-1">
        {children}
        <Toaster position="top-right" />
      </main>
      <Footer />
    </div>
  );
}
