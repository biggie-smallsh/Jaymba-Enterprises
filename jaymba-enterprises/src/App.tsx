import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import InteractionFX from "./components/InteractionFX";
import GuideHelper from "./components/GuideHelper";
import { CartProvider } from "./lib/cart";
import Home from "./pages/Home";
import Products from "./pages/Products";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="*" element={<Home />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <InteractionFX />
      <GuideHelper />
    </CartProvider>
  );
}
