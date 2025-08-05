import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCred.user);
    } catch (err) {
      setError("Неверный email или пароль.");
      console.error("Ошибка входа:", err.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto bg-white p-6 shadow-md rounded space-y-4">
      <h2 className="text-xl font-bold text-center">Вход в систему</h2>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        required
        className="w-full border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
      >
        Войти
      </button>
    </form>
  );
}

export default LoginForm;
