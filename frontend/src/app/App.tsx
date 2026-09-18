import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/app/layout/AppLayout";
import { HomePage } from "@/app/pages/HomePage";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import NoteDetailPage from "@/app/pages/NoteDetailPage";
import { IntiWrapper } from "@/components/common/intiWrapper";
import { LangProvider, RedirectToLang } from "@/context/langProvidor";
import { ClerkThemeProvider } from "@/context/clerkprovider";

function LangLayout() {
  return (
    <LangProvider>
      <ClerkThemeProvider>
        <IntiWrapper>
          <AppLayout />
        </IntiWrapper>
      </ClerkThemeProvider>
    </LangProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectToLang />} />
        <Route path="/:lang" element={<LangLayout />}>
          <Route index element={<HomePage />} />
          <Route path="notes/:id" element={<NoteDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}