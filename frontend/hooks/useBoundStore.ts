import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserSlice, createUserSlice } from "../stores/createUserSlice";
import { ProgressionSlice, createProgressionSlice } from "../stores/createProgressionSlice";
import { PracticeSlice, createPracticeSlice } from "../stores/createPracticeSlice";
import { isDemoMode } from "../lib/demo-mode";

export type BoundState = UserSlice & ProgressionSlice & PracticeSlice;

export const useBoundStore = create<BoundState>()(
  persist(
    (...a) => ({
      ...createUserSlice(...a),
      ...createProgressionSlice(...a),
      ...createPracticeSlice(...a),
    }),
    {
      name: "edugap_bound_store", // Key used in local storage
    }
  )
);

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (isDemoMode() && params.get('mock') === 'true') {
    fetch('/mock-user.json')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch mock-user.json');
      })
      .then(mockData => {
        if (mockData) {
          useBoundStore.setState({
            name: mockData.name || 'Học Viên Mock',
            username: mockData.username || 'mock_user',
            joinedAt: mockData.joinedAt || new Date().toISOString(),
            streak: mockData.streak ?? 1,
            xp: mockData.xp ?? 0,
            completedSets: mockData.completedSets || [],
            activeDays: mockData.activeDays || [],
            loggedIn: mockData.loggedIn ?? true,
          });
          console.log('Successfully loaded mock user data from /mock-user.json');
        }
      })
      .catch(err => {
        console.error('Error loading mock-user.json:', err);
      });
  }
}
