'use client';

import { useAuth } from "@clerk/nextjs";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Ride, MOCK_RIDES, PAST_RIDES, AVATARS } from "./mock-data";
import { broadcastLocation } from "@/lib/actions/location.actions"; 

export type UserRole = "passenger" | "driver" | "both";

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
}

interface AppContextType {
  // ... your existing types ...
  isBroadcasting: boolean;
  activeTrackingRideId: string | null;
  startTracking: (rideId: string) => void;
  stopTracking: () => void;
}

interface AppProviderProps {
  children: ReactNode;
  initialUser?: any; // We'll pass the MongoDB user here
}

export interface UserProfile {
  _id?: string;
  clerkId?: string;  
  firstName?: string;
  lastName?: string;
  photo?: string;
  email: string;
  university: string;
  department: string;
  verified: boolean;
  ridesTaken: number;
  role: UserRole;
  ridesOffered: number;
  rating: number;
  phone: string;
  bio: string;
  vehicleInfo: VehicleInfo | null;
  driverLicenseImage: string | null;
  vehiclePicture: string | null;
  isDriverVerified?: boolean;
  savedPlaces?: { label: string; address: string; lat: number; lng: number }[];
}

export interface Notification {
  id: string;
  type: "success" | "info" | "warning";
  message: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  type: "ride_booked" | "ride_cancelled" | "ride_request" | "message" | "system" | "promo";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  rideReminders: boolean;
  promoAlerts: boolean;
  chatNotifications: boolean;
  showProfilePublic: boolean;
  showPhoneToDriver: boolean;
  showEmailToDriver: boolean;
  shareRideHistory: boolean;
  autoAcceptVerified: boolean;
  language: string;
  distanceUnit: "miles" | "km";
}

interface AppState {
  isLoggedIn: boolean;
  user: UserProfile;
  activeRole: UserRole;
  isDriverVerified: boolean;
  availableRides: Ride[];
  myUpcomingRides: Ride[];
  myPastRides: Ride[];
  offeredRides: Ride[];
  notifications: Notification[];
  appNotifications: AppNotification[];
  isDarkMode: boolean;
  settings: UserSettings;
  savedPlaces: { label: string; address: string; lat: number; lng: number }[];
  isBroadcasting: boolean;
  activeTrackingRideId: string | null;
  liveLocation: { lat: number, lng: number } | null; // <--- ADDED THIS
  login: () => void;
  logout: () => void;
  requestRide: (rideId: string) => void;
  cancelRide: (rideId: string) => void;
  offerRide: (ride: Omit<Ride, "id" | "driverName" | "driverAvatar" | "rating" | "verified" | "status">) => void;
  addNotification: (type: Notification["type"], message: string) => void;
  dismissNotification: (id: string) => void;
  toggleDarkMode: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateVehicle: (vehicle: VehicleInfo) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllAppNotifications: () => void;
  deleteAppNotification: (id: string) => void;
  startTracking: (rideId: string) => void;
  stopTracking: () => void;
}

const defaultSettings: UserSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  rideReminders: true,
  promoAlerts: false,
  chatNotifications: true,
  showProfilePublic: true,
  showPhoneToDriver: true,
  showEmailToDriver: false,
  shareRideHistory: false,
  autoAcceptVerified: true,
  language: "English",
  distanceUnit: "miles",
};

