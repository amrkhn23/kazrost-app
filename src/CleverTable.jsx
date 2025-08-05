import React, { useState, useEffect } from "react";
import { cleverModels } from "./cleverModels";
import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

const channelPercents = {
  "коммерция": 0.015,
  "лизинг": 0.01,
  "скидка": 0.005,
  "подарок": 0.0,
};

const getCoefDp = (rate) => {
  if (rate >= 0.9) return 1;
  if (rate >= 0.8) return 0.9;
  if (rate >= 0.6) return 0.8;
  if (rate >= 0.4) return 0.6;
  return 0.4;
};

const CleverTable = ({ setDpMetrics }) => {
  const [data, setData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [form, setForm] = useState({ sum: 0, channel: "коммерция", farm: "" });
  const [user] = useAuthState(auth);

  const handlePlanChange = async (index, value) => {
    const updated = [...data];
    updated[index].plan = parseInt(value) || 0;
    setData(updated);

    if (user) {
      const ref = doc(db, "users", user.email, "cleverData", updated[index].name);
      await setDoc(ref, {
        ...updated[index],
      });
    }
  };

  const handleAddFact = async (index) => {
    const updated = [...data];
    const newFact = { ...form };
    updated[index].facts.push(newFact);
    setData(updated);
    setActiveIndex(null);
    setForm({ sum: 0, channel: "коммерция", farm: "" });

    const percent = channelPercents[newFact.channel] || 0;
    const bonus = newFact.sum * percent;

    if (user) {
      await addDoc(collection(db, "users", user.email, "sales"), {
        type: "Доп. продукция",
        name: updated[index].name,
        sum: newFact.sum,
        channel: newFact.channel,
        farm: newFact.farm,
        qty: 1,
        bonus,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      const ref = doc(db, "users", user.email, "cleverData", updated[index].name);
      await setDoc(ref, {
        ...updated[index],
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const snapshot = await getDocs(collection(db, "users", user.email, "cleverData"));
        const restored = cleverModels.map((model) => {
          const match = snapshot.docs.find((doc) => doc.id === model.name);
          return match
            ? { ...model, ...match.data() }
            : { ...model, plan: 0, facts: [] };
        });
        setData(restored);
      }
    };
    fetchData();
  }, [user]);

  const totalPlan = data.reduce((sum, row) => sum + row.plan, 0);
  const totalFact = data.reduce((sum, row) => sum + row.facts.reduce((s, f) => s + f.sum, 0), 0);
  const completion = totalPlan ? totalFact / totalPlan : 0;
  const coefDp = getCoefDp(completion);

  const rawBonus = data.reduce(
    (sum, row) =>
      sum +
      row.facts.reduce((s, f) => s + f.sum * (channelPercents[f.channel] || 0), 0),
    0
  );
  const finalBonus = rawBonus / 1.12;

  useEffect(() => {
    setDpMetrics?.({
      bonus: finalBonus,
      coefDp,
      completion,
    });
  }, [finalBonus, coefDp, completion]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🌾 Таблица по доп. продукции</h2>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Наименование</th>
            <th className="border p-1">План (₸)</th>
            <th className="border p-1">Факт (₸)</th>
            <th className="border p-1">Бонус (₸)</th>
            <th className="border p-1">Действие</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const rowSum = row.facts.reduce((s, f) => s + f.sum, 0);
            const rowBonus = row.facts.reduce((s, f) => s + f.sum * (channelPercents[f.channel] || 0), 0) / 1.12;

            return (
              <tr key={i} className="relative">
                <td className="border p-1">{row.name}</td>
                <td className="border p-1">
                  <input
                    type="number"
                    className="w-24 border px-1"
                    value={row.plan}
                    onChange={(e) => handlePlanChange(i, e.target.value)}
                  />
                </td>
                <td className="border p-1">{Math.round(rowSum).toLocaleString()}</td>
                <td className="border p-1 text-right">{Math.round(rowBonus).toLocaleString()} ₸</td>
                <td className="border p-1 text-center">
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                  >
                    ➕ Добавить факт
                  </button>

                  {activeIndex === i && (
                    <div className="absolute bg-white border shadow-md p-2 mt-1 z-10 w-64 left-0">
                      <div className="flex flex-col gap-1 text-sm">
                        <input
                          type="text"
                          placeholder="Хозяйство"
                          value={form.farm}
                          onChange={(e) => setForm({ ...form, farm: e.target.value })}
                          className="border px-2 py-1"
                        />
                        <input
                          type="number"
                          placeholder="Сумма реализации"
                          value={form.sum}
                          onChange={(e) => setForm({ ...form, sum: parseInt(e.target.value) || 0 })}
                          className="border px-2 py-1"
                        />
                        <select
                          value={form.channel}
                          onChange={(e) => setForm({ ...form, channel: e.target.value })}
                          className="border px-2 py-1"
                        >
                          <option value="коммерция">Коммерция (1.5%)</option>
                          <option value="лизинг">Лизинг (1%)</option>
                          <option value="скидка">Скидка (0.5%)</option>
                          <option value="подарок">Подарок (0%)</option>
                        </select>
                        <button
                          className="bg-green-500 text-white py-1 rounded hover:bg-green-600"
                          onClick={() => handleAddFact(i)}
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 font-semibold">
            <td className="border p-1">ИТОГО</td>
            <td className="border p-1">{Math.round(totalPlan).toLocaleString()}</td>
            <td className="border p-1">{Math.round(totalFact).toLocaleString()}</td>
            <td className="border p-1 text-right" colSpan={2}>
              Выполнение: {(completion * 100).toFixed(1)}% | Коэф: {coefDp} | Бонус: {Math.round(finalBonus).toLocaleString()} ₸ (без НДС)
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CleverTable;
