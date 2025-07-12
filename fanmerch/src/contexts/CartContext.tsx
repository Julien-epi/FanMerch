import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

// Types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  priceInCHZ: number;
  priceInFanToken: number;
  fanTokenAddress: string;
  image: string;
  category: string;
  teamId?: string;
  teamName?: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  totalPriceInCHZ: number;
  totalPriceInFanToken: number;
}

export type PaymentMethod = 'CHZ' | 'FAN_TOKEN';

// Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

// État initial
const initialState: CartState = {
  items: [],
  isOpen: false,
  totalItems: 0,
  totalPrice: 0,
  totalPriceInCHZ: 0,
  totalPriceInFanToken: 0,
};

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      let updatedItems: CartItem[];
      if (existingItem) {
        updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedItems = [...state.items, { ...action.payload, quantity: 1 }];
      }

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalPriceInCHZ = updatedItems.reduce((sum, item) => sum + (item.priceInCHZ * item.quantity), 0);
      const totalPriceInFanToken = updatedItems.reduce((sum, item) => sum + (item.priceInFanToken * item.quantity), 0);

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        totalPriceInCHZ,
        totalPriceInFanToken,
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalPriceInCHZ = updatedItems.reduce((sum, item) => sum + (item.priceInCHZ * item.quantity), 0);
      const totalPriceInFanToken = updatedItems.reduce((sum, item) => sum + (item.priceInFanToken * item.quantity), 0);

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        totalPriceInCHZ,
        totalPriceInFanToken,
      };
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalPriceInCHZ = updatedItems.reduce((sum, item) => sum + (item.priceInCHZ * item.quantity), 0);
      const totalPriceInFanToken = updatedItems.reduce((sum, item) => sum + (item.priceInFanToken * item.quantity), 0);

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice,
        totalPriceInCHZ,
        totalPriceInFanToken,
      };
    }

    case 'CLEAR_CART':
      return initialState;

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    default:
      return state;
  }
}

// Context
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

// Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personnalisé
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const { state, dispatch } = context;

  // Fonctions helper
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  return {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
  };
} 