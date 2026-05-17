import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";

const LATEST_LINK_KEY = "fundwise-seeker:latest-link";

type IncomingLinkSource = "initial" | "event" | "storage";

type StoredIncomingLink = {
  url: string;
  receivedAt: number;
};

export type IncomingFundWiseLink = {
  url: string | null;
  receivedAt: number | null;
  source: IncomingLinkSource | null;
  loading: boolean;
  clear: () => Promise<void>;
};

export function useIncomingFundWiseLink() {
  const [incomingLink, setIncomingLink] = useState<Omit<IncomingFundWiseLink, "clear">>({
    url: null,
    receivedAt: null,
    source: null,
    loading: true,
  });

  const rememberLink = useCallback(async (url: string, source: IncomingLinkSource) => {
    const receivedAt = Date.now();

    setIncomingLink({
      url,
      receivedAt,
      source,
      loading: false,
    });

    try {
      await AsyncStorage.setItem(
        LATEST_LINK_KEY,
        JSON.stringify({
          url,
          receivedAt,
        } satisfies StoredIncomingLink),
      );
    } catch {
      // Link persistence is a convenience; the live link state should still update.
    }
  }, []);

  const clear = useCallback(async () => {
    setIncomingLink({
      url: null,
      receivedAt: null,
      source: null,
      loading: false,
    });

    try {
      await AsyncStorage.removeItem(LATEST_LINK_KEY);
    } catch {
      // Link persistence is a convenience; clearing live state still matters most.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateLink() {
      const initialUrl = await Linking.getInitialURL();

      if (cancelled) {
        return;
      }

      if (initialUrl) {
        await rememberLink(initialUrl, "initial");
        return;
      }

      const storedValue = await AsyncStorage.getItem(LATEST_LINK_KEY);

      if (cancelled) {
        return;
      }

      if (!storedValue) {
        setIncomingLink((current) => ({ ...current, loading: false }));
        return;
      }

      try {
        const storedLink = JSON.parse(storedValue) as StoredIncomingLink;

        setIncomingLink({
          url: storedLink.url,
          receivedAt: storedLink.receivedAt,
          source: "storage",
          loading: false,
        });
      } catch {
        try {
          await AsyncStorage.removeItem(LATEST_LINK_KEY);
        } catch {
          // Stale malformed storage should not block link hydration.
        }
        setIncomingLink((current) => ({ ...current, loading: false }));
      }
    }

    void hydrateLink();

    const subscription = Linking.addEventListener("url", (event) => {
      void rememberLink(event.url, "event");
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [rememberLink]);

  return {
    ...incomingLink,
    clear,
  };
}
