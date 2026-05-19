import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const getItemPrice = (product) => {
    if (product.isBundle) {
      return Number(product.bundlePrice || 0);
    }
    if (product.isDiscounted && product.discountedPrice > 0) {
      return Number(product.discountedPrice);
    }
    return Number(product.price || 0);
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const addBundleToCart = (bundle, quantity = 1) => {
    const virtualProduct = {
      _id: `bundle_${bundle._id}`,
      name: bundle.name,
      price: bundle.originalPrice,
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      discountPercentage: bundle.discountPercentage,
      isBundle: true,
      bundleId: bundle._id,
      image: bundle.products?.[0]?.image || "",
      products: bundle.products,
    };

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === virtualProduct._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === virtualProduct._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product: virtualProduct, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item.product) * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addBundleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        getItemPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
