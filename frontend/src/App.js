import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { SiteProvider } from "@/context/SiteContext";
import SiteLayout, { Loader } from "@/components/site/SiteLayout";
import Splash from "@/components/site/Splash";
import AdminLayout, { ProtectedRoute } from "@/pages/admin/AdminLayout";

import Home from "@/pages/public/Home";
import Courses from "@/pages/public/Courses";
import CourseDetail from "@/pages/public/CourseDetail";
import Services from "@/pages/public/Services";
import About from "@/pages/public/About";
import Trainers from "@/pages/public/Trainers";
import Batches from "@/pages/public/Batches";
import Reviews from "@/pages/public/Reviews";
import FAQ from "@/pages/public/FAQ";
import Blog from "@/pages/public/Blog";
import BlogDetail from "@/pages/public/BlogDetail";
import Contact from "@/pages/public/Contact";
import Enquiry from "@/pages/public/Enquiry";
import Gallery from "@/pages/public/Gallery";
import Videos from "@/pages/public/Videos";
import Events from "@/pages/public/Events";
import VerifyCertificate from "@/pages/public/VerifyCertificate";
import PaymentCheckout from "@/pages/public/PaymentCheckout";
import { Privacy, Terms } from "@/pages/public/Legal";

import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Enquiries from "@/pages/admin/Enquiries";
import Students from "@/pages/admin/Students";
import Payments from "@/pages/admin/Payments";
import ResourceManager from "@/pages/admin/ResourceManager";
import Technologies from "@/pages/admin/Technologies";
import Settings from "@/pages/admin/Settings";
import ContactMessages from "@/pages/admin/ContactMessages";
import Users from "@/pages/admin/Users";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="App">
      <Splash />
      <BrowserRouter>
        <AuthProvider>
          <SiteProvider>
            <ScrollToTop />
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:slug" element={<CourseDetail />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/trainers" element={<Trainers />} />
                  <Route path="/batches" element={<Batches />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/verify" element={<VerifyCertificate />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/enquiry" element={<Enquiry />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                </Route>

                <Route path="/payment/checkout" element={<PaymentCheckout />} />

                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="enquiries" element={<Enquiries />} />
                  <Route path="students" element={<Students />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="messages" element={<ContactMessages />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="users" element={<Users />} />
                  <Route path="technologies" element={<Technologies />} />
                  <Route path="r/:resource" element={<ResourceManager />} />
                </Route>
              </Routes>
            </Suspense>
            <Toaster position="top-right" richColors />
          </SiteProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
