import { StateCreator } from "zustand";
import { BoundState } from "../hooks/useBoundStore";
import { signOutSupabaseBrowser } from "@/lib/auth/supabase-session";

export interface UserSlice {
  name: string;
  username: string;
  mssv: string;
  role: string;
  userId: string;
  token: string;
  isDemoAccount: boolean;
  demoProfileKey: string | null;
  forceDemoOnboarding: boolean;
  joinedAt: string; // ISO string to represent date, avoiding Dayjs serialization issues in JSON persist
  loggedIn: boolean;
  setName: (name: string) => void;
  setUsername: (username: string) => void;
  setMssv: (mssv: string) => void;
  setRole: (role: string) => void;
  setUserId: (userId: string) => void;
  setToken: (token: string) => void;
  setForceDemoOnboarding: (forceDemoOnboarding: boolean) => void;
  logIn: (userData?: {
    name: string;
    username: string;
    mssv: string;
    role: string;
    userId: string;
    token: string;
    isDemoAccount?: boolean;
    demoProfileKey?: string | null;
  }) => void;
  logOut: () => void;
}

export const createUserSlice: StateCreator<
  BoundState,
  [],
  [],
  UserSlice
> = (set) => ({
  name: "",
  username: "",
  mssv: "",
  role: "",
  userId: "",
  token: "",
  isDemoAccount: false,
  demoProfileKey: null,
  forceDemoOnboarding: false,
  joinedAt: new Date().toISOString(),
  loggedIn: false,
  setName: (name) => set(() => ({ name })),
  setUsername: (username) => set(() => ({ username })),
  setMssv: (mssv) => set(() => ({ mssv })),
  setRole: (role) => set(() => ({ role })),
  setUserId: (userId) => set(() => ({ userId })),
  setToken: (token) => set(() => ({ token })),
  setForceDemoOnboarding: (forceDemoOnboarding) => set(() => ({ forceDemoOnboarding })),
  logIn: (userData) => set((state) => {
    if (userData) {
      const normalizedRole = userData.role.toLowerCase();
      const selectedPersona =
        normalizedRole === 'mentor' || normalizedRole === 'teacher'
          ? 'mentor'
          : normalizedRole === 'admin' || normalizedRole === 'btc' || normalizedRole === 'dev'
            ? 'btc'
            : 'student';
      const isDemoAccount = Boolean(userData.isDemoAccount);
      const demoProfileKey = userData.demoProfileKey || null;
      const isSameUser = Boolean(state.userId) && state.userId === userData.userId;

      if (typeof window !== 'undefined') {
        if (!isSameUser) {
          localStorage.removeItem('mentora_answers_history');
          localStorage.removeItem('mentora_pre_submitted');
        }
        if (isDemoAccount) {
          localStorage.removeItem(`mentora_onboarding_v1:${userData.userId}`);
          localStorage.removeItem(`mentora_onboarding_status_v1:${userData.userId}`);
          localStorage.removeItem(`mentora_first_run_v1:${userData.userId}`);
        }
      }

      return {
        loggedIn: true,
        name: userData.name,
        username: userData.username,
        mssv: userData.mssv,
        role: userData.role,
        userId: userData.userId,
        token: userData.token,
        isDemoAccount,
        demoProfileKey,
        forceDemoOnboarding: isDemoAccount && demoProfileKey === 'full_flow_v1',
        joinedAt: isSameUser ? state.joinedAt : new Date().toISOString(),
        selectedPersona,
        ...(isSameUser
          ? {}
          : {
              xp: 0,
              streak: 1,
              activeDays: [],
              completedSets: [],
              eloHistoryEvents: [],
              conceptMasteries: {},
              skills: [],
              activePracticeSession: null,
              activePracticeQuestions: [],
            }),
      };
    }
    return { loggedIn: true, joinedAt: new Date().toISOString() };
  }),
  logOut: () => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mentora_answers_history');
      localStorage.removeItem('mentora_pre_submitted');
      void signOutSupabaseBrowser();
    }
    return { 
      loggedIn: false,
      name: "",
      username: "",
      mssv: "",
      role: "",
      userId: "",
      token: "",
      isDemoAccount: false,
      demoProfileKey: null,
      forceDemoOnboarding: false,
      selectedPersona: 'student',
      xp: 0,
      streak: 1,
      activeDays: [],
      completedSets: [],
      eloHistoryEvents: [],
      conceptMasteries: {},
      skills: [],
      activePracticeSession: null,
      activePracticeQuestions: [],
    };
  }),
});
