// Global shims for third-party libraries without @types
// These prevent TypeScript compiler errors. Replace with real typings if needed.

declare module 'react-day-picker';
declare module 'embla-carousel-react';
declare module 'cmdk';
declare module 'vaul';
declare module 'input-otp';
declare module 'react-resizable-panels';

// Global placeholder types for missing request interfaces

declare type CreateBrandRequest = any;
declare type UpdateBrandRequest = any;
declare type CreateDeviceTypeRequest = any;
declare type UpdateDeviceTypeRequest = any;
declare type CreateModelRequest = any;
declare type UpdateModelRequest = any;
declare type CreatePartRequest = any;
declare type UpdatePartRequest = any;
declare type UpdateRepairRequest = any;
declare type AddPartRequest = any;
declare type RepairStatus = any;
declare type ReassignRepairRequest = any;
declare type TransferRepairRequest = any; 