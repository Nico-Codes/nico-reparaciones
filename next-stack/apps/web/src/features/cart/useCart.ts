import { useEffect, useMemo, useState } from 'react';
import { cartStorage } from './storage';

export function useCartCount() {
  const [count, setCount] = useState(() => cartStorage.count());

  useEffect(() => {
    const update = () => setCount(cartStorage.count());
    window.addEventListener('nico-next-cart-changed', update as EventListener);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('nico-next-cart-changed', update as EventListener);
      window.removeEventListener('storage', update);
    };
  }, []);

  return count;
}

export function useCartItems() {
  const [items, setItems] = useState(() => cartStorage.getItems());

  useEffect(() => {
    const update = () => setItems(cartStorage.getItems());
    window.addEventListener('nico-next-cart-changed', update as EventListener);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('nico-next-cart-changed', update as EventListener);
      window.removeEventListener('storage', update);
    };
  }, []);

  return useMemo(() => ({
    items,
    setItems: cartStorage.setItems,
    add: cartStorage.add,
    update: cartStorage.update,
    remove: cartStorage.remove,
    clear: cartStorage.clear,
  }), [items]);
}
