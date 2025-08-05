import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

import TechTable from "./TechTable";
import CleverTable from "./CleverTable";
import LoginForm from "./LoginForm";

function App() {
  const [user, setUser] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [techMetrics, setTechMetrics] = useState({ bonus: 0 });
  const [dpMetrics, setDpMetrics] = useState({ bonus: 0, coefDp: 1 });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserSales(currentUser.uid);
      } else {
        setUser(null);
        setSalesHistory([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserSales = async (uid) => {
    setLoading(true);
    const q = query(
      collection(db, "users", uid, "sales"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSalesHistory(history);
    setLoading(false);
  };

  const getTechBonusWithCoef = (sales, planCount) => {
    const factCount = sales.length;
    const totalBonus = sales.reduce((sum, item) => sum + (item.bonus || 0), 0);
    const rate = planCount > 0 ? factCount / planCount : 0;

    let coef = 0;
    if (rate > 1) coef = 1.1;
    else if (rate >= 0.9) coef = 1.0;
    else if (rate >= 0.8) coef = 0.9;
    else if (rate >= 0.7) coef = 0.8;
    else if (rate >= 0.5) coef = 0.5;

    return Math.round(totalBonus * coef);
  };

  useEffect(() => {
    const techSales = salesHistory.filter((item) => item.type === "Техника");
    const dpSales = salesHistory.filter((item) => item.type === "Доп. продукция");

    const dpBonus = dpSales.reduce((sum, item) => sum + (item.bonus || 0), 0);
    const coefDp = dpSales.length >= 3 ? 1.1 : 1;

    const totalPlan = JSON.parse(localStorage.getItem("techPlans") || "{}");
    const totalPlanCount = Object.values(totalPlan).reduce((sum, val) => sum + Number(val), 0);
    const techBonus = getTechBonusWithCoef(techSales, totalPlanCount);

    setTechMetrics({ bonus: techBonus });
    setDpMetrics({ bonus: dpBonus, coefDp });
  }, [salesHistory]);

  const addToHistory = async (entry) => {
    if (!user) return;
    const entryWithMeta = {
      ...entry,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "users", user.uid, "sales"), entryWithMeta);
    await loadUserSales(user.uid);
  };

  const deleteHistoryItem = async (id) => {
    if (!user || !id) return;
    await deleteDoc(doc(db, "users", user.uid, "sales", id));
    await loadUserSales(user.uid);
  };

  const updateHistoryItem = async (id) => {
    if (!user || !id) return;
    const ref = doc(db, "users", user.uid, "sales", id);
    await updateDoc(ref, editForm);
    setEditingId(null);
    setEditForm({});
    await loadUserSales(user.uid);
  };

  const totalBonus = Math.round((techMetrics.bonus + dpMetrics.bonus) * dpMetrics.coefDp);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6">
        <LoginForm onLogin={setUser} />
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-600 text-sm">Загрузка...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-4 flex justify-between items-center">
        <div>👋 Привет, {user.email}</div>
        <button onClick={() => signOut(auth)} className="text-sm text-red-500 underline">
          Выйти
        </button>
      </div>

      <TechTable addToHistory={addToHistory} setTechMetrics={setTechMetrics} />
      <div className="my-8 border-t pt-6">
        <CleverTable addToHistory={addToHistory} setDpMetrics={setDpMetrics} />
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
              <th className="border p-1">Действие</th>
            </tr>
          </thead>
          <tbody>
            {salesHistory.map((item, i) => (
              <tr key={i}>
                {editingId === item.id ? (
                  <>
                    <td className="border p-1">
                      <input
                        value={editForm.type || item.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={editForm.name || item.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={editForm.farm || item.farm || ""}
                        onChange={(e) => setEditForm({ ...editForm, farm: e.target.value })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={editForm.channel || item.channel || ""}
                        onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={editForm.season || item.season || ""}
                        onChange={(e) => setEditForm({ ...editForm, season: e.target.value })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={editForm.qty || item.qty || item.sum || 0}
                        onChange={(e) => setEditForm({ ...editForm, qty: parseFloat(e.target.value) })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <input
                        value={editForm.bonus || item.bonus || 0}
                        onChange={(e) => setEditForm({ ...editForm, bonus: parseFloat(e.target.value) })}
                        className="w-full border"
                      />
                    </td>
                    <td className="border p-1">
                      <button onClick={() => updateHistoryItem(item.id)} className="text-green-600 hover:underline">💾</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600 ml-2 hover:underline">✖</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border p-1">{item.type}</td>
                    <td className="border p-1">{item.name}</td>
                    <td className="border p-1">{item.farm || "-"}</td>
                    <td className="border p-1">{item.channel || "-"}</td>
                    <td className="border p-1">{item.season || "-"}</td>
                    <td className="border p-1 text-right">{Number(item.qty ?? item.sum ?? 0).toLocaleString()}</td>
                    <td className="border p-1 text-right">{Math.round(item.bonus || 0).toLocaleString()}</td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditForm(item);
                        }}
                        className="text-blue-600 hover:underline"
                      >✏</button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-red-600 ml-2 hover:underline"
                      >🗑</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