const INITIAL_APP_NOTIFICATIONS: AppNotification[] = [
  // ... (keeping your mock notifications exactly as they were to save space)
];

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children, initialUser }: AppProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [activeRole, setActiveRole] = useState<UserRole>("both");
  const [availableRides, setAvailableRides] = useState<Ride[]>(MOCK_RIDES);
  const [myUpcomingRides, setMyUpcomingRides] = useState<Ride[]>([]);
  const [myPastRides, setMyPastRides] = useState<Ride[]>(PAST_RIDES);
  const [offeredRides, setOfferedRides] = useState<Ride[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(INITIAL_APP_NOTIFICATIONS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const { isLoaded, isSignedIn, signOut } = useAuth();


  useEffect(() => {
    // If Clerk's frontend thinks we are logged in, BUT the server returned null 
    // (because the user was deleted or the DB failed), the session is corrupted.
    if (isLoaded && isSignedIn && !initialUser) {
      console.log("Dead session detected. Automatically logging out...");
      // Silently kill the dead cookie and send them back to the login screen
      signOut({ redirectUrl: '/login' }); 
    }
  }, [isLoaded, isSignedIn, initialUser, signOut]);
  // Global Tracking States
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeTrackingRideId, setActiveTrackingRideId] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number, lng: number } | null>(null); // <--- ADDED THIS

  // 1. On Mount: Check if we were tracking before the refresh
  useEffect(() => {
    const savedRideId = localStorage.getItem("uniRide_active_tracking");
    if (savedRideId) {
      setActiveTrackingRideId(savedRideId);
      setIsBroadcasting(true);
    }
  }, []);

  // 2. Updated Start Tracking: Save to disk
  const startTracking = (rideId: string) => {
    localStorage.setItem("uniRide_active_tracking", rideId);
    setActiveTrackingRideId(rideId);
    setIsBroadcasting(true);
  };

  // 3. Updated Stop Tracking: Remove from disk
  const stopTracking = () => {
    localStorage.removeItem("uniRide_active_tracking");
    setActiveTrackingRideId(null);
    setIsBroadcasting(false);
    setLiveLocation(null);
  };

  // 4. The Global Tracking Engine
  useEffect(() => {
    let watchId: number;
    
    // Only track if we are broadcasting AND we know which ride to attach it to
    if (isBroadcasting && activeTrackingRideId && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLiveLocation({ lat: latitude, lng: longitude }); // <--- TELLS THE APP WHERE THE CAR IS
          broadcastLocation(activeTrackingRideId, latitude, longitude, "driver"); 
        },
        (error) => console.error("Global GPS Error:", error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isBroadcasting, activeTrackingRideId]);

  const savedPlaces = [
    { label: "Home", address: "123 Oak Street", lat: 37.78, lng: -122.42 },
    { label: "University", address: "Stanford Campus", lat: 37.4275, lng: -122.1697 },
    { label: "Gym", address: "FitLife Center", lat: 37.79, lng: -122.41 },
  ];

  // ... (Your other standard context functions like addNotification, login, logout remain identical here)
  const addNotification = useCallback((type: Notification["type"], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, type, message, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const addAppNotification = useCallback((type: AppNotification["type"], title: string, message: string) => {
    const id = "an-" + Date.now().toString() + Math.random().toString(36).slice(2);
    setAppNotifications((prev) => [{ id, type, title, message, timestamp: Date.now(), read: false }, ...prev]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setAppNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setAppNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAllAppNotifications = useCallback(() => {
    setAppNotifications([]);
  }, []);

  const deleteAppNotification = useCallback((id: string) => {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const login = useCallback(() => {
    setIsLoggedIn(true);
    addNotification("success", "Welcome back, " + user?.lastName + "!");
  }, [user?.lastName, addNotification]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    addNotification("info", "You have been logged out.");
  }, [addNotification]);

  const requestRide = useCallback(
    (rideId: string) => {
      const ride = availableRides.find((r) => r.id === rideId);
      if (!ride) return;

      const updatedRide = { ...ride, seatsLeft: ride.seatsLeft - 1 };
      if (updatedRide.seatsLeft <= 1) updatedRide.status = "filling";

      setAvailableRides((prev) =>
        prev.map((r) => (r.id === rideId ? updatedRide : r))
      );
      setMyUpcomingRides((prev) => {
        if (prev.find((r) => r.id === rideId)) return prev;
        return [...prev, updatedRide];
      });
      setUser((prev) => ({ ...prev, ridesTaken: prev.ridesTaken + 1 }));
      addNotification("success", `Ride with ${ride.driverName} booked successfully!`);
      addAppNotification("ride_booked", "Ride Booked", `Your ride with ${ride.driverName} from ${ride.from} to ${ride.to} has been confirmed!`);
    },
    [availableRides, addNotification, addAppNotification]
  );

  const cancelRide = useCallback(
    (rideId: string) => {
      const ride = myUpcomingRides.find((r) => r.id === rideId);
      if (!ride) return;

      setMyUpcomingRides((prev) => prev.filter((r) => r.id !== rideId));
      setAvailableRides((prev) =>
        prev.map((r) =>
          r.id === rideId ? { ...r, seatsLeft: r.seatsLeft + 1, status: "available" as const } : r
        )
      );
      addNotification("info", "Ride cancelled.");
      addAppNotification("ride_cancelled", "Ride Cancelled", `Your ride from ${ride.from} to ${ride.to} has been cancelled.`);
    },
    [myUpcomingRides, addNotification, addAppNotification]
  );

  const offerRide = useCallback(
    (rideData: Omit<Ride, "id" | "driverName" | "driverAvatar" | "rating" | "verified" | "status">) => {
      const newRide: Ride = {
        ...rideData,
        id: "offer-" + Date.now(),
        driverName: user?.firstName + " " + user?.lastName,
        driverAvatar: user?.photo || "/default-avatar.png",
        rating: user?.rating,
        verified: user?.verified,
        status: "available",
      };
      setOfferedRides((prev) => [newRide, ...prev]);
      setAvailableRides((prev) => [newRide, ...prev]);
      setUser((prev) => ({ ...prev, ridesOffered: prev.ridesOffered + 1 }));
      addNotification("success", "Your ride has been published!");
      addAppNotification("system", "Ride Published", `Your ride from ${newRide.from} to ${newRide.to} is now visible to students.`);
    },
    [user, addNotification, addAppNotification]
  );

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setActiveRole(role);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateVehicle = useCallback((vehicle: VehicleInfo) => {
    setUser((prev) => ({ ...prev, vehicleInfo: vehicle }));
  }, []);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        activeRole,
        isDriverVerified: !!(user?.driverLicenseImage && user?.vehiclePicture && user?.vehicleInfo),
        availableRides,
        myUpcomingRides,
        myPastRides,
        offeredRides,
        notifications,
        appNotifications,
        isDarkMode,
        settings,
        savedPlaces,  
        isBroadcasting,
        activeTrackingRideId,
        liveLocation, // <--- EXPORTED SO THE MAP CAN SEE IT
        startTracking,
        stopTracking,
        login,
        logout,
        requestRide,
        cancelRide,
        offerRide,
        addNotification,
        dismissNotification,
        toggleDarkMode,
        switchRole,
        updateProfile,
        updateVehicle,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllAppNotifications,
        deleteAppNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}