export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

// ... rest of the types ... 