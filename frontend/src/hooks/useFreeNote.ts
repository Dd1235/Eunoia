// src/hooks/useFreeNote.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';


export const useFreeNote = (tag = 'todos_sidebar') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['free_note', user?.id, tag],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('free_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('tag', tag)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from('free_notes')
          .insert({ user_id: user.id, tag, content: '' })
          .select()
          .single();

        if (insertError) throw insertError;
        return created;
      }

      return data;
    },
  });

  const updateNote = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('free_notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('user_id', user!.id)
        .eq('tag', tag)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['free_note', user?.id, tag], updated);
    },
  });

  return { note, isLoading, isError, updateNote };
};
