"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className={styles.navbar}>
      {/* Logo o marca */}
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink}>
          PuniTurnos
        </Link>
      </div>

      {/* Menú hamburguesa - visible solo en mobile */}
      <button
        className={`${styles.hamburger} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Contenedor de links */}
      <div className={`${styles.navLinks} ${isOpen ? styles.open : ""}`}>
        <Link
          href="/"
          className={styles.navLink}
          onClick={() => setIsOpen(false)}
        >
          Home
        </Link>
        <Link
          href="/Ranking"
          className={styles.navLink}
          onClick={() => setIsOpen(false)}
        >
          Ranking
        </Link>
        <Link
          href="/Stats"
          className={styles.navLink}
          onClick={() => setIsOpen(false)}
        >
          Estadísticas
        </Link>
        <Link
          href="/Puners"
          className={styles.navLink}
          onClick={() => setIsOpen(false)}
        >
          Puners
        </Link>

        <button
          onClick={() => {
            logout();
            setIsOpen(false);
          }}
          className={styles.logoutButton}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
