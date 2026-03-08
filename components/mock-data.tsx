export const AVATARS = {
  driver1: "https://images.unsplash.com/photo-1737352202281-cb8105fb14bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbGUlMjBjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwc21pbGV8ZW58MXx8fHwxNzcyODEyMzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  driver2: "https://images.unsplash.com/photo-1771051027651-707f9fbd44b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGZlbWFsZSUyMGNvbGxlZ2UlMjBzdHVkZW50JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyODEyMzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  driver3: "https://images.unsplash.com/photo-1724118135481-50436d913231?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNhc3VhbCUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzcyODEyMzU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  driver4: "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcyNzM5ODMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

export interface Ride {
  id: string;
  driverName: string;
  driverAvatar: string;
  rating: number;
  from: string;
  to: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  departureTime: string;
  date: string;
  seatsLeft: number;
  totalSeats: number;
  price: number;
  status: "available" | "filling";
  verified: boolean;
}

export const MOCK_RIDES: Ride[] = [
  {
    id: "1",
    driverName: "Alex Johnson",
    driverAvatar: AVATARS.driver1,
    rating: 4.8,
    from: "Engineering Block",
    to: "Downtown Metro",
    fromCoords: [37.4285, -122.1725],
    toCoords: [37.4435, -122.164],
    departureTime: "8:30 AM",
    date: "Today",
    seatsLeft: 3,
    totalSeats: 4,
    price: 5,
    status: "available",
    verified: true,
  },
  {
    id: "2",
    driverName: "Sara Williams",
    driverAvatar: AVATARS.driver2,
    rating: 4.9,
    from: "Library Gate",
    to: "City Mall",
    fromCoords: [37.4265, -122.168],
    toCoords: [37.4455, -122.158],
    departureTime: "9:00 AM",
    date: "Today",
    seatsLeft: 1,
    totalSeats: 3,
    price: 7,
    status: "filling",
    verified: true,
  },
  {
    id: "3",
    driverName: "Mike Chen",
    driverAvatar: AVATARS.driver3,
    rating: 4.6,
    from: "Sports Complex",
    to: "Airport Terminal",
    fromCoords: [37.431, -122.175],
    toCoords: [37.6213, -122.379],
    departureTime: "2:00 PM",
    date: "Tomorrow",
    seatsLeft: 2,
    totalSeats: 4,
    price: 15,
    status: "available",
    verified: false,
  },
  {
    id: "4",
    driverName: "Emma Davis",
    driverAvatar: AVATARS.driver4,
    rating: 5.0,
    from: "Hostel Block A",
    to: "Central Station",
    fromCoords: [37.425, -122.171],
    toCoords: [37.45, -122.14],
    departureTime: "5:30 PM",
    date: "Today",
    seatsLeft: 1,
    totalSeats: 2,
    price: 8,
    status: "filling",
    verified: true,
  },
  {
    id: "5",
    driverName: "Alex Johnson",
    driverAvatar: AVATARS.driver1,
    rating: 4.8,
    from: "Main Gate",
    to: "Tech Park",
    fromCoords: [37.427, -122.165],
    toCoords: [37.402, -122.148],
    departureTime: "7:00 AM",
    date: "Mar 8",
    seatsLeft: 4,
    totalSeats: 4,
    price: 6,
    status: "available",
    verified: true,
  },
];

export const PAST_RIDES: Ride[] = [
  {
    id: "p1",
    driverName: "Sara Williams",
    driverAvatar: AVATARS.driver2,
    rating: 4.9,
    from: "Campus Gate",
    to: "Train Station",
    fromCoords: [37.4268, -122.166],
    toCoords: [37.4435, -122.1645],
    departureTime: "10:00 AM",
    date: "Mar 1",
    seatsLeft: 0,
    totalSeats: 3,
    price: 5,
    status: "available",
    verified: true,
  },
  {
    id: "p2",
    driverName: "Mike Chen",
    driverAvatar: AVATARS.driver3,
    rating: 4.6,
    from: "Library",
    to: "Shopping Center",
    fromCoords: [37.4265, -122.168],
    toCoords: [37.448, -122.156],
    departureTime: "3:00 PM",
    date: "Feb 28",
    seatsLeft: 0,
    totalSeats: 4,
    price: 4,
    status: "available",
    verified: false,
  },
];
