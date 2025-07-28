import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCred.user);
    } catch (error) {
      console.error("Ошибка входа:", error.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-2">
      <h2 className="text-lg font-semibold">Вход</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="border p-1 w-full" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" required className="border p-1 w-full" />
      <button type="submit" className="bg-green-500 text-white px-4 py-1 rounded">Войти</button>
    </form>
  );
}

export default LoginForm;
