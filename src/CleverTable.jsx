import React, { useState, useEffect } from "react";
import { cleverModels } from "./cleverModels";
import { saveHistoryItem } from "./firebaseUtils";

const channelPercents = {
  commercial: 0.015,
  leasing: 0.01,
  discount: 0.005,
};

const getCoefDp = (completionRate) => {
  if (completionRate >= 0.9) return 1;
  if (completionRate >= 0.8) return 0.9;
  if (completionRate >= 0.6) return 0.8;
  if (completionRate >= 0.4) return 0.6;
  return 0.4;
};

const CleverTable = ({ setDpMetrics, addHistory }) => {
  const [data, setData] = useState(
    cleverModels.map((m) => ({
      ...m,
      plan: 0,
      facts: [],
    }))
  );

  const [activeForm, setActiveForm] = useState(null);
  const [tempInput, setTempInput] = useState({
    sum: 0,
    channel: "commercial",
    farm: "",
  });

  const handlePlanChange = (index, value) => {
    const updated = [...data];
    updated[index].plan = parseInt(value) || 0;
    setData(updated);
  };

  const handleAddFact = (index) => {
    const updated = [...data];
    const fact = { ...tempInput };

    updated[index].facts.push(fact);
    setData(updated);
    setActiveForm(null);
    setTempInput({ sum: 0, channel: "commercial", farm: "" });

    const percent = channelPercents[fact.channel] || 0;
    const bonus = fact.sum * percent;

    addHistory?.({
      type: "Доп. продукция",
      name: data[index].name,
      qty: 1,
      sum: fact.sum,
      channel: fact.channel,
      farm: fact.farm,
      bonus,
    });
  };

  const totalPlan = data.reduce((sum, row) => sum + row.plan, 0);
  const totalFact = data.reduce(
    (sum, row) => sum + row.facts.reduce((s, f) => s + f.sum, 0),
    0
  );
  const completionRate = totalPlan ? totalFact / totalPlan : 0;
  const coefDp = getCoefDp(completionRate);

  const rawBonus = data.reduce((sum, row) => {
    return (
      sum +
      row.facts.reduce((s, fact) => {
        const percent = channelPercents[fact.channel] || 0;
        return s + fact.sum * percent;
      }, 0)
    );
  }, 0);

  const finalBonus = rawBonus / 1.12;

  useEffect(() => {
    if (typeof setDpMetrics === "function") {
      setDpMetrics({
        bonus: finalBonus,
        coefDp,
        completion: completionRate,
      });
    }
  }, [rawBonus, coefDp, completionRate, setDpMetrics]);

  return (
    <div className="p-4 relative">
      <h2 className="text-xl font-bold mb-4">🌾 Таблица по доп. продукции</h2>
      <table className="w-full border text-sm relative">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Наименование</th>
            <th className="border p-1">План (₸)</th>
            <th className="border p-1">Факт (₸)</th>
            <th className="border p-1">Бонус (₸)</th>
            <th className="border p-1">Действие</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const totalSum = row.facts.reduce((s, f) => s + f.sum, 0);
            const rowBonus = row.facts.reduce((s, f) => {
              const percent = channelPercents[f.channel] || 0;
              return s + f.sum * percent;
            }, 0);

            return (
              <tr key={i} className="relative">
                <td className="border p-1">{row.name}</td>
                <td className="border p-1">
                  <input
                    type="number"
                    value={row.plan}
                    onChange={(e) => handlePlanChange(i, e.target.value)}
                    className="w-24 border px-1"
                  />
                </td>
                <td className="border p-1">
                  {Math.round(totalSum).toLocaleString()}
                </td>
                <td className="border p-1 text-right">
                  {Math.round(rowBonus / 1.12).toLocaleString()} ₸
                </td>
                <td className="border p-1 text-center relative">
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setActiveForm(activeForm === i ? null : i)}
                  >
                    ➕ Добавить факт
                  </button>

                  {activeForm === i && (
                    <div className="absolute bg-white border shadow-md p-2 mt-1 z-10 w-64 left-0">
                      <div className="flex flex-col gap-1 text-sm">
                        <input
                          type="text"
                          placeholder="Хозяйство"
                          value={tempInput.farm}
                          onChange={(e) =>
                            setTempInput({ ...tempInput, farm: e.target.value })
                          }
                          className="border px-2 py-1"
                        />
                        <input
                          type="number"
                          placeholder="Сумма реализации"
                          value={tempInput.sum}
                          onChange={(e) =>
                            setTempInput({
                              ...tempInput,
                              sum: parseInt(e.target.value) || 0,
                            })
                          }
                          className="border px-2 py-1"
                        />
                        <select
                          value={tempInput.channel}
                          onChange={(e) =>
                            setTempInput({
                              ...tempInput,
                              channel: e.target.value,
                            })
                          }
                          className="border px-2 py-1"
                        >
                          <option value="commercial">Коммерция (1.5%)</option>
                          <option value="leasing">Лизинг (1%)</option>
                          <option value="discount">Скидка (0.5%)</option>
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
            <td className="border p-1">
              {Math.round(totalPlan).toLocaleString()}
            </td>
            <td className="border p-1">
              {Math.round(totalFact).toLocaleString()}
            </td>
            <td className="border p-1 text-right" colSpan={2}>
              Выполнение: {(completionRate * 100).toFixed(1)}% | НДС: 12% | Бонус:{" "}
              {Math.round(finalBonus).toLocaleString()} ₸
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CleverTable;
