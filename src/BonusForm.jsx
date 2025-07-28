import { useEffect, useState } from 'react';

const MODELS = [
  { name: 'Acros', bonusPerUnit: 339000 },
  { name: 'Torum', bonusPerUnit: 524000 },
  { name: 'Vector 410', bonusPerUnit: 289000 },
  { name: 'T500', bonusPerUnit: 524000 },
  { name: 'Don-680', bonusPerUnit: 339000 },
  { name: 'RSM 2000', bonusPerUnit: 389000 },
];

function BonusForm() {
  const [plan, setPlan] = useState('');
  const [fact, setFact] = useState('');
  const [model, setModel] = useState(MODELS[0].name);
  const [bonus, setBonus] = useState(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem('plan');
    const savedFact = localStorage.getItem('fact');
    const savedModel = localStorage.getItem('model');
    const savedBonus = localStorage.getItem('bonus');

    if (savedPlan) setPlan(savedPlan);
    if (savedFact) setFact(savedFact);
    if (savedModel) setModel(savedModel);
    if (savedBonus) setBonus(Number(savedBonus));
  }, []);

  useEffect(() => {
    localStorage.setItem('plan', plan);
    localStorage.setItem('fact', fact);
    localStorage.setItem('model', model);
    if (bonus !== null) {
      localStorage.setItem('bonus', bonus);
    }
  }, [plan, fact, model, bonus]);

  const handleCalculate = () => {
    const planNum = parseInt(plan);
    const factNum = parseInt(fact);

    if (isNaN(planNum) || isNaN(factNum) || planNum <= 0) {
      alert('Введите корректные числовые значения');
      return;
    }

    const selected = MODELS.find((item) => item.name === model);
    const bonusPerUnit = selected ? selected.bonusPerUnit : 0;

    let percent = 0;
    const ratio = factNum / planNum;

    if (ratio >= 1) percent = 110;
    else if (ratio >= 0.9) percent = 100;
    else if (ratio >= 0.8) percent = 90;
    else if (ratio >= 0.7) percent = 80;
    else if (ratio >= 0.5) percent = 50;
    else percent = 0;

    const result = factNum * bonusPerUnit * (percent / 100);
    setBonus(result);

    // 📝 Добавляем в историю
    const entry = {
      type: 'Техника',
      details: `Модель: ${model}\nПлан: ${plan}\nФакт: ${fact}`,
      bonus: result
    };

    const history = JSON.parse(localStorage.getItem('history')) || [];
    history.push(entry);
    localStorage.setItem('history', JSON.stringify(history));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold">Расчёт бонуса по технике</h2>

      <div className="space-y-2">
        <label className="block font-medium">Модель техники:</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {MODELS.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block font-medium">План продаж (шт):</label>
        <input
          type="number"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Факт продаж (шт):</label>
        <input
          type="number"
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        onClick={handleCalculate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Рассчитать бонус
      </button>

      {bonus !== null && (
        <div className="text-lg font-bold text-green-600 mt-4">
          💰 Бонус: {bonus.toLocaleString()} ₸
        </div>
      )}
    </div>
  );
}

export default BonusForm;
