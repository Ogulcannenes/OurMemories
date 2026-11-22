"use client";

// Replaces the root layout when it fails, so it has no i18n provider, fonts or global CSS:
// the message is trilingual and styled inline (same look as public/offline.html).
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#f6f0e6",
          color: "#2a2320",
          font: "16px/1.6 ui-sans-serif, system-ui, sans-serif",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <title>ADELYA</title>
        <main style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ font: 'italic 500 2.25rem/1.15 Georgia, "Times New Roman", serif', margin: "0 0 1rem" }}>
            Something went wrong
          </h1>
          <p style={{ margin: ".25rem 0", color: "#6b5d53" }}>Your memories are safe. Please try again.</p>
          <p lang="ru" style={{ margin: ".25rem 0", color: "#6b5d53" }}>
            Что-то пошло не так. Ваши воспоминания в безопасности.
          </p>
          <p lang="tr" style={{ margin: ".25rem 0", color: "#6b5d53" }}>
            Bir şeyler ters gitti. Anıların güvende.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.5rem",
              font: "600 .875rem/1 ui-sans-serif, system-ui, sans-serif",
              background: "#7a2e3a",
              color: "#fbf8f2",
              border: 0,
              borderRadius: 2,
              padding: ".9rem 1.4rem",
              cursor: "pointer",
            }}
          >
            Try again · Повторить · Tekrar dene
          </button>
        </main>
      </body>
    </html>
  );
}
