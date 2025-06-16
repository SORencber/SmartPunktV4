// Stubs for repair-related API functions to satisfy TypeScript during compile.
// TODO: Replace with real implementations.

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Generic success response
const ok = <T = any>(data: T = {} as T): ApiResponse<T> => ({ success: true, data });

export const loadRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const updateRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const updateRepairStatus = async (..._args: any[]): Promise<ApiResponse> => ok();
export const addPart = async (..._args: any[]): Promise<ApiResponse> => ok();
export const removePart = async (..._args: any[]): Promise<ApiResponse> => ok();
export const addEvent = async (..._args: any[]): Promise<ApiResponse> => ok();
export const deleteEvent = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uploadPhoto = async (..._args: any[]): Promise<ApiResponse> => ok();
export const deletePhoto = async (..._args: any[]): Promise<ApiResponse> => ok();
export const addNote = async (..._args: any[]): Promise<ApiResponse> => ok();
export const deleteNote = async (..._args: any[]): Promise<ApiResponse> => ok();
export const sendInvoice = async (..._args: any[]): Promise<ApiResponse> => ok();
export const restoreRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const reopenRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const reassignRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const transferRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const unassignRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uncancelRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uncloseRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uncompleteRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const printRepair = async (..._args: any[]): Promise<ApiResponse> => ok(); 