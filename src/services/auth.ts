import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, Role } from '@/types/user';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      const token = await firebaseUser.getIdToken();
      
      const user: User = {
        id: firebaseUser.uid,
        role : (userData.role as Role) || 'user',
        name: userData.name || firebaseUser.displayName || '',
        phone: userData.phone || '',
        isVerified: firebaseUser.emailVerified,
      };
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Sign up with email and password
  async signUp(email: string, password: string, name: string, phone: string): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile
      await updateProfile(firebaseUser, { displayName: name });
      
      // Create user document in Firestore
      const userData = {
        role: 'user' as Role,
        name,
        phone,
        isVerified: firebaseUser.emailVerified,
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      const token = await firebaseUser.getIdToken();
      
      const user: User = {
        id: firebaseUser.uid,
        role: (userData.role as Role) || 'user',
        name,
        phone,
        isVerified: firebaseUser.emailVerified,
      };
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  },

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  // Get ID token
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
};