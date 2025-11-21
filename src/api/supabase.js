// Supabase client initialization
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Initialize Supabase client
export const supabase = createClient(
    config.supabase.url,
    config.supabase.anon_key
);

// Database service for all Supabase operations
class DatabaseService {
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all pools
     */
    async getPools() {
        try {
            const { data, error } = await supabase
                .from('pools')
                .select(`
          *,
          created_by_user:users!pools_created_by_fkey(display_name),
          pool_members(count)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching pools:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user's pools
     */
    async getUserPools(userId) {
        try {
            const { data, error } = await supabase
                .from('pool_members')
                .select(`
          *,
          pool:pools(*)
        `)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true, data: data.map(pm => pm.pool) };
        } catch (error) {
            console.error('Error fetching user pools:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a new pool
     */
    async createPool(poolData) {
        try {
            const { data, error } = await supabase
                .from('pools')
                .insert([poolData])
                .select()
                .single();

            if (error) throw error;

            // Auto-join creator to pool
            await this.joinPool(data.id, poolData.created_by);

            return { success: true, data };
        } catch (error) {
            console.error('Error creating pool:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Join a pool
     */
    async joinPool(poolId, userId) {
        try {
            const { data, error } = await supabase
                .from('pool_members')
                .insert([{
                    pool_id: poolId,
                    user_id: userId,
                    paid: false,
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error joining pool:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave a pool
     */
    async leavePool(poolId, userId) {
        try {
            const { error } = await supabase
                .from('pool_members')
                .delete()
                .eq('pool_id', poolId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error leaving pool:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get pool members
     */
    async getPoolMembers(poolId) {
        try {
            const { data, error } = await supabase
                .from('pool_members')
                .select(`
          *,
          user:users(id, display_name, avatar_url)
        `)
                .eq('pool_id', poolId);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching pool members:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Submit picks for a week
     */
    async submitPicks(picks) {
        try {
            // Delete existing picks for this user/pool/week
            const { error: deleteError } = await supabase
                .from('picks')
                .delete()
                .eq('user_id', picks[0].user_id)
                .eq('pool_id', picks[0].pool_id)
                .eq('week', picks[0].week)
                .eq('season', picks[0].season);

            if (deleteError) throw deleteError;

            // Insert new picks
            const { data, error } = await supabase
                .from('picks')
                .insert(picks)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error submitting picks:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user's picks for a week
     */
    async getUserPicks(userId, poolId, week, season) {
        try {
            const { data, error } = await supabase
                .from('picks')
                .select('*')
                .eq('user_id', userId)
                .eq('pool_id', poolId)
                .eq('week', week)
                .eq('season', season);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user picks:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all picks for a pool/week
     */
    async getPoolPicks(poolId, week, season) {
        try {
            const { data, error } = await supabase
                .from('picks')
                .select(`
          *,
          user:users(display_name, avatar_url)
        `)
                .eq('pool_id', poolId)
                .eq('week', week)
                .eq('season', season);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching pool picks:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update pick result
     */
    async updatePickResult(pickId, isCorrect) {
        try {
            const { data, error } = await supabase
                .from('picks')
                .update({ is_correct: isCorrect })
                .eq('id', pickId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating pick result:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get leaderboard for a pool
     */
    async getLeaderboard(poolId, season) {
        try {
            const { data, error } = await supabase
                .from('picks')
                .select(`
          user_id,
          is_correct,
          user:users(display_name, avatar_url)
        `)
                .eq('pool_id', poolId)
                .eq('season', season)
                .not('is_correct', 'is', null);

            if (error) throw error;

            // Calculate standings
            const standings = {};
            data.forEach(pick => {
                if (!standings[pick.user_id]) {
                    standings[pick.user_id] = {
                        userId: pick.user_id,
                        displayName: pick.user.display_name,
                        avatarUrl: pick.user.avatar_url,
                        wins: 0,
                        losses: 0,
                        total: 0,
                    };
                }

                if (pick.is_correct) {
                    standings[pick.user_id].wins++;
                } else {
                    standings[pick.user_id].losses++;
                }
                standings[pick.user_id].total++;
            });

            // Convert to array and sort
            const leaderboard = Object.values(standings)
                .sort((a, b) => b.wins - a.wins);

            return { success: true, data: leaderboard };
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cache game data
     */
    async cacheGame(gameData) {
        try {
            const { data, error } = await supabase
                .from('games_cache')
                .upsert([gameData], {
                    onConflict: 'espn_event_id',
                    ignoreDuplicates: false
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error caching game:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get cached games for a week
     */
    async getCachedGames(week, season) {
        try {
            const { data, error } = await supabase
                .from('games_cache')
                .select('*')
                .eq('week', week)
                .eq('season', season);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching cached games:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Subscribe to real-time updates
     */
    subscribeToGames(callback) {
        return supabase
            .channel('games_cache_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'games_cache' },
                callback
            )
            .subscribe();
    }

    /**
     * Subscribe to picks updates
     */
    subscribeToPicks(poolId, callback) {
        return supabase
            .channel(`picks_${poolId}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'picks',
                    filter: `pool_id=eq.${poolId}`
                },
                callback
            )
            .subscribe();
    }

    /**
     * Unsubscribe from channel
     */
    unsubscribe(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    }
}

// Export singleton instance
export const db = new DatabaseService();
