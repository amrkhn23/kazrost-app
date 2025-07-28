import React, { useState, useEffect } from "react";
import TechTable from "./TechTable";
import CleverTable from "./CleverTable";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [techMetrics, setTechMetrics] = useState({ bonus: 0 });
  const [dpMetrics, setDpMetrics] = useState({ bonus: 0, coefDp: 1, completion: 0 });
  const [salesHistory, setSalesHistory] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const q = query(collection(db, "sales"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map((doc) => doc.data());
        setSalesHistory(history);
      }
    });

    return () => unsub();
  }, []);

  const addToHistory = async (entry) => {
    const entryWithUser = { ...entry, userId };

    try {
      await addDoc(collection(db, "sales"), entryWithUser);
      setSalesHistory((prev) => [...prev, entryWithUser]);
    } catch (e) {
      console.error("Ошибка добавления в Firestore:", e);
    }
  };

  const totalBonus = Math.round(techMetrics.bonus + dpMetrics.bonus * dpMetrics.coefDp);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
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
