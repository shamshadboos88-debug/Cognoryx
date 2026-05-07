// lib/firebase.js — Firebase configuration & helpers

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// ── AUTH ─────────────────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ── USER PROFILE ─────────────────────────────────────────────
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    plan: "free",
    createdAt: serverTimestamp(),
    usage: { chats: 0, images: 0, videos: 0, date: new Date().toDateString() },
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, data) =>
  updateDoc(doc(db, "users", uid), data);

// ── USAGE LIMITS ─────────────────────────────────────────────
export const LIMITS = {
  free: { chats: 20, images: 2, videos: 1 },
  pro:  { chats: 999, images: 50, videos: 10 },
};

export const checkAndIncrementUsage = async (uid, type) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { allowed: false };

  const data = snap.data();
  const plan = data.plan || "free";
  const today = new Date().toDateString();
  let usage = data.usage || { chats: 0, images: 0, videos: 0, date: today };

  // Reset daily usage if new day
  if (usage.date !== today) {
    usage = { chats: 0, images: 0, videos: 0, date: today };
  }

  const limit = LIMITS[plan][type];
  if (usage[type] >= limit) return { allowed: false, limit };

  usage[type] += 1;
  await updateDoc(ref, { usage });
  return { allowed: true, used: usage[type], limit };
};

// ── CHAT HISTORY ─────────────────────────────────────────────
export const saveChatMessage = async (uid, chatId, message) => {
  await addDoc(collection(db, "users", uid, "chats", chatId, "messages"), {
    ...message,
    timestamp: serverTimestamp(),
  });
};

export const getChatHistory = async (uid) => {
  const q = query(
    collection(db, "users", uid, "chats"),
    orderBy("updatedAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createChat = async (uid, title) => {
  const ref = await addDoc(collection(db, "users", uid, "chats"), {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// ── STORAGE ──────────────────────────────────────────────────
export const uploadFile = async (uid, file, folder = "images") => {
  const storageRef = ref(storage, `${folder}/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
