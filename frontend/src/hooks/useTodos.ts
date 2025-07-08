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
        id: crypto.randomUUID(),// ssyntactically valid UUID
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

  const editContent = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error: updateError } = await supabase
        .from('todos')
        .update({ content })
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;
      return data as Todo;
    },

    onMutate: async ({ id, content }) => {
      await queryClient.cancelQueries({ queryKey: ['todos', user?.id] });
      const prev = queryClient.getQueryData<Todo[]>(['todos', user?.id]) ?? [];

      queryClient.setQueryData(
        ['todos', user?.id],
        prev.map((t) => (t.id === id ? { ...t, content } : t)),
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['todos', user?.id], ctx.prev);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', user?.id] });
    },
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
  /* ── Toggle done ───────────────────────────────────────── */
const toggleTodo = useMutation({
  mutationFn: async (todo: Todo) => {
    const { data, error } = await supabase
      .from('todos')
      .update({ done: !todo.done })
      .eq('id', todo.id)
      .select()
      .single();                         // return the updated row
    if (error) throw error;
    return data as Todo;
  },

  /* ① optimistic flip */
  onMutate: async (todo) => {
    await queryClient.cancelQueries({ queryKey: ['todos', user?.id] });
    const prev = queryClient.getQueryData<Todo[]>(['todos', user?.id]) ?? [];

    queryClient.setQueryData(['todos', user?.id], prev.map((t) =>
      t.id === todo.id ? { ...t, done: !t.done } : t,
    ));

    return { prev };
  },

  /* ② rollback on error */
  onError: (_e, _v, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(['todos', user?.id], ctx.prev);
  },

  /* ③ finalise with server copy (keeps created_at etc. accurate) */
  onSuccess: (serverRow) => {
    queryClient.setQueryData<Todo[]>(['todos', user?.id], (old = []) =>
      old.map((t) => (t.id === serverRow.id ? serverRow : t)),
    );
  },
});


  /* ── Delete single ─────────────────────────────────────── */
  const deleteTodo = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) throw error;
  },

  onMutate: async (id: string) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos', user?.id] });

    // Snapshot the previous state
    const previousTodos = queryClient.getQueryData(['todos', user?.id]);

    // Optimistically update the cache by filtering out the deleted todo
    queryClient.setQueryData(['todos', user?.id], (old: any) =>
      old?.filter((todo: any) => todo.id !== id)
    );

    return { previousTodos };
  },

  onError: (err, id, context) => {
    // Revert to previous state if the mutation fails
    if (context?.previousTodos) {
      queryClient.setQueryData(['todos', user?.id], context.previousTodos);
    }
  },

  onSuccess: () => {
    // Optionally revalidate from server
    queryClient.invalidateQueries({ queryKey: ['todos', user?.id] });
  },
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
    editContent,
  };
};
