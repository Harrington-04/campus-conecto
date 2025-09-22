import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL, { transports: ["websocket"] });

export default function FindFriendsPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("username");
  const [results, setResults] = useState([]);
  const [myFriends, setMyFriends] = useState([]);

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

  // ✅ On mount: register socket + load current friends
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${process.env.REACT_APP_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.success && res.data.data.friends) {
          setMyFriends(res.data.data.friends.map((f) => f._id));
        }
      });

    if (userId) socket.emit("register", userId);

    // Listen for friendAdded → keep friends updated
    socket.on("friendAdded", ({ friend }) => {
      setMyFriends((prev) => {
        if (prev.includes(friend._id)) return prev;
        return [...prev, friend._id];
      });
    });

    return () => {
      socket.off("friendAdded");
    };
  }, [token, userId]);

  // Search function
  const handleSearch = async () => {
    if (!token || !query.trim()) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/search`, {
        params: { q: query, mode },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setResults(res.data.data);
    } catch (err) {
      console.error("❌ Search failed:", err);
    }
  };

  // Add Friend + trigger real-time
  const addFriend = async (id) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/add-friend`,
        { friendId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // update myFriends immediately
      setMyFriends((prev) => [...prev, id]);
      // socket event will also trigger automatically for both users
    } catch (err) {
      console.error("❌ Add Friend failed:", err);
    }
  };

  const isFriend = (id) => myFriends.includes(id);

  return (
    <div className="w-full max-w-screen-md mx-auto p-6 space-y-4 text-black dark:text-gray-100">
      {/* Search Bar */}
      <div className="relative bg-white dark:bg-gray-800 border-2 border-black p-4">
        <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search by ${mode}...`}
            className="flex-1 border-2 border-black px-3 py-2 focus:outline-none bg-white dark:bg-gray-900 text-black dark:text-gray-100"
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="border-2 border-black px-2 bg-white dark:bg-gray-900 text-black dark:text-gray-100"
          >
            <option value="username">Username</option>
            <option value="email">Email</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 font-bold border-2 border-black bg-blue-600 text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <ul className="space-y-3">
        {results.length === 0 && query && (
          <li className="text-gray-700 dark:text-gray-300">No users found.</li>
        )}
        {results.map((u) => (
          <li key={u._id} className="relative bg-white dark:bg-gray-800 border-2 border-black p-3 flex items-center justify-between">
            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
            <div className="flex items-center gap-3">
              <img
                src={u.profileImageUrl || "/default-avatar.png"}
                alt="avatar"
                className="w-10 h-10 object-cover border-2 border-black"
              />
              <div>
                <div className="font-bold text-black dark:text-gray-100">{u.fullName}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">@{u.username || u.fullName || 'user'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{u.email}</div>
              </div>
            </div>
            <div>
              {isFriend(u._id) ? (
                <button disabled className="px-3 py-1 font-bold border-2 border-black bg-gray-300 text-black dark:bg-gray-600 dark:text-gray-200 cursor-not-allowed">
                  Friend ✓
                </button>
              ) : (
                <button onClick={() => addFriend(u._id)} className="px-3 py-1 font-bold border-2 border-black bg-green-500 text-white hover:bg-green-600">
                  Add Friend
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}