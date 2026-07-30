import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Safra | Discover Tunisia",
  description: "Find your perfect stay and rent a reliable car anywhere in Tunisia.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
