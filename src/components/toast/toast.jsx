import { useToastStore } from "../../store/toastStore";
import styles from "./toast.module.css";

const ICONS = {
  error: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle
        cx="7.5"
        cy="7.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7.5 4.5v3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="10.5" r="0.75" fill="currentColor" />
    </svg>
  ),
  warn: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M7.5 1.5L13.5 12.5H1.5L7.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 5.5v3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="10.5" r="0.75" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle
        cx="7.5"
        cy="7.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7.5 6.5v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="4.5" r="0.75" fill="currentColor" />
    </svg>
  ),
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();
  if (!toasts.length) return null;

  return (
    <div className={styles.container} role="region" aria-label="알림">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.type] ?? styles.error}`}
          role="alert"
          onClick={() => removeToast(t.id)}
        >
          <span className={styles.icon}>{ICONS[t.type] ?? ICONS.error}</span>
          <span className={styles.message}>{t.message}</span>
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              removeToast(t.id);
            }}
            aria-label="닫기"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
