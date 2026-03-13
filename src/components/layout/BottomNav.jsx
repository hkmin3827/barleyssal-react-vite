import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.css";

const tabs = [
  { to: "/", label: "홈", icon: "⌂", exact: true },
  { to: "/stocks", label: "종목", icon: "≡" },
  { to: "/watchlist", label: "관심", icon: "★" },
  { to: "/account", label: "계좌", icon: "◎" },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.exact}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ""}`
          }
        >
          <span className={styles.icon}>{t.icon}</span>
          <span className={styles.label}>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
