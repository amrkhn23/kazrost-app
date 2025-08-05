// firebaseUtils.js
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Сохраняет запись истории продаж в подколлекцию пользователя
 * @param {string} userEmail - email текущего пользователя (из auth)
 * @param {object} item - объект с данными (тип, наименование, бонус и т.п.)
 */
export async function saveHistoryItem(userEmail, item) {
  try {
    await addDoc(collection(db, "users", userEmail, "sales"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ История сохранена для ${userEmail}`);
  } catch (error) {
    console.error("❌ Ошибка при сохранении истории:", error);
  }
}
