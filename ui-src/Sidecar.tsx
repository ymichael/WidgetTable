import * as React from "react";
import styles from "./Sidecar.module.css";

export default function Sidecar({ children }: { children: any }) {
  return <div className={styles.Sidecar}>{children}</div>;
}
