import { useEffect, useState } from "react";
import { Linking } from "react-native";

export function useIncomingFundWiseLink() {
  const [incomingUrl, setIncomingUrl] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        setIncomingUrl(url);
      }
    });

    const subscription = Linking.addEventListener("url", (event) => {
      setIncomingUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  return incomingUrl;
}
