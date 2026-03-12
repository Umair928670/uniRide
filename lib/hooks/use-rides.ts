import useSWR from 'swr';

// 1. The standard fetcher function that talks to your Next.js API
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

// 2. The Custom Hook with "Bulletproof" Settings
export function useRides() {
  const { data, error, isLoading, mutate } = useSWR('/api/rides', fetcher, {
    // --- THE SAFETY SETTINGS ---
    revalidateOnFocus: false,     // MUST BE FALSE: Stops DB spam when switching from WhatsApp
    revalidateOnReconnect: true,  // Good to have: Refreshes if they lose and regain WiFi
    dedupingInterval: 10000,      // THE BOUNCER: Ignores duplicate requests within 10 seconds
    focusThrottleInterval: 15000, // Throttles tab-focus fetching if you ever turn it back on
    errorRetryCount: 3,           // Stops infinite loops if the DB is temporarily asleep
  });

  return {
    rides: data,
    isLoading,
    isError: error,
    mutate, // We will use this later to instantly update the UI when someone books a ride!
  };
}