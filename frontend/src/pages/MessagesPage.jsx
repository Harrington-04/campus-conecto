import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../socket"; // Import the shared socket instance
import { removeFriendSmart as apiRemoveFriendSmart } from "../services/apiService";

export default function MessagesPage() {
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const feedRef = useRef(null);
  const [removingId, setRemovingId] = useState(null);

  // Use a ref to keep a current reference to the active friend
  const activeFriendRef = useRef(activeFriend);
  useEffect(() => {
    activeFriendRef.current = activeFriend;
  }, [activeFriend]);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // This useEffect fetches the initial friend list
  useEffect(() => {
    if (!token) return;
    axios.get(`${process.env.REACT_APP_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      if (res.data.success && res.data.data.friends) {
        setFriends(res.data.data.friends);
      }
    })
    .catch((err) => console.error("❌ Failed to fetch friends:", err));
  }, [token]);

  // This useEffect handles all socket event listeners
  useEffect(() => {
    // Register the user with the socket server
    if (userId) {
      socket.emit("register", userId);
    }

    // Listener for new incoming messages
    const messageListener = (msg) => {
      // Use the ref here for the most up-to-date value
      const currentActiveFriend = activeFriendRef.current;

      console.log("--- New Message Received ---");
      console.log("From:", msg.from, "(Type:", typeof msg.from, ")");
      console.log("Active Friend ID:", currentActiveFriend, "(Type:", typeof currentActiveFriend, ")");
      console.log("Is Match?", msg.from === currentActiveFriend);
      console.log("--------------------------");
      
      if (msg.from === currentActiveFriend) {
        setMessages((prev) => [msg, ...prev]);
        // Auto-scroll to the new message
        feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    socket.on("newMessage", messageListener);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off("newMessage", messageListener);
    };
  }, [userId]); // This effect now only runs once

  const loadMessages = async (friendId) => {
    setActiveFriend(friendId);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("❌ Failed to load messages:", err);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeFriend) return;
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/messages/send/${activeFriend}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages((prev) => [res.data.data, ...prev]);
        setInput("");
        feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("❌ Failed to send message:", err);
    }
  };

  // Remove friend handler
  const handleRemoveFriend = async (friendId) => {
    const friend = friends.find((f) => f._id === friendId);
    const name = friend?.fullName || "this user";
    const ok = window.confirm(`Remove ${name} from your friends?`);
    if (!ok) return;
    try {
      setRemovingId(friendId);
      const res = await apiRemoveFriendSmart(friendId);
      if (!res?.success) {
        const status = res?.status || "";
        const msg = res?.message ? `: ${res.message}` : "";
        throw new Error(`Request failed${status ? ` (${status})` : ""}${msg}`);
      }
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      if (activeFriend === friendId) {
        setActiveFriend(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("❌ Failed to remove friend:", err);
      alert(`Failed to remove friend. ${err?.message || "Please try again."}`);
    }
    finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-3 md:px-4 py-4 md:py-6 grid grid-cols-12 gap-4 md:gap-6 text-black dark:text-gray-100">
      {/* Chat section (No changes to JSX) */}
      <main className="col-span-12 md:col-span-8 space-y-4">
        <div className="relative bg-white dark:bg-gray-800 border-2 border-black p-4">
          <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
          {!activeFriend ? (
            <div className="text-sm text-gray-500 dark:text-gray-300">Select a friend to start chatting.</div>
          ) : (
            <>
              <div className="font-bold mb-2 text-black dark:text-gray-100">Chat with {friends.find(f => f._id === activeFriend)?.fullName}</div>
              <div ref={feedRef} className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 flex flex-col-reverse">
                {messages.map((m) => (
                  <div key={m._id || m.createdAt} className={`max-w-[70%] px-3 py-2 border-2 border-black ${m.from === userId ? "bg-blue-500 text-white ml-auto" : "bg-white dark:bg-gray-700 text-black dark:text-gray-100"}`}>
                    <div className="text-sm">{m.text}</div>
                    <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="flex-1 border-2 border-black px-2 py-2 text-sm focus:outline-none bg-white dark:bg-gray-900 text-black dark:text-gray-100" placeholder="Type a message..." />
                <button onClick={sendMessage} className="px-3 py-2 font-bold border-2 border-black bg-blue-600 text-white text-sm hover:bg-blue-700">Send</button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Friend list (No changes to JSX) */}
      <aside className="col-span-12 md:col-span-4">
        <div className="relative bg-white dark:bg-gray-800 border-2 border-black p-4">
          <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10"></div>
          <h2 className="font-bold mb-2 text-black dark:text-gray-100">Friends</h2>
          <ul className="space-y-2">
            {friends.map((f) => (
              <li key={f._id} className="flex items-stretch gap-2">
                <button
                  onClick={() => loadMessages(f._id)}
                  className={`flex-1 text-left p-2 border-2 border-black font-semibold ${activeFriend === f._id ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-900 text-black dark:text-gray-100"}`}
                  title={`Chat with ${f.fullName}`}
                >
                  {f.fullName}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFriend(f._id); }}
                  className={`px-3 py-2 border-2 border-black font-bold ${removingId === f._id ? "bg-gray-400 text-white cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
                  disabled={removingId === f._id}
                  aria-label={`Remove ${f.fullName}`}
                  title={`Remove ${f.fullName}`}
                >
                  {removingId === f._id ? "…" : "-"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}