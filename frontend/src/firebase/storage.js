/**
 * Upload a file to your backend (which uploads it to Cloudinary)
 * and return the Cloudinary URL.
 *
 * @param {File} file - The file to upload
 * @returns {Promise<string>} Cloudinary secure URL
 */
export async function uploadFileAndGetURL(file) {
  if (!file) throw new Error("No file provided");

  // Send to backend route
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload/profile-image", {
    method: "POST",
    body: formData,
    credentials: "include", // ensures cookies (auth) are sent along
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to upload");
  }

  const data = await response.json();
  return data.url; // <- Cloudinary secure URL returned from backend
}