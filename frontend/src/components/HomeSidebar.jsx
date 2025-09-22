import React from "react";

export default function HomeSidebar({
  notifications,
  newPostText,
  setNewPostText,
  newPostImageThumb,
  newPostAttachments,
  handleCreatePost,
  imageInputRef,
  attachInputRef,
  setNewPostFile,
  setNewPostImageThumb,
  setNewPostAttachments,
}) {
  return (
    <aside className="h-full flex flex-col gap-6">
      {/* New Post Composer - moved to top */}
      <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border-2 border-black p-4 text-black dark:text-gray-100">
        <h2 className="font-bold text-lg text-black dark:text-gray-100 mb-2">+ New Post</h2>

        <textarea
          className="w-full border-2 border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-black dark:text-gray-100"
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="Write a description..."
          rows={3}
        />

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex-1 px-3 py-2 border-2 border-black text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-900 text-black dark:text-gray-100"
          >
            Add Image
          </button>
          <button
            onClick={() => attachInputRef.current?.click()}
            className="flex-1 px-3 py-2 border-2 border-black text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-900 text-black dark:text-gray-100"
          >
            Add Attachments
          </button>
        </div>

        {newPostImageThumb && (
          <img
            src={newPostImageThumb}
            alt="preview"
            className="mt-3 w-full border-2 border-black"
          />
        )}

        {newPostAttachments.length > 0 && (
          <div className="mt-3 text-xs flex flex-wrap gap-2">
            {newPostAttachments.map((att, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-yellow-300 border border-black text-xs font-semibold text-black"
              >
                {att.name}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleCreatePost}
          className="mt-4 w-full py-2 bg-blue-600 text-white font-bold uppercase tracking-wide border-2 border-black hover:bg-blue-700 transition-colors"
        >
          Post
        </button>

        {/* Hidden inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            setNewPostFile(f || null);
            setNewPostImageThumb(f ? URL.createObjectURL(f) : null);
          }}
        />
        <input
          ref={attachInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setNewPostAttachments(
              files.map((f) => ({ file: f, name: f.name }))
            );
          }}
        />
      </div>

      {/* Notifications Panel - moved below */}
      <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border-2 border-black p-4 text-black dark:text-gray-100">
        <h2 className="font-bold text-lg text-black dark:text-gray-100 mb-2">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">No notifications yet</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1"
              >
                {n.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
