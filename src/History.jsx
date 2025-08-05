import React from "react";

const History = ({ history }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🧾 История продаж</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">Нет записей</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
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
            {history.map((entry, i) => (
              <tr key={i}>
                <td className="border p-1">{entry.type}</td>
                <td className="border p-1">{entry.name}</td>
                <td className="border p-1">{entry.farm || "-"}</td>
                <td className="border p-1">{entry.channel || "-"}</td>
                <td className="border p-1">{entry.season || "-"}</td>
                <td className="border p-1 text-right">
                  {entry.qty
                    ? `${entry.qty.toLocaleString()} шт`
                    : `${entry.sum?.toLocaleString() || 0} ₸`}
                </td>
                <td className="border p-1 text-right">
                  {Math.round(entry.bonus).toLocaleString()} ₸
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default History;
