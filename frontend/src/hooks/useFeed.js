import { useState, useEffect, useCallback } from 'react';
import { fetchFeedPosts } from '../services/apiService';
import socket from "../socket";
const ITEMS_PER_PAGE = 10;

export const useFeed = () => {
  const [posts, setPosts] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  // Effect for fetching initial posts
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const res = await fetchFeedPosts();
        if (res.data.success) {
          setPosts(res.data.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  // Effect for real-time notifications
  useEffect(() => {
    // connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    // register the user once connected (or immediately if already connected)
    const register = () => {
      if (userId) {
        socket.emit("register", userId);
      }
    };
    if (socket.connected) register();
    socket.on("connect", register);

    const notificationListener = (data) => {
      setNotifications((prev) => [{ id: Date.now(), ...data }, ...prev]);
    };
    socket.on("notification", notificationListener);

    // When a friend is added, show a notification in the sidebar
    const friendAddedListener = ({ friend, byUser }) => {
      const name = friend?.fullName || friend?.username || friend?.email || "A user";
      const message = `🎉 You are now friends with ${name}!`;
      setNotifications((prev) => [{ id: Date.now(), message }, ...prev]);
    };
    socket.on("friendAdded", friendAddedListener);

    return () => {
      socket.off("notification", notificationListener);
      socket.off("friendAdded", friendAddedListener);
      socket.off("connect", register);
      // do not disconnect here globally; Layout handles disconnect on logout
    };
  }, [userId]);

  // Effect for handling infinite scroll pagination
  useEffect(() => {
    const end = page * ITEMS_PER_PAGE;
    setVisiblePosts(posts.slice(0, end));
  }, [posts, page]);

  // Consumer is responsible for handling scroll events (container-based)

  return { posts, setPosts, visiblePosts, notifications, setNotifications, loading, page, setPage };
};