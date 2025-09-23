import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const normalize = (s) => (s || "").toLowerCase();
const getFileNameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop();
    return decodeURIComponent(last || "download");
  } catch {
    return "download";
  }
};

// ✅ Updated universal download function (proxy + auth header)
const triggerDownload = async (url, name) => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const proxyUrl = `${process.env.REACT_APP_API_URL}/api/upload/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "")}`;

  try {
    const res = await fetch(proxyUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to download");

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name || getFileNameFromUrl(url);

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("❌ Download failed", err);
    alert("Download failed. Please try again.");
  }
};

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/posts/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success) {
          const flattened = [];
          for (const p of res.data.data) {
            const base = {
              author: p.authorEmail,
              text: p.text,
              postId: p._id,
            };

            // 📎 Attachments (already include `name` + `url`)
            if (Array.isArray(p.attachments)) {
              for (const att of p.attachments) {
                flattened.push({
                  ...base,
                  type: "attachment",
                  name: att.name || getFileNameFromUrl(att.url),
                  url: att.url,
                });
              }
            }

            // 🖼 Inline image
            if (p.imageThumb) {
              flattened.push({
                ...base,
                type: "image",
                name: getFileNameFromUrl(p.imageThumb),
                url: p.imageThumb,
              });
            }
          }
          setItems(flattened);
        }
      })
      .catch((err) => console.error("❌ Failed to fetch resources:", err));
  }, []);

  // 🔍 Filter search
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter(
      (it) =>
        normalize(it.name).includes(q) ||
        normalize(it.text).includes(q) ||
        normalize(it.author).includes(q)
    );
  }, [items, query]);

  return (
    <div className="max-w-screen-xl mx-auto px-3 md:px-4 py-6 text-black dark:text-gray-100">
      {/* Search Bar */}
      <div className="relative bg-white dark:bg-gray-800 border-2 border-black p-4">
        <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources by file name, author, or text..."
          className="w-full px-3 py-2 border-2 border-black focus:outline-none bg-white dark:bg-gray-900 text-black dark:text-gray-100"
        />
      </div>

      {/* Results */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((it, idx) => (
          <div
            key={idx}
            className="relative bg-white dark:bg-gray-800 border-2 border-black p-4 text-sm"
          >
            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
            <div className="font-bold text-black dark:text-gray-100">{it.name}</div>
            <div className="text-gray-700 dark:text-gray-300 text-xs">by {it.author}</div>
            <div className="mt-1 text-gray-800 dark:text-gray-200">{it.text}</div>

            {it.url ? (
              it.type === "image" ? (
                <>
                  <img
                    src={it.url}
                    alt={it.name}
                    className="mt-2 w-full border-2 border-black"
                  />
                  <div className="mt-2">
                    <button
                      onClick={() => triggerDownload(it.url, it.name)}
                      className="inline-block font-bold underline text-blue-700"
                    >
                      Download
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2">
                  <button
                    onClick={() => triggerDownload(it.url, it.name)}
                    className="inline-block font-bold underline text-blue-700"
                  >
                    Download
                  </button>
                </div>
              )
            ) : (
              <div className="mt-2 text-gray-500 dark:text-gray-400">Not available</div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">No resources found.</p>
        )}
      </div>
    </div>
  );
}