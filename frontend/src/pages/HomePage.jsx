import React, { useState, useRef, useEffect } from "react";
import { useFeed } from "../hooks/useFeed";
import { createPost, uploadFile } from "../services/apiService";
import HomeSidebar from "../components/HomeSidebar";

export default function HomePage() {
  const { posts, setPosts, visiblePosts, notifications, setNotifications, loading, setPage } = useFeed();

  const [newPostText, setNewPostText] = useState("");
  const [newPostFile, setNewPostFile] = useState(null);
  const [newPostImageThumb, setNewPostImageThumb] = useState(null);
  const [newPostAttachments, setNewPostAttachments] = useState([]);

  const imageInputRef = useRef(null);
  const attachInputRef = useRef(null);

  const handleCreatePost = async () => {
    const trimmed = newPostText.trim();
    if (!trimmed && !newPostFile && newPostAttachments.length === 0) return;

    try {
      const form = new FormData();
      form.append("text", trimmed);
      if (newPostFile) form.append("file", newPostFile);

      const uploadedAttachments = [];
      for (const att of newPostAttachments) {
        const attForm = new FormData();
        attForm.append("file", att.file);
        const res = await uploadFile(attForm);
        if (res.data.success) {
          uploadedAttachments.push({ name: att.name, url: res.data.url });
        }
      }
      if (uploadedAttachments.length > 0) {
        form.append("attachments", JSON.stringify(uploadedAttachments));
      }

      const res = await createPost(form);
      if (res.data.success) {
        setPosts((prev) => [res.data.data, ...prev]);
        setNotifications((prev) => [
          { id: Date.now(), message: "✅ New post published!" },
          ...prev,
        ]);

        setNewPostText("");
        setNewPostFile(null);
        setNewPostImageThumb(null);
        setNewPostAttachments([]);
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (attachInputRef.current) attachInputRef.current.value = "";
      }
    } catch (err) {
      console.error("❌ Error creating post:", err);
      const backendMsg = err?.response?.data?.message || err?.message || "Unknown error";
      alert(`Failed to create post. ${backendMsg}`);
    }
  };

  // Infinite scroll
  const feedRef = useRef(null);
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
      if (nearBottom && visiblePosts.length < posts.length) {
        setPage((p) => p + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [posts.length, visiblePosts.length, setPage]);

  return (
    <div className="flex h-full gap-6 text-black dark:text-gray-100">
      {/* Feed Section */}
      <main
        ref={feedRef}
        className="flex-1 h-full overflow-y-auto space-y-6 pr-4"
      >
        {loading && posts.length === 0 ? (
          <div className="text-center p-6 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border-2 border-black">
            Loading feed...
          </div>
        ) : (
          visiblePosts.map((p) => (
            <div
              key={p._id}
              className="p-4 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md border-2 border-black shadow-sm"
            >
              <div className="font-bold text-black dark:text-gray-100">{p.authorEmail}</div>
              <p className="mt-2 text-gray-800 dark:text-gray-200 break-words">{p.text}</p>

              {p.imageThumb && (
                <img
                  src={p.imageThumb}
                  alt="post"
                  className="mt-3 w-full max-w-xl border-2 border-black"
                />
              )}

              {Array.isArray(p.attachments) && p.attachments.length > 0 && (
                <div className="mt-3 space-y-1">
                  {p.attachments.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline block text-sm"
                    >
                      {a.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 h-full flex flex-col gap-6">
        <HomeSidebar
          notifications={notifications}
          newPostText={newPostText}
          setNewPostText={setNewPostText}
          newPostImageThumb={newPostImageThumb}
          newPostAttachments={newPostAttachments}
          handleCreatePost={handleCreatePost}
          imageInputRef={imageInputRef}
          attachInputRef={attachInputRef}
          setNewPostFile={setNewPostFile}
          setNewPostImageThumb={setNewPostImageThumb}
          setNewPostAttachments={setNewPostAttachments}
        />
      </aside>
    </div>
  );
}
