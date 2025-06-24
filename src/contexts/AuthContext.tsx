import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
  signInAnonymously // For initial anonymous sign-in if no custom token
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore if you plan to use it for data storage

// ประกาศตัวแปร global ที่ Canvas จัดหาให้
declare const __firebase_config: string;
declare const __initial_auth_token: string;
declare const __app_id: string; // เพิ่ม __app_id เข้ามาด้วย

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  username: string | null; // เปลี่ยนเป็น string | null เพื่อเก็บ username
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean; // เพิ่มสถานะการโหลด
  authError: string | null; // เพิ่มสถานะข้อผิดพลาด
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null); // สถานะสำหรับ username
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initial Firebase setup and authentication state listener
  useEffect(() => {
    try {
      const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      // const db = getFirestore(app); // หากต้องการใช้ Firestore

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          // ใช้ email เป็น username หาก displayName ไม่มี
          setUsername(currentUser.displayName || currentUser.email || currentUser.uid);
        } else {
          setUser(null);
          setUsername(null);
          // หากไม่มีผู้ใช้เข้าสู่ระบบและมี initial_auth_token ให้ลองลงชื่อเข้าใช้แบบกำหนดเอง
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
              await signInWithCustomToken(auth, __initial_auth_token);
              console.log("Signed in with custom token.");
            } catch (error) {
              console.error("Firebase custom token sign-in failed:", error);
              // หาก custom token ล้มเหลว ให้ลงชื่อเข้าใช้แบบไม่ระบุตัวตน
              try {
                await signInAnonymously(auth);
                console.log("Signed in anonymously.");
              } catch (anonError) {
                console.error("Firebase anonymous sign-in failed:", anonError);
                setAuthError("Failed to sign in. Please try again.");
              }
            }
          } else {
            // หากไม่มี token และยังไม่มีผู้ใช้ ให้ลงชื่อเข้าใช้แบบไม่ระบุตัวตน
            try {
              await signInAnonymously(auth);
              console.log("Signed in anonymously.");
            } catch (anonError) {
              console.error("Firebase anonymous sign-in failed:", anonError);
              setAuthError("Failed to sign in. Please try again.");
            }
          }
        }
        setIsLoading(false); // เสร็จสิ้นการโหลด
      });

      return () => unsubscribe(); // คลีนอัพ listener
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setAuthError("Failed to initialize Firebase. Please check console for details.");
      setIsLoading(false);
    }
  }, []); // Depend on nothing to run only once on mount

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // userCredential.user จะถูกจัดการโดย onAuthStateChanged
      // setUser(userCredential.user);
      // setUsername(userCredential.user.displayName || userCredential.user.email || userCredential.user.uid);
    } catch (error: any) {
      console.error("Login failed:", error);
      setAuthError(error.message || "Login failed. Please check your credentials.");
      throw error; // ส่งข้อผิดพลาดออกไปเพื่อให้ component ที่เรียกสามารถจับได้
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // userCredential.user จะถูกจัดการโดย onAuthStateChanged
      // setUser(userCredential.user);
      // setUsername(userCredential.user.displayName || userCredential.user.email || userCredential.user.uid);
    } catch (error: any) {
      console.error("Registration failed:", error);
      setAuthError(error.message || "Registration failed. Please try again.");
      throw error; // ส่งข้อผิดพลาดออกไปเพื่อให้ component ที่เรียกสามารถจับได้
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const auth = getAuth();
      await signOut(auth);
      // setUser(null); // onAuthStateChanged จะจัดการให้
      // setUsername(null); // onAuthStateChanged จะจัดการให้
      // หลัง logout ลอง sign in แบบ anonymous อีกครั้ง
      try {
          await signInAnonymously(auth);
          console.log("Signed in anonymously after logout.");
      } catch (anonError) {
          console.error("Firebase anonymous sign-in failed after logout:", anonError);
          setAuthError("Failed to sign in anonymously after logout.");
      }
    } catch (error: any) {
      console.error("Logout failed:", error);
      setAuthError(error.message || "Logout failed.");
      throw error; // ส่งข้อผิดพลาดออกไปเพื่อให้ component ที่เรียกสามารถจับได้
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    username,
    login,
    register,
    logout,
    isLoading,
    authError,
  };

  // แสดงหน้าจอโหลดในระหว่างการเริ่มต้น Auth
  if (isLoading && !user && !authError) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-zinc-900 to-stone-900 flex items-center justify-center text-white text-xl">
              <svg className="animate-spin h-8 w-8 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังโหลด...
          </div>
      );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
