import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// ลบการ import Firebase ออกทั้งหมด เนื่องจากเราจะใช้ Backend ของเราเองในการยืนยันตัวตน
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User, signInAnonymously } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// ลบการประกาศตัวแปร global ที่ Canvas จัดหาให้สำหรับ Firebase ออก
// declare const __firebase_config: string;
// declare const __initial_auth_token: string;
// declare const __app_id: string;

interface AuthContextType {
  user: { uid: string } | null; // เปลี่ยนเป็น user object อย่างง่ายเพื่อเช็ค isAuthenticated
  isAuthenticated: boolean;
  username: string | null;
  // ลบฟังก์ชัน login และ register ที่เป็นของ Firebase ออก เพราะ Login.tsx/Register.tsx จะ fetch ไปที่ backend เอง
  // login: (email: string, password: string) => Promise<void>;
  // register: (email: string, password: string) => Promise<void>;
  setLoggedInUser: (username: string) => void; // เพิ่มฟังก์ชันใหม่สำหรับตั้งค่าผู้ใช้ที่เข้าสู่ระบบสำเร็จจาก backend
  logout: () => void; // เปลี่ยน logout ให้จัดการสถานะใน frontend อย่างง่าย
  isLoading: boolean; // ยังคงมีสถานะการโหลด (แต่จะไม่ใช่โหลด Firebase แล้ว)
  authError: string | null; // ยังคงมีสถานะข้อผิดพลาด
  setAuthError: (error: string | null) => void; // เพิ่มฟังก์ชันเพื่อให้คอมโพเนนต์อื่นตั้งค่า error ได้
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // ตั้งค่าเริ่มต้นเป็น false เพราะเราจะไม่โหลด Firebase ตอนแรก
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // ในกรณีที่เราใช้ Backend ของเราเอง, การจัดการ session อาจต้องใช้ localStorage หรือ cookies
    // แต่สำหรับตัวอย่างนี้ เราจะจัดการแค่ state ใน React
    // หากมี token ใน localStorage คุณอาจจะดึงมาเช็คและตั้งค่า user ตรงนี้ได้
    setIsLoading(false); // หยุดสถานะโหลดเมื่อ component mount (ไม่เกี่ยวข้องกับ Firebase แล้ว)
  }, []);

  // ฟังก์ชันนี้จะถูกเรียกเมื่อ Login.tsx ได้รับการยืนยันตัวตนจาก Backend สำเร็จ
  const setLoggedInUser = useCallback((name: string) => {
    setUser({ uid: name }); // ตั้งค่า user อย่างง่าย (เช่น ใช้ username เป็น uid)
    setUsername(name);
    setAuthError(null); // เคลียร์ error
  }, []);

  // ฟังก์ชัน Logout สำหรับ Backend ของเราเอง
  const logout = useCallback(() => {
    setUser(null);
    setUsername(null);
    setAuthError(null);
    // ในแอปจริง คุณอาจจะต้องเรียก API ของ Backend เพื่อล้าง session หรือลบ token ใน localStorage
    // เช่น: fetch('/api/logout', { method: 'POST' });
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    username,
    setLoggedInUser, // ส่งฟังก์ชันนี้ออกไปให้คอมโพเนนต์อื่นใช้
    logout,
    isLoading,
    authError,
    setAuthError, // ส่งฟังก์ชันนี้ออกไปให้คอมโพเนนต์อื่นใช้
  };

  // ไม่มีหน้าจอโหลด Firebase Initialization อีกต่อไป
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
