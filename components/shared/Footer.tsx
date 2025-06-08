import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <Link href="/">
          <div className="flex">
            <h1 className="font-bold text-2xl text-orange-500">G</h1>
            <h2 className="font-bold text-2xl">Gegonos</h2>
          </div>
        </Link>

        <p>2025 Gegonos. All Rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
