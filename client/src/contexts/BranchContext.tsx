import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCurrentBranch, getBranch, Branch } from '../api/branches';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

// Use the API Branch type
export type BranchContextBranch = Branch;

export interface BranchContextType {
  branch: Branch | null;
  isLoading: boolean;
  error: string | null;
  refreshBranch: () => Promise<void>;
}

export const BranchContext = createContext<BranchContextType>({
  branch: null,
  isLoading: false,
  error: null,
  refreshBranch: async () => {},
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branch, setBranch] = useState<BranchContextBranch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const refreshBranch = useCallback(async () => {
    console.log('DEBUG: refreshBranch called', { user, isAuthenticated });
    if (!user) {
      setBranch(null);
      setIsLoading(false);
      return;
    }
    // Eğer user.branch objesi zaten varsa, onu kullan!
    if (user.branch && user.branch.id) {
      // Branch tipine uygun şekilde doldur
      const branchRaw = user.branch as any;
      console.log('BRANCHCONTEXT branchRaw:', branchRaw);
      const branchObj: BranchContextBranch = {
        _id: String(branchRaw.id || branchRaw._id || ''),
        name: branchRaw.name || '',
        code: branchRaw.code,
        address: branchRaw.address && Object.keys(branchRaw.address).length > 0
          ? branchRaw.address
          : (user.branch.address || {}),
        phone: branchRaw.phone || user.branch.phone || '',
        email: branchRaw.email || user.branch.email || '',
        manager: (branchRaw.managerName || branchRaw.manager || (user.branch as any).managerName || (user.branch as any).manager || ''),
        status: branchRaw.status || user.branch.status || 'active',
        createdAt: branchRaw.createdAt ? String(branchRaw.createdAt) : '',
        updatedAt: branchRaw.updatedAt ? String(branchRaw.updatedAt) : ''
      };
      console.log('BRANCHCONTEXT branchObj:', branchObj);
      setBranch(branchObj);
      if (typeof window !== 'undefined') {
        (window as any).__BRANCH_DEBUG__ = branchObj;
      }
      setIsLoading(false);
      return;
    }
    // Yoksa API'den çek
    try {
      setIsLoading(true);
      setError(null);
      console.log('DEBUG: Fetching current branch from API...');
      const response = await getCurrentBranch();
      console.log('🏢 BranchContext: getCurrentBranch API response:', JSON.stringify(response, null, 2));
      if (response.success && response.data) {
        console.log('DEBUG: setBranch with', response.data);
        setBranch(response.data);
        if (typeof window !== 'undefined') {
          (window as any).__BRANCH_DEBUG__ = response.data;
        }
      } else {
        setBranch(null);
      }
    } catch (err) {
      setError('Şube bilgileri alınamadı');
      setBranch(null);
    } finally {
      setIsLoading(false);
      console.log('DEBUG: refreshBranch finished', { branch });
    }
  }, [user]);

  // Initialize branch when user is available
  useEffect(() => {
    console.log('DEBUG: BranchContext useEffect', { user, isAuthenticated, branch });
    console.log('🏢 BranchContext: Effect triggered with:', {
      initialized,
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      userBranchId: user?.branchId,
      hasBranchObject: !!user?.branch
    });

    if (!initialized && user) {
      console.log('🏢 BranchContext: Initializing for user:', {
        id: user.id || user._id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        branch: user.branch
      });
      setInitialized(true);
      refreshBranch();
    } else if (!user) {
      console.log('🏢 BranchContext: User logged out or not available, clearing branch');
      setBranch(null);
      setIsLoading(false);
      setInitialized(false);
    }
  }, [user, refreshBranch, initialized]);

  return (
    <BranchContext.Provider value={{
      branch,
      isLoading,
      error,
      refreshBranch,
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
} 