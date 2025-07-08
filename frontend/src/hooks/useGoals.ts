// src/hooks/useGoals
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';


export type Goal = {
  id: string;
  user_id: string;
  goal: string;
  created_at: string;
};

type GoalType = 'long_term_goals' | 'short_term_goals';

const fetchGoals = async (table: GoalType, userId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

const addGoal = async (table: GoalType, userId: string, goal: string) => {
  const { error } = await supabase
    .from(table)
    .insert([{ user_id: userId, goal }]);
  if (error) throw error;
};

const deleteGoal = async (table: GoalType, goalId: string) => {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', goalId);
  if (error) throw error;
};

export function useGoals(userId: string, type: GoalType) {
  const queryClient = useQueryClient();
  const queryKey = [type, userId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGoals(type, userId),
    enabled: !!userId,
  });

  const add = useMutation({
    mutationFn: (goal: string) => addGoal(type, userId, goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: (goalId: string) => deleteGoal(type, goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    goals: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    addGoal: add.mutateAsync,
    deleteGoal: remove.mutateAsync,
  };
} 