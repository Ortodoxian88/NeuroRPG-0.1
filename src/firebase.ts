import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, clearIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentSingleTabManager({})}),
  experimentalForceLongPolling: true
}, (firebaseConfig as any).firestoreDatabaseId);

export const clearFirestoreCache = async () => {
  try {
    await clearIndexedDbPersistence(db);
    window.location.reload();
  } catch (error) {
    console.error("Error clearing Firestore cache", error);
  }
};

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("signInWithGoogle called");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("signInWithPopup success:", result.user.email);
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    if (error.code === 'auth/popup-blocked') {
      alert("Пожалуйста, разрешите всплывающие окна для этого сайта, чтобы войти через Google.");
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("Этот домен не авторизован в настройках Firebase. Пожалуйста, добавьте его в список разрешенных доменов в консоли Firebase.");
    } else if (error.message?.includes('missing initial state') || error.message?.includes('sessionStorage')) {
      alert("Ошибка авторизации. Пожалуйста, откройте игру в стандартном браузере (Chrome, Safari), а не внутри мессенджера (Telegram, VK и т.д.).");
    } else {
      alert("Произошла ошибка при входе: " + error.message);
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
