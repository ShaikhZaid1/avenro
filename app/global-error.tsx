"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>The page could not be loaded.</p>
          <button onClick={retry}>Try again</button>
        </main>
      </body>
    </html>
  );
}