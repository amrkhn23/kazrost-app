import React, { useState, useEffect } from "react";
import { modelBonuses } from "./modelBonuses";
import { models } from "./models";
import { db } from "./firebase";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

const CHANNELS = [
  "Коммерция - 100% оплата",
  "Рассрочка",
  "Скидка",
  "Лизинг",
];

const SEASONS = [
  { label: "Сезон", value: "season" },
  { label: "Не сезон", value: "offSeason" },
];

// ✅ Вынесенная логика коэффициента
const getBonusCoef = (completion) => {
  if (completion > 1.0) return 1.1;
  if (completion > 0.9) return 1.0;
  if (completion > 0.8) return 0.9;
  if (completion > 0.7) return 0.8;
  if (completion > 0.5) return 0.5;
  return 0;
};

const TechTable = ({ addToHistory, setTechMetrics }) => {
  const [user] = useAuthState(auth);
  const [data, setData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [form, setForm] = useState({
    qty: 0,
    channel: CHANNELS[0],
    season: SEASONS[0].value,
    farm: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const snapshot = await getDocs(collection(db, "users", user.email, "techData"));
      const restored = models.map((model) => {
        const match = snapshot.docs.find((doc) => doc.id === model.name);
        const docData = match?.data();
        return {
          ...model,
          plan: docData?.plan ?? 0,
          facts: Array.isArray(docData?.facts) ? docData.facts : [],
        };
      });
      setData(restored);
    };
    load();
  }, [user]);

  const handlePlanChange = async (index, value) => {
    const updated = [...data];
    updated[index].plan = parseInt(value) || 0;
    setData(updated);

    if (user) {
      const ref = doc(db, "users", user.email, "techData", updated[index].name);
      await setDoc(ref, {
        plan: updated[index].plan,
        facts: updated[index].facts,
      });
    }
  };

  const handleAddFact = async (index) => {
    const updated = [...data];
    const newFact = { ...form };
    updated[index].facts.push(newFact);
    setData(updated);
    setActiveIndex(null);
    setForm({ qty: 0, channel: CHANNELS[0], season: SEASONS[0].value, farm: "" });

    const key = updated[index].bonusKey;
    const bonusPerUnit = modelBonuses[key]?.[newFact.channel.trim()]?.[newFact.season.trim()] || 0;
    const totalBonus = bonusPerUnit * newFact.qty;

    addToHistory?.({
      type: "Техника",
      name: updated[index].name,
      qty: newFact.qty,
      channel: newFact.channel,
      season: newFact.season,
      farm: newFact.farm,
      bonus: totalBonus,
    });

    if (user) {
      const ref = doc(db, "users", user.email, "techData", updated[index].name);
      await setDoc(ref, {
        plan: updated[index].plan,
        facts: updated[index].facts,
      });
    }
  };

  const totalPlan = data.reduce((sum, row) => sum + row.plan, 0);
  const totalFact = data.reduce((sum, row) => sum + row.facts.reduce((s, f) => s + f.qty, 0), 0);
  const completion = totalPlan ? totalFact / totalPlan : 0;
  const coef = getBonusCoef(completion);

  const rawBonus = data.reduce((sum, row) => {
    return sum + row.facts.reduce((s, f) => {
      const bonus = modelBonuses[row.bonusKey]?.[f.channel.trim()]?.[f.season.trim()] || 0;
      return s + f.qty * bonus;
    }, 0);
  }, 0);

  const totalBonus = rawBonus * coef;

  useEffect(() => {
    setTechMetrics?.({ bonus: totalBonus });
  }, [totalBonus]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🚜 Таблица по технике</h2>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-1">Модель</th>
            <th className="border p-1">План</th>
            <th className="border p-1">Факт</th>
            <th className="border p-1">Бонус (₸)</th>
            <th className="border p-1">Действие</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const factQty = row.facts.reduce((s, f) => s + f.qty, 0);
            const factBonus = row.facts.reduce((s, f) => {
              const b = modelBonuses[row.bonusKey]?.[f.channel.trim()]?.[f.season.trim()] || 0;
              return s + f.qty * b;
            }, 0);

            return (
              <tr key={i} className="relative">
                <td className="border p-1">{row.name}</td>
                <td className="border p-1">
                  <input
                    type="number"
                    value={row.plan}
                    onChange={(e) => handlePlanChange(i, e.target.value)}
                    className="w-16 border px-1"
                  />
                </td>
                <td className="border p-1">{factQty}</td>
                <td className="border p-1 text-right">
                  {Math.round(factBonus).toLocaleString()}
                </td>
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
                          placeholder="Кол-во"
                          value={form.qty}
                          onChange={(e) => setForm({ ...form, qty: parseInt(e.target.value) || 0 })}
                          className="border px-2 py-1"
                        />
                        <select
                          value={form.channel}
                          onChange={(e) => setForm({ ...form, channel: e.target.value })}
                          className="border px-2 py-1"
                        >
                          {CHANNELS.map((channel) => (
                            <option key={channel} value={channel}>{channel}</option>
                          ))}
                        </select>
                        <select
                          value={form.season}
                          onChange={(e) => setForm({ ...form, season: e.target.value })}
                          className="border px-2 py-1"
                        >
                          {SEASONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAddFact(i)}
                          className="bg-green-500 text-white py-1 rounded hover:bg-green-600"
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
            <td className="border p-1">{totalPlan}</td>
            <td className="border p-1">{totalFact}</td>
            <td className="border p-1 text-right" colSpan={2}>
              Выполнение: {(completion * 100).toFixed(1)}% | Коэф: {coef} | Бонус: {Math.round(totalBonus).toLocaleString()} ₸
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TechTable;
