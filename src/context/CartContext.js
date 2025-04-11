import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prevCart => {
      // Check if product with same ID and color already exists in cart
      const existingProductIndex = prevCart.findIndex(
        item => item.id === product.id && item.selectedColor === product.selectedColor
      );

      if (existingProductIndex >= 0) {
        // Update quantity if product exists
        const updatedCart = [...prevCart];
        updatedCart[existingProductIndex].quantity += product.quantity;
        return updatedCart;
      } else {
        // Add new product to cart
        return [...prevCart, product];
      }
    });
  };

  const removeFromCart = (productId, color) => {
    setCart(prevCart => 
      prevCart.filter(item => !(item.id === productId && item.selectedColor === color))
    );
  };

  const updateQuantity = (productId, color, newQuantity) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId && item.selectedColor === color
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 