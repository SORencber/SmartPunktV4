/**
 * Branch interface representing a branch in the system.
 * All fields marked as required must be present in the data.
 * This interface matches the MongoDB document structure.
 */
export interface Branch {
  /** Unique identifier for the branch (required) */
  _id: string | { $oid: string };
  
  /** Name of the branch (required) */
  name: string;
  
  /** Unique code for the branch (required) */
  code: string;
  
  /** Branch address information (required) */
  address: {
    /** Street address (optional) */
    street: string;
    /** City name (required) */
    city: string;
    /** State/province (optional) */
    state: string;
    /** Country name (optional) */
    country: string;
    /** Postal/zip code (optional) */
    postalCode?: string;
  };
  
  /** Contact phone number (required) */
  phone: string;
  
  /** Name of the branch manager (required) */
  managerName: string;
  
  /** Whether this is a central branch (default: false) */
  isCentral: boolean;
  
  /** Current status of the branch (required, default: 'active') */
  status: 'active' | 'inactive';
  
  /** Default language for the branch (optional) */
  defaultLanguage?: string;
  
  /** Creation timestamp (optional) */
  createdAt?: string | { $date: string };
  
  /** Last update timestamp (optional) */
  updatedAt?: string | { $date: string };
  
  /** MongoDB version key (optional) */
  __v?: number;
} 