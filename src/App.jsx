import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import TechTable from "./TechTable";
import CleverTable from "./CleverTable";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [techMetrics, setTechMetrics] = useState({ bonus: 0 });
  const [dpMetrics, setDpMetrics] = useState({ bonus: 0, coefDp: 1 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, "sales"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSalesHistory(history);
      } else {
        setUser(null);
        setSalesHistory([]);
      }
    });

    return () => unsub();
  }, []);

  const addToHistory = async (entry) => {
    if (!user) return;
    const entryWithUser = { ...entry, userId: user.uid };
    await addDoc(collection(db, "sales"), entryWithUser);
    setSalesHistory((prev) => [...prev, entryWithUser]);
  };

  const totalBonus = Math.round(techMetrics.bonus + dpMetrics.bonus * dpMetrics.coefDp);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6">
        <RegisterForm onRegister={setUser} />
        <hr className="my-4" />
        <LoginForm onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-4 flex justify-between items-center">
        <div>👋 Привет, {user.email}</div>
        <button
          onClick={() => signOut(auth)}
          className="text-sm text-red-500 underline"
        >
          Выйти
        </button>
      </div>

      <TechTable setTechMetrics={setTechMetrics} addToHistory={addToHistory} />
      <div className="my-8 border-t pt-6">
        <CleverTable setDpMetrics={setDpMetrics} addToHistory={addToHistory} />
      </div>

      <div className="my-10 border-t pt-6 text-sm">
        <h3 className="text-lg font-semibold mb-2">📊 Свод по бонусам</h3>
        <ul className="mb-4">
          <li>Бонусы за технику: {Math.round(techMetrics.bonus).toLocaleString()} ₸</li>
          <li>Бонусы за доп. продукцию (без НДС): {Math.round(dpMetrics.bonus).toLocaleString()} ₸</li>
          <li>Коэф. доп. продукции: {dpMetrics.coefDp}</li>
          <li className="font-bold">Итоговая сумма бонусов: {totalBonus.toLocaleString()} ₸</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2">📚 История продаж:</h3>
        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1">Тип</th>
              <th className="border p-1">Наименование</th>
              <th className="border p-1">Хозяйство</th>
              <th className="border p-1">Канал</th>
              <th className="border p-1">Сезон</th>
              <th className="border p-1">Кол-во / Сумма</th>
              <th className="border p-1">Бонус (₸)</th>
            </tr>
          </thead>
          <tbody>
            {salesHistory.map((item, i) => (
              <tr key={i}>
                <td className="border p-1">{item.type}</td>
                <td className="border p-1">{item.name}</td>
                <td className="border p-1">{item.farm}</td>
                <td className="border p-1">{item.channel}</td>
                <td className="border p-1">{item.season || "-"}</td>
                <td className="border p-1 text-right">
                  {(item.qty || item.sum).toLocaleString()}
                </td>
                <td className="border p-1 text-right">
                  {Math.round(item.bonus).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
