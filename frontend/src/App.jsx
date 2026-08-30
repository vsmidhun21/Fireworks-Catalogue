import { Routes, Route } from "react-router-dom";

import PublicLayout from "./components/layout/PublicLayout";
import Home from "./pages/public/Home";
import Products from "./pages/public/Products";
import ProductDetail from "./pages/public/ProductDetail";
import CategoryPage from "./pages/public/CategoryPage";
import GiftBoxes from "./pages/public/GiftBoxes";
import GiftBoxDetail from "./pages/public/GiftBoxDetail";
import Payment from "./pages/public/Payment";
import Estimate from "./pages/public/Estimate";
import CustomerDetails from "./pages/public/CustomerDetails";
import Confirmation from "./pages/public/Confirmation";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Safety from "./pages/public/Safety";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import Terms from "./pages/public/Terms";
import NotFound from "./pages/public/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminEstimates from "./pages/admin/AdminEstimates";
import AdminEstimateDetail from "./pages/admin/AdminEstimateDetail";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/gift-boxes" element={<GiftBoxes />} />
        <Route path="/gift-boxes/:slug" element={<GiftBoxDetail />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/estimate" element={<Estimate />} />
        <Route path="/estimate/customer-details" element={<CustomerDetails />} />
        <Route path="/estimate/confirmation/:estimateNumber" element={<Confirmation />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="estimates" element={<AdminEstimates />} />
        <Route path="estimates/:id" element={<AdminEstimateDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:id" element={<AdminCustomerDetail />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
