import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { STORAGE_KEYS } from "@/src/config";
import { storage } from "@/src/utils/storage";

type AddressContextValue = { address: string; setAddress: (a: string) => void };

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

// Customer's preferred delivery address, kept on the device and used to prefill checkout.
export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [address, setState] = useState("");

  useEffect(() => {
    storage.getItem<string>(STORAGE_KEYS.address, "").then((a) => setState(a ?? ""));
  }, []);

  const setAddress = useCallback((a: string) => {
    setState(a);
    storage.setItem(STORAGE_KEYS.address, a);
  }, []);

  const value = useMemo(() => ({ address, setAddress }), [address, setAddress]);
  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useSavedAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useSavedAddress must be used within AddressProvider");
  return ctx;
}
