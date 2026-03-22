import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/cart.service', () => ({
  cartService: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),      // (itemId: string, quantity: number) => CartResponse
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),            // () => void
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
    getCartItemCount: vi.fn(),
  },
}));

import { useCartStore } from '@/store/cart-store';
import { cartService } from '@/services/cart.service';

const makeCart = (overrides = {}) => ({
  id: 'cart-1',
  items: [],
  totalItems: 0,
  subtotal: 0,
  discount: 0,
  total: 0,
  couponCode: null,
  ...overrides,
});

const makeItem = (overrides = {}) => ({
  id: 'item-1',
  productId: 'prod-1',
  productName: 'Test Product',
  productSlug: 'test-product',
  productImage: null,
  variantId: null,
  variantName: null,
  shopId: 'shop-1',
  shopName: 'Test Shop',
  shopSlug: 'test-shop',
  price: 50000,
  quantity: 1,
  subtotal: 50000,
  maxQuantity: 10,
  ...overrides,
});

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ cart: null, isLoading: false, itemCount: 0 });
    vi.clearAllMocks();
  });

  it('initial state is empty', () => {
    const state = useCartStore.getState();
    expect(state.cart).toBeNull();
    expect(state.itemCount).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  it('fetchCart loads cart and updates itemCount', async () => {
    const cart = makeCart({ items: [makeItem()], totalItems: 1, subtotal: 50000, total: 50000 });
    vi.mocked(cartService.getCart).mockResolvedValue(cart);

    await useCartStore.getState().fetchCart();

    const state = useCartStore.getState();
    expect(state.cart?.id).toBe('cart-1');
    expect(state.itemCount).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('fetchCart handles error gracefully', async () => {
    vi.mocked(cartService.getCart).mockRejectedValue(new Error('Network error'));

    await useCartStore.getState().fetchCart();

    const state = useCartStore.getState();
    expect(state.cart).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('addToCart updates cart state with new item', async () => {
    const updatedCart = makeCart({
      items: [makeItem()],
      totalItems: 1,
      subtotal: 50000,
      total: 50000,
    });
    vi.mocked(cartService.addToCart).mockResolvedValue(updatedCart);

    await useCartStore.getState().addToCart('prod-1', 1);

    const state = useCartStore.getState();
    expect(state.cart?.totalItems).toBe(1);
    expect(state.itemCount).toBe(1);
    expect(cartService.addToCart).toHaveBeenCalledWith({
      productId: 'prod-1',
      quantity: 1,
      variantId: undefined,
    });
  });

  it('updateQuantity calls updateCartItem and refreshes state', async () => {
    const updatedCart = makeCart({
      items: [makeItem({ quantity: 3, subtotal: 150000 })],
      totalItems: 3,
      subtotal: 150000,
      total: 150000,
    });
    vi.mocked(cartService.updateCartItem).mockResolvedValue(updatedCart);

    await useCartStore.getState().updateQuantity('item-1', 3);

    const state = useCartStore.getState();
    expect(state.cart?.totalItems).toBe(3);
    expect(cartService.updateCartItem).toHaveBeenCalledWith('item-1', 3);
  });

  it('removeItem removes item from cart', async () => {
    const emptyCart = makeCart();
    vi.mocked(cartService.removeCartItem).mockResolvedValue(emptyCart);
    useCartStore.setState({ cart: makeCart({ items: [makeItem()], totalItems: 1 }), itemCount: 1 });

    await useCartStore.getState().removeItem('item-1');

    const state = useCartStore.getState();
    expect(state.cart?.totalItems).toBe(0);
    expect(state.itemCount).toBe(0);
  });

  it('clearCart resets cart to null', async () => {
    vi.mocked(cartService.clearCart).mockResolvedValue(undefined);
    useCartStore.setState({ cart: makeCart({ items: [makeItem()], totalItems: 1 }), itemCount: 1 });

    await useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.cart).toBeNull();
    expect(state.itemCount).toBe(0);
  });

  it('applyCoupon applies coupon code to cart', async () => {
    const discountedCart = makeCart({ couponCode: 'SAVE10', discount: 10000, total: 40000, subtotal: 50000 });
    vi.mocked(cartService.applyCoupon).mockResolvedValue(discountedCart);

    await useCartStore.getState().applyCoupon('SAVE10');

    const state = useCartStore.getState();
    expect(state.cart?.couponCode).toBe('SAVE10');
    expect(state.cart?.discount).toBe(10000);
    expect(cartService.applyCoupon).toHaveBeenCalledWith('SAVE10');
  });

  it('removeCoupon clears coupon from cart', async () => {
    const cartWithoutCoupon = makeCart({ couponCode: null, discount: 0, total: 50000, subtotal: 50000 });
    vi.mocked(cartService.removeCoupon).mockResolvedValue(cartWithoutCoupon);
    useCartStore.setState({ cart: makeCart({ couponCode: 'SAVE10', discount: 10000 }) });

    await useCartStore.getState().removeCoupon();

    const state = useCartStore.getState();
    expect(state.cart?.couponCode).toBeNull();
    expect(state.cart?.discount).toBe(0);
  });
});
