import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Spaces Where People Feel Good";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "#faf7f2",
        color: "#1f1d1a",
        padding: "96px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: "#5b574f",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 28,
        }}
      >
        Spaces Where People Feel Good
      </div>
      <div
        style={{
          fontSize: 80,
          lineHeight: 1.1,
          maxWidth: 920,
          color: "#1f1d1a",
        }}
      >
        A map of places with good energy — and a community of people who find
        them.
      </div>
      <div
        style={{
          marginTop: 56,
          display: "flex",
          gap: 16,
        }}
      >
        {["#5f8a5b", "#b67a4a", "#7a6ea0", "#3f6f8a", "#5a9a8e"].map((c) => (
          <div
            key={c}
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: c,
            }}
          />
        ))}
      </div>
    </div>,
    { ...size },
  );
}
