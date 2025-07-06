import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export type Todo = {
  id: string;
  user_id: string;
  content: string;
  done: boolean;
  created_at: string;
};

export const useTodos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch Todos ───────────────────────────────────────────
  const { data: todos, isLoading, error } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user, // return only if the user is truthy
  });

  // ── Add Todo ──────────────────────────────────────────────
  const addTodo = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('todos').insert([
        { content, user_id: user?.id },
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  // ── Toggle Todo ───────────────────────────────────────────
  const toggleTodo = useMutation({
    mutationFn: async (todo: Todo) => {
      const { error } = await supabase
        .from('todos')
        .update({ done: !todo.done })
        .eq('id', todo.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  // ── Delete Todo ───────────────────────────────────────────
  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  // ── Clear Completed ───────────────────────────────────────
  const deleteDoneTodos = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', user?.id)
        .eq('done', true);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  return {
    todos,
    isLoading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    deleteDoneTodos,
  };
};
