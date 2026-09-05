import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { cartApi } from "../services/cartApi.js";
import { MAX_ITEM_QUANTITY, guestCart, summarise } from "../services/guestCart.js";

export const CartContext = createContext(null);

const EMPTY = { items: [], subtotal: 0, total: 0, count: 0 };

// Menu items arriving from the bundled offline fallback have no _id, so they cannot be ordered.
const toLine = (item) => {
  const menuItem = item?._id;
  if (!menuItem) throw new Error("This dish is not available for ordering right now.");
  return { menuItem, name: item.name, image: item.img || item.image || "", unitPrice: Number(item.price) || 0 };
};

export function CartProvider({ children }) {
  const { user, isInitializing } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const mergedFor = useRef(null);
  const mergingUserId = useRef(null);
  const requestGen = useRef(0);
  // Live session identity read at async-completion time; the closure `user` is
  // frozen at effect-run time and cannot report a later logout/user switch.
  const activeUserId = useRef(null);

  const readGuest = useCallback(() => setCart(summarise(guestCart.read())), []);

  useEffect(() => {
    if (isInitializing) return undefined;

    const myUserId = user?._id ?? null;
    // Invalidate only on a real identity change. Re-renders that clone the
    // user object (refreshUser/updateProfile keep the same _id) must not
    // discard an in-flight load, or isLoading would never settle.
    if (activeUserId.current !== myUserId) {
      activeUserId.current = myUserId;
      requestGen.current += 1;
    }
    const currentGen = requestGen.current;

    if (!user) {
      mergedFor.current = null;
      mergingUserId.current = null;
      setError("");
      setIsLoading(false);
      readGuest();
      return undefined;
    }
    if (mergedFor.current === user._id || mergingUserId.current === user._id) return undefined;

    const pending = guestCart.toPayload();

    setIsLoading(true);
    setError("");
    if (pending.length) {
      mergingUserId.current = user._id;
      cartApi.merge(pending)
        .then((data) => {
          // The server already added these quantities, so the guest payload
          // is consumed even when stale — re-sending it would double them.
          guestCart.clear();
          if (requestGen.current !== currentGen || activeUserId.current !== user._id) return;
          mergedFor.current = user._id;
          setCart(data.data);
        })
        .catch((requestError) => {
          if (requestGen.current !== currentGen || activeUserId.current !== user._id) return;
          setError(requestError.message);
        })
        .finally(() => {
          if (mergingUserId.current === user._id) {
            mergingUserId.current = null;
          }
          if (requestGen.current === currentGen && activeUserId.current === user._id) {
            setIsLoading(false);
          }
        });
    } else {
      cartApi.get()
        .then((data) => {
          if (requestGen.current !== currentGen || activeUserId.current !== user._id) return;
          mergedFor.current = user._id;
          setCart(data.data);
        })
        .catch((requestError) => {
          if (requestGen.current !== currentGen || activeUserId.current !== user._id) return;
          setError(requestError.message);
        })
        .finally(() => {
          if (requestGen.current === currentGen && activeUserId.current === user._id) {
            setIsLoading(false);
          }
        });
    }

    return undefined;
  }, [user, isInitializing, readGuest]);

  const run = useCallback(async (task) => {
    const sessionUserId = activeUserId.current;
    setIsLoading(true);
    setError("");
    try {
      const data = await task();
      if (activeUserId.current === sessionUserId) setCart(data);
    } catch (taskError) {
      if (taskError.status === 409 && taskError.retryable) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const retried = await task();
          if (activeUserId.current === sessionUserId) setCart(retried);
          return;
        } catch (retryError) {
          if (activeUserId.current === sessionUserId) setError(retryError.message);
          throw retryError;
        }
      }
      if (activeUserId.current === sessionUserId) setError(taskError.message);
      throw taskError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item, quantity = 1) => {
    const line = toLine(item);
    await run(async () => (user
      ? (await cartApi.addItem(line.menuItem, quantity)).data
      : summarise(guestCart.addItem(line, quantity))));
    setIsOpen(true);
  }, [user, run]);

  const updateQuantity = useCallback((menuItem, quantity) => run(async () => (user
    ? (await cartApi.updateItem(menuItem, quantity)).data
    : summarise(guestCart.updateQuantity(menuItem, quantity)))), [user, run]);

  const removeItem = useCallback((menuItem) => run(async () => (user
    ? (await cartApi.removeItem(menuItem)).data
    : summarise(guestCart.removeItem(menuItem)))), [user, run]);

  const clear = useCallback(() => run(async () => {
    if (!user) { guestCart.clear(); return EMPTY; }
    return (await cartApi.clear()).data;
  }), [user, run]);

  const refresh = useCallback(async () => {
    if (!user) return readGuest();
    const pending = guestCart.toPayload();
    if (pending.length && mergingUserId.current !== user._id) {
      mergingUserId.current = user._id;
      try {
        const data = await cartApi.merge(pending);
        guestCart.clear();
        if (activeUserId.current === user._id) {
          mergedFor.current = user._id;
          setCart(data.data);
        }
        return;
      } catch (err) {
        if (activeUserId.current === user._id) setError(err.message);
      } finally {
        if (mergingUserId.current === user._id) {
          mergingUserId.current = null;
        }
      }
    }
    const data = await cartApi.get();
    if (activeUserId.current === user._id) setCart(data.data);
  }, [user, readGuest]);

  const value = useMemo(() => ({
    ...cart,
    isLoading,
    error,
    isOpen,
    maxQuantity: MAX_ITEM_QUANTITY,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clear,
    refresh,
    dismissError: () => setError(""),
  }), [cart, isLoading, error, isOpen, addItem, updateQuantity, removeItem, clear, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
