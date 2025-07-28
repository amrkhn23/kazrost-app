// firebaseUtils.js
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Сохраняет одну запись истории в Firebase Firestore
export async function saveHistoryItem(item) {
  try {
    await addDoc(collection(db, "history"), {
      ...item,
      createdAt: serverTimestamp(),
    });
    console.log("✅ История сохранена в Firebase");
  } catch (error) {
    console.error("❌ Ошибка при сохранении в Firebase:", error);
  }
}
