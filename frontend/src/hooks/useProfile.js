import { useState, useEffect, useCallback } from 'react';
import { fetchProfile, fetchMyPosts, updateProfileImage, updateUserProfile } from '../services/apiService';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors on a new load attempt

      // Fetch both profile and posts at the same time (in parallel)
      const [profileRes, postsRes] = await Promise.all([
        fetchProfile(),
        fetchMyPosts()
      ]);

      // Profile data fetched successfully

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
      }
      if (postsRes.data.success) {
        setPosts(postsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load profile data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImageChange = async (file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await updateProfileImage(formData);
      if (res.data.success) {
        const url = res.data.url;
        await updateUserProfile({ profileImageUrl: url });
        setProfile((p) => ({ ...p, profileImageUrl: url }));
        alert("✅ Profile image updated!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to change profile picture.");
    }
  };

  return { profile, posts, setPosts, loading, error, handleImageChange };
};