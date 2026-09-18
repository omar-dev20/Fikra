import { useContext } from "react";
import { LangContext } from "@/context/langContext";
export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLang must be used within LangProvider");
  }
  return context;
}