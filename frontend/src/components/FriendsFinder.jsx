import React, { useMemo, useState } from "react";

export default function FriendsFinder() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("username"); // 'username' | 'email'

  const usersByEmail = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('usersByEmail') || '{}'); } catch { return {}; }
  }, []);

  const allPostsEmails = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem('allPosts') || '[]');
      const set = new Set();
      for (const p of Array.isArray(all) ? all : []) {
        if (p && p.authorEmail) set.add(p.authorEmail);
      }
      return Array.from(set);
    } catch { return []; }
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const items = new Map();
    // From users directory
    for (const [email, user] of Object.entries(usersByEmail)) {
      const uname = String(user?.fullName || "").toLowerCase();
      const match = (mode === 'username' && uname.includes(q)) || (mode === 'email' && email.toLowerCase().includes(q));
      if (match) items.set(email, { email, name: user?.fullName || email });
    }
    // From posts authors
    for (const email of allPostsEmails) {
      const user = usersByEmail[email] || {};
      const uname = String(user?.fullName || "").toLowerCase();
      const match = (mode === 'username' && uname.includes(q)) || (mode === 'email' && String(email).toLowerCase().includes(q));
      if (match) items.set(email, { email, name: user?.fullName || email });
    }
    return Array.from(items.values()).slice(0, 20);
  }, [query, mode, usersByEmail]);

  const addFriend = (email) => {
    const me = (sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || '');
    if (!me || !email || me === email) return;
    const friendsByEmail = JSON.parse(localStorage.getItem('friendsByEmail') || '{}');
    const current = Array.isArray(friendsByEmail[me]) ? friendsByEmail[me] : [];
    if (!current.includes(email)) {
      friendsByEmail[me] = [email, ...current];
      localStorage.setItem('friendsByEmail', JSON.stringify(friendsByEmail));
    }
    // seed chat map
    const chats = JSON.parse(localStorage.getItem('friendChats') || '{}');
    if (!Array.isArray(chats[email])) chats[email] = [];
    localStorage.setItem('friendChats', JSON.stringify(chats));
    alert('Friend added. Open Messages to chat.');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search by ${mode}...`}
          className="flex-1 px-2 py-2 rounded border border-blue-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-blue-900 dark:text-gray-100"
        />
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="px-2 py-2 rounded border border-blue-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-blue-900 dark:text-gray-100">
          <option value="username">username</option>
          <option value="email">email</option>
        </select>
      </div>
      <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {results.length === 0 && query.trim() !== '' && (
          <li className="text-xs text-blue-800/70 dark:text-gray-400">No matches. Try switching to email and enter the exact address.</li>
        )}
        {results.map((r) => (
          <li key={r.email} className="flex items-center justify-between p-2 rounded border border-blue-200 dark:border-gray-700">
            <div className="text-sm text-blue-900 dark:text-gray-100">{r.name} <span className="text-xs text-blue-800/70 dark:text-gray-400">({r.email})</span></div>
            <button onClick={() => addFriend(r.email)} className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
}


