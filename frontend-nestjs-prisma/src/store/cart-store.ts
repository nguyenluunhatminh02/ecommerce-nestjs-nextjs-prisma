import { create } from 'zustand';
import { CartResponse, CartItemResponse } from '@/types';
import { cartService } from '@/services/cart.service';

interface CartState {
  cart: CartResponse | null;
  isLoading: boolean;
  itemCount: number;

  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  fetchItemCount: () => Promise<void>;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  isLoading: false,
  itemCount: 0,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const cart = await cartService.getCart();
      set({ cart, itemCount: cart.totalItems, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity, variantId) => {
    try {
      set({ isLoading: true });
      const cart = await cartService.addToCart({ productId, quantity, variantId });
      set({ cart, itemCount: cart.totalItems, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('Không thể thêm vào giỏ hàng');
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      const cart = await cartService.updateCartItem(itemId, quantity);
      set({ cart, itemCount: cart.totalItems });
    } catch {
      throw new Error('Không thể cập nhật số lượng');
    }
  },

  removeItem: async (itemId) => {
    try {
      const cart = await cartService.removeCartItem(itemId);
      set({ cart, itemCount: cart.totalItems });
    } catch {
      throw new Error('Không thể xóa sản phẩm');
    }
  },

  clearCart: async () => {
    try {
      await cartService.clearCart();
      set({ cart: null, itemCount: 0 });
    } catch {
      throw new Error('Không thể xóa giỏ hàng');
    }
  },

  applyCoupon: async (code) => {
    try {
      const cart = await cartService.applyCoupon(code);
      set({ cart });
    } catch {
      throw new Error('Mã giảm giá không hợp lệ');
    }
  },

  removeCoupon: async () => {
    try {
      const cart = await cartService.removeCoupon();
      set({ cart });
    } catch {
      throw new Error('Không thể xóa mã giảm giá');
    }
  },

  fetchItemCount: async () => {
    try {
      const count = await cartService.getCartItemCount();
      set({ itemCount: count });
    } catch {
      // silently fail
    }
  },
}));
