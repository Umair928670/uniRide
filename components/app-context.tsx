'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Ride, MOCK_RIDES, PAST_RIDES, AVATARS } from "./mock-data";

export type UserRole = "passenger" | "driver" | "both";

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
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
  ridesOffered: number;
  rating: number;
  phone: string;
  bio: string;
  vehicleInfo: VehicleInfo | null;
  driverLicenseImage: string | null;
  vehiclePicture: string | null;
  isDriverVerified?: boolean;
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
  {
    id: "an1",
    type: "ride_booked",
    title: "Ride Confirmed",
    message: "Your ride with Sara Williams to City Mall on Mar 5 has been confirmed!",
    timestamp: Date.now() - 1000 * 60 * 30,
    read: false,
  },
  {
    id: "an2",
    type: "message",
    title: "New Message from Mike Chen",
    message: "Hey, I'll be at the Sports Complex pickup by 1:50 PM. Look for the blue Honda!",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    read: false,
  },
  {
    id: "an3",
    type: "ride_request",
    title: "New Ride Request",
    message: "Emma Davis wants to join your ride from Main Gate to Tech Park on Mar 8.",
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    read: false,
  },
  {
    id: "an4",
    type: "system",
    title: "Profile Verified",
    message: "Your student email has been verified! You now have the Verified Student badge.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    read: true,
  },
  {
    id: "an5",
    type: "promo",
    title: "Refer a Friend",
    message: "Share UniRide with classmates and earn $5 ride credit for each referral!",
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    read: true,
  },
  {
    id: "an6",
    type: "ride_cancelled",
    title: "Ride Cancelled",
    message: "The ride from Library Gate to City Mall on Feb 27 was cancelled by the driver.",
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    read: true,
  },
  {
    id: "an7",
    type: "system",
    title: "Safety Reminder",
    message: "Always verify your driver's identity before getting in. Share your trip with a friend!",
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
    read: true,
  },
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

  const savedPlaces = [
    { label: "Home", address: "123 Oak Street", lat: 37.78, lng: -122.42 },
    { label: "University", address: "Stanford Campus", lat: 37.4275, lng: -122.1697 },
    { label: "Gym", address: "FitLife Center", lat: 37.79, lng: -122.41 },
  ];

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
        driverName: user.firstName + " " + user.lastName,
        driverAvatar: user.photo || "",
        rating: user.rating,
        verified: user.verified,
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