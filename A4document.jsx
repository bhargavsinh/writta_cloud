import React from "react";

/**
 * A4 Print-Layout container
 * Grey background + centered white A4 pages with shadow
 * True continuous flow (Word-like feel). Page-break CSS for print.
 */
export default function A4Document({ children, theme, title, author }) {
  const T = theme;

  return (
    <div
      className="a4-workspace"
      style={{
        flex: 1,
        overflowY: "auto",
        background: themeNameIsDark(T) ? "#1a1a1f" : "#c8c4bc",
        padding: "40px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}
    >
      {/* Title page feel */}
      {(title || author) && (
        <div
          className="a4-page title-sheet"
          style={{
            width: "210mm",
            minHeight: "120mm",
            background: T.page,
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            borderRadius: 2,
            padding: "48px 56px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            border: `1px solid ${T.pageBorder}`,
          }}
        >
          <div
            style={{
              width: 80,
              height: 2,
              background: T.gold,
              marginBottom: 24,
            }}
          />
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Noto Serif Gujarati', serif",
              fontSize: 36,
              fontWeight: 600,
              color: T.ink,
              margin: "0 0 12px",
              letterSpacing: 0.5,
            }}
          >
            {title || "અનામી ગ્રંથ"}
          </h1>
          {author && (
            <p
              style={{
                fontSize: 16,
                color: T.inkSoft,
                margin: 0,
                fontFamily: "'Noto Serif Gujarati', serif",
              }}
            >
              {author}
            </p>
          )}
          <div
            style={{
              width: 80,
              height: 2,
              background: T.gold,
              marginTop: 24,
            }}
          />
        </div>
      )}

      {/* Main writing page(s) */}
      <div
        className="a4-page"
        style={{
          width: "210mm",
          minHeight: "297mm",
          background: T.page,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          borderRadius: 2,
          padding: "25mm 22mm",
          border: `1px solid ${T.pageBorder}`,
          position: "relative",
        }}
      >
        {children}

        {/* Page number footer */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 11,
            color: T.inkFaint,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Writta Pro
        </div>
      </div>

      <style>{`
        @media print {
          .a4-workspace {
            background: white !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .a4-page {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: always;
            margin: 0 !important;
          }
          .title-sheet {
            page-break-after: always;
          }
        }

        .writta-prose h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 1.4em 0 0.6em;
          font-family: 'Cormorant Garamond', 'Noto Serif Gujarati', serif;
        }
        .writta-prose h2 {
          font-size: 22px;
          font-weight: 600;
          margin: 1.3em 0 0.5em;
        }
        .writta-prose h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 1.2em 0 0.4em;
        }
        .writta-prose h4, .writta-prose h5, .writta-prose h6 {
          font-size: 16px;
          font-weight: 600;
          margin: 1em 0 0.3em;
        }
        .writta-prose p {
          margin: 0 0 0.9em;
        }
        .writta-prose img.writta-image,
        .writta-prose img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: 4px;
          cursor: pointer;
        }
        .writta-prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .writta-prose th,
        .writta-prose td {
          border: 1px solid ${T.panelBorder};
          padding: 8px 12px;
          text-align: left;
        }
        .writta-prose th {
          background: ${T.hover};
          font-weight: 600;
        }
        .writta-prose ul, .writta-prose ol {
          padding-left: 1.5em;
          margin: 0.6em 0;
        }
        .writta-prose a {
          color: ${T.gold};
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: ${T.inkFaint};
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function themeNameIsDark(T) {
  return T.bg === "#0B0B0E" || T.bg?.startsWith("#0");
}