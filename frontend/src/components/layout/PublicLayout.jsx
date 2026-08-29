import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingActions from "../common/FloatingActions";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
