// ThemeSync.tsx
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeSync() {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const isFirstRun = useRef(true);
  const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";


  const syncThemeToServer = useCallback(async (nextTheme: string) => {
    const token = await getToken();
    if (!token) return;

    await fetch(API_BASE_URL + "/api/user/theme", {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ theme: nextTheme }),
    });
  }, [getToken, API_BASE_URL]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false; // منبعتش أول تحميل
      return;
    }
    syncThemeToServer(theme);
  }, [theme, syncThemeToServer]);

  return null;
}