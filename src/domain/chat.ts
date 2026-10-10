import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ConversationMessage, type ChatResponse } from "@/lib/api";
import { queryKeys } from "@/domain/queryKeys";

const buildSessionStorageKey = (projectId?: string | null) => `arffy_chat_session:${projectId || "global"}`;

function generateSessionId(projectId?: string | null) {
  return `${projectId || "project"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createOptimisticAssistantMessage(response: ChatResponse): ConversationMessage {
  return {
    role: "assistant",
    content: response.bot_response,
    timestamp: new Date().toISOString(),
    node_executed: response.node_executed,
    node_result: response.node_result,
    execution_metadata: response.execution_metadata || undefined,
  };
}

export function useChatSession(projectId?: string, initialConversationId?: string | null) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") {
      return generateSessionId(projectId);
    }

    const key = buildSessionStorageKey(projectId);
    const existing = window.sessionStorage.getItem(key);
    if (existing) {
      return existing;
    }
    const created = generateSessionId(projectId);
    window.sessionStorage.setItem(key, created);
    return created;
  });
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    const key = buildSessionStorageKey(projectId);
    const existing = window.sessionStorage.getItem(key);
    if (existing) {
      setSessionId(existing);
      setConversationId(null);
      return;
    }
    const created = generateSessionId(projectId);
    window.sessionStorage.setItem(key, created);
    setSessionId(created);
    setConversationId(null);
  }, [projectId]);

  const conversationQuery = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => api.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return api.chat({
        project_api_id: projectId!,
        user_message: message,
        conversation_id: conversationId || undefined,
        session_id: sessionId,
      });
    },
    onMutate: async (message) => {
      if (!conversationId) return undefined;
      await queryClient.cancelQueries({ queryKey: queryKeys.conversation(conversationId) });
      const previousConversation = queryClient.getQueryData<any>(queryKeys.conversation(conversationId));
      if (previousConversation) {
        queryClient.setQueryData(queryKeys.conversation(conversationId), {
          ...previousConversation,
          messages: [
            ...previousConversation.messages,
            {
              role: "user",
              content: message,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
      return { previousConversation };
    },
    onError: (_error, _message, context) => {
      if (conversationId && context?.previousConversation) {
        queryClient.setQueryData(queryKeys.conversation(conversationId), context.previousConversation);
      }
    },
    onSuccess: (response, message) => {
      setConversationId(response.conversation_id);
      if (response.node_executed && projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.executionHistoryRoot(projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      }
      queryClient.setQueryData(queryKeys.conversation(response.conversation_id), (current: any) => {
        if (!current) {
          return {
            id: response.conversation_id,
            conversation_id: response.conversation_id,
            project_api_id: projectId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_test: false,
            messages: [
              { role: "user", content: message, timestamp: new Date().toISOString() },
              createOptimisticAssistantMessage(response),
            ],
          };
        }

        const messages = current.messages || [];
        const lastMessage = messages[messages.length - 1];
        const needsUserMessage = !lastMessage || lastMessage.content !== message || lastMessage.role !== "user";

        return {
          ...current,
          conversation_id: response.conversation_id,
          updated_at: new Date().toISOString(),
          messages: [
            ...messages,
            ...(needsUserMessage ? [{ role: "user", content: message, timestamp: new Date().toISOString() }] : []),
            createOptimisticAssistantMessage(response),
          ],
        };
      });
    },
  });

  const messages = useMemo(() => conversationQuery.data?.messages || [], [conversationQuery.data?.messages]);

  const resetSession = () => {
    const newSessionId = generateSessionId(projectId);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(buildSessionStorageKey(projectId), newSessionId);
    }
    setSessionId(newSessionId);
    setConversationId(null);
  };

  return {
    sessionId,
    conversationId,
    setConversationId,
    conversation: conversationQuery.data,
    messages,
    isConversationLoading: conversationQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
    resetSession,
    error: conversationQuery.error || sendMessageMutation.error,
  };
}
