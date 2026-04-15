import { getApp, getApps, initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyBw67UWqoH-tQVyEqPDUlAjZWASJFHc5DA",
  authDomain: "porfoliooo.firebaseapp.com",
  projectId: "porfoliooo",
  storageBucket: "porfoliooo.appspot.com",
  messagingSenderId: "627269340192",
  appId: "1:627269340192:web:566592916d2be3e0090045",
  measurementId: "G-QSTD7G1DWC",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
