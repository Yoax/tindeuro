import { Outlet } from "react-router";
import AppFooter from "./AppFooter";

/** Coque commune — contenu de page + footer sur toutes les routes. */
export default function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-fond">
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}
