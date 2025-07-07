import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

/* ─── types ─── */
export type Todo = {
  id: string;
  user_id: string;
  content: string;
  done: boolean;
  created_at: string;
  priority: number;   // ←  add this so TS knows we sort by it
};

/* ─── hook ─── */
export const useTodos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ── Fetch ─────────────────────────────────────────────── */
  const {
    data: todos = [],
    isLoading,
    error,
  } = useQuery<Todo[]>({
    queryKey: ['todos'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  /* ── Add ───────────────────────────────────────────────── */
  const addTodo = useMutation({
    mutationFn: async (content: string) => {
      // 1️ shift existing priorities so slot #1 is free
      await supabase.rpc('increment_priorities_for_user', { uid: user!.id });

      // 2️ insert new todo at priority 1
      const { data, error } = await supabase
        .from('todos')
        .insert({
          content,
          user_id: user!.id,
          priority: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Todo;
    },

    /* optimistic: prepend immediately */
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const prev = queryClient.getQueryData<Todo[]>(['todos']) ?? [];
      const optimistic: Todo = {
        id: `optimistic-${Date.now()}`,
        user_id: user!.id,
        content,
        done: false,
        created_at: new Date().toISOString(),
        priority: 1,
      };
      queryClient.setQueryData(['todos'], [optimistic, ...prev]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos'], ctx.prev);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  /* ── Re-order (drag-drop) ──────────────────────────────── */
  const reorderTodos = useMutation({
    mutationFn: async (ordered: Todo[]) =>
      supabase.rpc('reorder_user_todos', {
        uid: user!.id,
        ordered_ids: ordered.map((t) => t.id), // param name must be ordered_ids
      }),

    /* optimistic: show new order instantly */
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const prev = queryClient.getQueryData<Todo[]>(['todos']);
      queryClient.setQueryData(['todos'], ordered);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  /* ── Toggle done ───────────────────────────────────────── */
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

  /* ── Delete single ─────────────────────────────────────── */
  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  /* ── Clear completed ───────────────────────────────────── */
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

  /* ── Expose API ────────────────────────────────────────── */
  return {
    todos,
    isLoading,
    error,
    addTodo,
    reorderTodos,
    toggleTodo,
    deleteTodo,
    deleteDoneTodos,
  };
};
