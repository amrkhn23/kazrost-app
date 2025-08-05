// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Конфигурация проекта Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBTDYNMqwHHiqAogqZAn0FVOV8B4Pj2uZU",
  authDomain: "kazrostbonus.firebaseapp.com",
  projectId: "kazrostbonus",
  storageBucket: "kazrostbonus.appspot.com",
  messagingSenderId: "939961944497",
  appId: "1:939961944497:web:e8e291d56a06c32135d590",
};

// Инициализация приложения Firebase
const app = initializeApp(firebaseConfig);

// Экспорт сервисов Firestore и Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
