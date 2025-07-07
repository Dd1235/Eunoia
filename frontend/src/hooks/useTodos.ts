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
  priority: number;
};

/* ─── helpers ─── */
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

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
    queryKey: ['todos', user?.id],     // 👈 user-scoped cache key
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
      await supabase.rpc('increment_priorities_for_user', { uid: user!.id });

      const { data, error } = await supabase
        .from('todos')
        .insert({ content, user_id: user!.id, priority: 1 })
        .select()
        .single();
      if (error) throw error;
      return data as Todo;
    },

    /* optimistic UI */
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['todos', user?.id] });
      const prev = queryClient.getQueryData<Todo[]>(['todos', user?.id]) ?? [];

      const optimistic: Todo = {
        id: crypto.randomUUID(),             // ✅ syntactically valid UUID
        user_id: user!.id,
        content,
        done: false,
        created_at: new Date().toISOString(),
        priority: 1,
      };
      queryClient.setQueryData(['todos', user?.id], [optimistic, ...prev]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos', user?.id], ctx.prev);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', user?.id] }),
  });

  /* ── Re-order (drag-drop) ──────────────────────────────── */
  const reorderTodos = useMutation({
    mutationFn: async (ordered: Todo[]) => {
      const ids = ordered.map((t) => t.id).filter(isUuid); // strip optimistic ids
      return supabase.rpc('reorder_user_todos', {
        uid: user!.id,
        ordered_ids: ids,                  // pg expects jsonb
      });
    },

    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: ['todos', user?.id] });
      const prev = queryClient.getQueryData<Todo[]>(['todos', user?.id]);
      queryClient.setQueryData(['todos', user?.id], ordered);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos', user?.id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos', user?.id] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', user?.id] }),
  });

  /* ── Delete single ─────────────────────────────────────── */
  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', user?.id] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos', user?.id] }),
  });

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
