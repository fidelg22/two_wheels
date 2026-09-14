import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminGallery from "@/pages/admin/Gallery";
import AdminCategories from "@/pages/admin/Categories";
import { useAuth } from "@/context/AuthContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes with Navbar */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <CartDrawer />
              <Routes>
                <Route path="/"                    element={<Home />} />
                <Route path="/catalogo"             element={<Catalog />} />
                <Route path="/catalogo/:categoria"  element={<Catalog />} />
                <Route path="/producto/:id"         element={<ProductDetail />} />
              </Routes>
              <Footer />
            </>
          }
        />

        {/* Admin routes — no public Navbar */}
        <Route path="/admin/login" element={<AdminLogin />} />
        {/* Keep direct routes for compatibility */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="productos"  element={<AdminProducts />} />
          <Route path="galeria"    element={<AdminGallery />} />
          <Route path="categorias" element={<AdminCategories />} />
        </Route>
      </Routes>
    </>
  );
}
