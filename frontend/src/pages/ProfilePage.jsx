import React, { useMemo, useRef, useState } from "react";
import { useProfile } from "../hooks/useProfile";
import { deletePost, updatePost } from "../services/apiService";

// --- Neubrutalist Card Component ---
// A reusable component to create the consistent card style with a hard shadow.
const Card = ({ children, className = "" }) => (
  <div className={`relative bg-white dark:bg-gray-800 border-2 border-black ${className}`}>
    {/* This div creates the solid "shadow" effect */}
    <div className="absolute top-0 left-0 w-full h-full bg-black translate-x-1 translate-y-1 -z-10"></div>
    {children}
  </div>
);

// --- Neubrutalist Modal Component ---
// A custom modal for confirmations to avoid using the browser's default dialogs.
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-sm p-6">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 font-bold bg-gray-200 border-2 border-black hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 font-bold text-white bg-red-600 border-2 border-black hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </Card>
    </div>
  );
};


export default function ProfilePage() {
  const { profile, posts, setPosts, loading, error, handleImageChange } = useProfile();
  
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  const initials = useMemo(() => {
    if (!profile) return "U";
    return profile.fullName?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  }, [profile]);

  const onImageInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImageChange(file);
  };
  
  const startEdit = (post) => {
    setEditingId(post._id);
    setEditText(post.text || "");
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleDeleteRequest = (id) => {
    setPostToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete);
      setPosts((prev) => prev.filter((p) => p._id !== postToDelete));
    } catch (err) {
      console.error("❌ Failed to delete post:", err);
      setErrorMessage("Failed to delete post.");
    } finally {
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  const saveEdit = async (id) => {
    try {
      await updatePost(id, { text: editText });
      setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, text: editText } : p)));
      cancelEdit();
    } catch (err) {
      console.error("❌ Failed to edit post:", err);
      setErrorMessage("Failed to save changes.");
    }
  };

  if (loading) return <div className="p-6 font-bold text-center text-black dark:text-gray-100">Loading profile...</div>;
  if (error) return <div className="p-6 font-bold text-center text-red-600">{error || errorMessage}</div>;
  if (!profile) return <div className="p-6 font-bold text-center text-black dark:text-gray-100">Profile not found.</div>;

  // Profile data loaded successfully

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 space-y-6 text-black dark:text-gray-100">
      {/* Error Message Display */}
      {errorMessage && (
        <Card className="p-4 bg-red-100 dark:bg-red-200/30 text-red-800">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage("")} className="absolute top-2 right-3 font-bold">X</button>
        </Card>
      )}


      {/* Profile Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <Card className="md:col-span-2 p-4 flex flex-col sm:flex-row gap-4">
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt="Avatar" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 object-cover border-2 border-black cursor-pointer flex-shrink-0" />
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-yellow-300 border-2 border-black flex items-center justify-center font-bold text-3xl cursor-pointer flex-shrink-0 text-black">
              {initials}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageInputChange} className="hidden" />
          <div className="flex-1">
            <h2 className="font-bold text-2xl">{profile.fullName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">@{profile.username || profile.fullName || 'user'}</p>
            {/* Updated Info Section with consistent spacing */}
            <div className="text-sm">
              <div className="grid grid-cols-2 gap-x-10">
                {/* Row 1 */}
                <div className="py-1"><span className="font-semibold text-gray-800 dark:text-gray-200">College:</span> <span className="text-gray-800 dark:text-gray-100">{profile.college || 'Not specified'}</span></div>
                <div className="py-1"><span className="font-semibold text-gray-800 dark:text-gray-200">Stream:</span> <span className="text-gray-800 dark:text-gray-100">{profile.qualification || 'Not specified'}</span></div>
                {/* Row 2 */}
                <div className="py-1"><span className="font-semibold text-gray-800 dark:text-gray-200">Branch:</span> <span className="text-gray-800 dark:text-gray-100">{profile.branch || 'Not specified'}</span></div>
                <div className="py-1"><span className="font-semibold text-gray-800 dark:text-gray-200">Year:</span> <span className="text-gray-800 dark:text-gray-100">{profile.year || 'Not specified'}</span></div>
                {/* Row 3: Bio under Branch (left), Subjects under Year (right) */}
                <div className="py-1"><span className="font-semibold text-gray-800 dark:text-gray-200">Bio:</span> <span className="text-gray-800 dark:text-gray-100">{profile.bio || 'No bio available'}</span></div>
                <div className="py-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Subjects:</span> <span className="text-gray-800 dark:text-gray-100">{Array.isArray(profile.subjects) ? profile.subjects.join(', ') : (profile.subjects || '3D Modeling')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="md:col-span-1 p-4 flex flex-col justify-center items-center text-center">
          <div className="mb-4">
            <div className="font-bold text-gray-700 dark:text-gray-200">POSTS</div>
            <div className="text-4xl font-black">{posts.length}</div>
          </div>
          <div>
            <div className="font-bold text-gray-700 dark:text-gray-200">FRIENDS</div>
            <div className="text-4xl font-black">{profile.friends?.length ?? 0}</div>
          </div>
        </Card>
      </div>

      {/* Uploaded Posts */}
      <Card className="p-4">
        <h2 className="font-bold text-xl mb-4">Your Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">You haven't uploaded any posts yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="border-2 border-black p-3 bg-white dark:bg-gray-900">
                {editingId === post._id ? (
                  <>
                    <textarea 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)} 
                      rows={3} 
                      className="w-full border-2 border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-black dark:text-gray-100" 
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <button onClick={() => saveEdit(post._id)} className="px-3 py-1 font-bold bg-blue-600 text-white border-2 border-black hover:bg-blue-700">Save</button>
                      <button onClick={cancelEdit} className="px-3 py-1 font-bold bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 border-2 border-black hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap mb-2 text-black dark:text-gray-100">{post.text}</p>
                    {post.imageThumb && <img src={post.imageThumb} alt="Post" className="mt-2 max-w-full md:max-w-md border-2 border-black" />}
                    {Array.isArray(post.attachments) && post.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {post.attachments.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            download={a.name || true}
                            className="text-blue-600 underline block text-sm"
                          >
                            {a.name || 'Attachment'}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2 justify-end border-t-2 border-black pt-2">
                      <button onClick={() => startEdit(post)} className="px-3 py-1 font-bold bg-yellow-300 text-black border-2 border-black hover:bg-yellow-400">Edit</button>
                      <button onClick={() => handleDeleteRequest(post._id)} className="px-3 py-1 font-bold bg-red-600 text-white border-2 border-black hover:bg-red-700">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Post"
        message="Are you sure you want to permanently delete this post? This action cannot be undone."
      />
    </div>
  );
}

