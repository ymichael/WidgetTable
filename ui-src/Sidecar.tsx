import * as React from "react";
import { useEffect } from "react";
import styles from "./Sidecar.module.css";

export function Sidecar({ children }: { children: any }) {
  useEffect(() => {
    document.body.classList.add(styles.SidecarOpen);
    return () => {
      document.body.classList.remove(styles.SidecarOpen);
    };
  }, []);
  return <div className={styles.Sidecar}>{children}</div>;
}

export function SidecarOverlay({ onClick }: { onClick: () => void }) {
  return <div className={styles.SidecarOverlay} onClick={onClick}></div>;
}
