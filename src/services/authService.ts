// Firebase Auth Service (Dummy implementation for now)
// You can replace this with actual Firebase implementation later

export interface User {
  uid: string;
  email: string;
  displayName: string;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  // Dummy login - replace with Firebase auth
  async login(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dummy validation
    if (email === 'demo@example.com' && password === 'password') {
      const user: User = {
        uid: 'demo-user-123',
        email,
        displayName: 'Demo User'
      };
      this.currentUser = user;
      this.notifyListeners();
      return user;
    }
    
    // For demo purposes, accept any valid email/password combination
    if (email.includes('@') && password.length >= 6) {
      const user: User = {
        uid: `user-${Date.now()}`,
        email,
        displayName: email.split('@')[0]
      };
      this.currentUser = user;
      this.notifyListeners();
      return user;
    }
    
    throw new Error('Invalid email or password');
  }

  // Dummy signup - replace with Firebase auth
  async signup(email: string, password: string, name: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation
    if (!email.includes('@')) {
      throw new Error('Invalid email address');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    const user: User = {
      uid: `user-${Date.now()}`,
      email,
      displayName: name
    };
    
    this.currentUser = user;
    this.notifyListeners();
    return user;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();