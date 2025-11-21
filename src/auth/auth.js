// Authentication service
import { supabase } from '../api/supabase.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.listeners = [];
    }

    /**
     * Sign up new user
     */
    async signUp(email, password, displayName) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    }
                }
            });

            if (error) throw error;

            // Create user profile
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        id: data.user.id,
                        email: data.user.email,
                        display_name: displayName,
                        is_admin: false,
                        total_points: 0,
                    }]);

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in existing user
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.notifyListeners(data.user);

            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            this.currentUser = null;
            this.notifyListeners(null);

            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) throw error;

            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    /**
     * Get current session
     */
    async getSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            return session;
        } catch (error) {
            console.error('Get session error:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const session = await this.getSession();
        return !!session;
    }

    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback) {
        this.listeners.push(callback);

        // Set up Supabase auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                this.currentUser = session?.user || null;
                this.notifyListeners(this.currentUser);
            }
        );

        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
            subscription.unsubscribe();
        };
    }

    /**
     * Notify all listeners of auth state change
     */
    notifyListeners(user) {
        this.listeners.forEach(listener => listener(user));
    }

    /**
     * Update user profile
     */
    async updateProfile(displayName, avatarUrl) {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            const updates = {};
            if (displayName) updates.display_name = displayName;
            if (avatarUrl) updates.avatar_url = avatarUrl;

            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const auth = new AuthService();
