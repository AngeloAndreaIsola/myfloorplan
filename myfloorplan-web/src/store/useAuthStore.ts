import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null, token: string | null) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: (user, token) => set({ user, token }),
  initializeAuth: () => {
    // DEV BYPASS
    if (import.meta.env.DEV) {
       console.log("Bypassing Firebase Auth for local dev");
       setTimeout(() => {
         set({ 
           user: { uid: 'dev-user', email: 'dev@floorplan.local' } as User, 
           token: 'dummy_token', 
           isLoading: false 
         });
       }, 500);
       return;
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        set({ user, token, isLoading: false });
      } else {
        set({ user: null, token: null, isLoading: false });
      }
    });
  }
}));
