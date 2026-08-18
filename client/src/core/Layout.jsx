// src/core/Layout.jsx
//
// Shared shell for all routes: one persistent nav bar + an Outlet
// for the active page. Avoids repeating <nav> markup on every page.

import { NavLink, Outlet } from "react-router-dom";

function navLinkClassName({ isActive }) {
  return isActive ? "active" : undefined;
}

export default function Layout() {
  return (
    <div className="app-shell">
      <nav className="nav-bar">
        <NavLink to="/" end className={navLinkClassName}>
          ← Home
        </NavLink>
        <NavLink to="/agent_test" className={navLinkClassName}>
          Agent Test
        </NavLink>
        <NavLink to="/no_agent_test" className={navLinkClassName}>
          No-Agent Test
        </NavLink>
      </nav>

      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}