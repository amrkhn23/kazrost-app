import React, { useState, useEffect } from "react";
import { modelBonuses } from "./modelBonuses";
import { models } from "./models";

const TechTable = ({ addToHistory, setTechMetrics }) => {
  const [data, setData] = useState(
    models.map((m) => ({
      ...m,
      plan: 0,
      facts: [],
    }))
  );

  const [activeForm, setActiveForm] = useState(null);
  const [tempInput, setTempInput] = useState({
    qty: 0,
    channel: "commercial",
    season: "season",
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
    setTempInput({ qty: 0, channel: "commercial", season: "season", farm: "" });

    const bonusPerUnit =
      modelBonuses[data[index].bonusKey]?.[fact.channel]?.[fact.season] || 0;

    addToHistory?.({
      type: "Техника",
      name: data[index].name,
      qty: fact.qty,
      channel: fact.channel,
      season: fact.season,
      farm: fact.farm,
      bonus: fact.qty * bonusPerUnit,
    });
  };

  const totalPlan = data.reduce((sum, row) => sum + row.plan, 0);
  const totalFact = data.reduce(
    (sum, row) => sum + row.facts.reduce((s, f) => s + f.qty, 0),
    0
  );
  const completionRate = totalPlan ? totalFact / totalPlan : 0;

  const coef =
    completionRate >= 1.1
      ? 1.1
      : completionRate >= 1.0
      ? 1.0
      : completionRate >= 0.8
      ? 0.8
      : 0.5;

  const rawBonus = data.reduce((sum, row) => {
    return (
      sum +
      row.facts.reduce((s, fact) => {
        const bonusPerUnit =
          modelBonuses[row.bonusKey]?.[fact.channel]?.[fact.season] || 0;
        return s + fact.qty * bonusPerUnit;
      }, 0)
    );
  }, 0);

  const totalBonus = rawBonus * coef;

  useEffect(() => {
    if (typeof setTechMetrics === "function") {
      setTechMetrics({ bonus: totalBonus });
    }
  }, [totalBonus, setTechMetrics]);

  return (
    <div className="p-4 relative">
      <h2 className="text-xl font-bold mb-4">🚜 Таблица по технике</h2>
      <table className="w-full border text-sm relative">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1">Модель</th>
            <th className="border p-1">План</th>
            <th className="border p-1">Факт</th>
            <th className="border p-1">Бонус (₸)</th>
            <th className="border p-1">Действие</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const totalQty = row.facts.reduce((s, f) => s + f.qty, 0);
            const totalRowBonus = row.facts.reduce((s, f) => {
              const bonusPerUnit =
                modelBonuses[row.bonusKey]?.[f.channel]?.[f.season] || 0;
              return s + f.qty * bonusPerUnit;
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
                <td className="border p-1">{totalQty}</td>
                <td className="border p-1 text-right">
                  {Math.round(totalRowBonus).toLocaleString()}
                </td>
                <td className="border p-1 text-center relative">
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() =>
                      setActiveForm(activeForm === i ? null : i)
                    }
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
                            setTempInput({
                              ...tempInput,
                              farm: e.target.value,
                            })
                          }
                          className="border px-2 py-1"
                        />
                        <input
                          type="number"
                          placeholder="Кол-во"
                          value={tempInput.qty}
                          onChange={(e) =>
                            setTempInput({
                              ...tempInput,
                              qty: parseInt(e.target.value) || 0,
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
                          <option value="commercial">Коммерция</option>
                          <option value="discount">Скидка / Рассрочка</option>
                          <option value="gift">Лизинг / Подарок</option>
                        </select>
                        <select
                          value={tempInput.season}
                          onChange={(e) =>
                            setTempInput({
                              ...tempInput,
                              season: e.target.value,
                            })
                          }
                          className="border px-2 py-1"
                        >
                          <option value="season">Сезон</option>
                          <option value="offSeason">Не сезон</option>
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
            <td className="border p-1">{totalPlan}</td>
            <td className="border p-1">{totalFact}</td>
            <td className="border p-1 text-right" colSpan={2}>
              Выполнение: {(completionRate * 100).toFixed(1)}% | Коэф: {coef} | Бонус:{" "}
              {Math.round(totalBonus).toLocaleString()} ₸
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TechTable;
