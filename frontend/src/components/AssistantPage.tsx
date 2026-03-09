import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { SettingsDialog } from './SettingsDialog';
import { ChatMessage } from './ChatMessage';
import { LoadingIndicator } from './LoadingIndicator';
import { ChatInput } from './ChatInput';
import { Sidebar } from './Sidebar';
import { WelcomeScreen } from './WelcomeScreen';
import { TopBanner } from './TopBanner';
import { useConversations, useAppState, store, actions } from '../store';
import { genAIResponse, ChatApiError, type Message } from '../utils';
import { useAuth } from '../contexts/AuthContext';

export function AssistantPage() {
  const { token } = useAuth();
  const {
    conversations,
    currentConversationId,
    currentConversation,
    setCurrentConversationId,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage,
  } = useConversations();

  const { isLoading, setLoading, getActivePrompt, setBannerVisible } = useAppState();

  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation]);

  const [input, setInput] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = useCallback((smooth: boolean = false) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (pendingMessage && isLoading) {
      scrollToBottom(true);
    }
  }, [pendingMessage, isLoading, scrollToBottom]);

  const createTitleFromInput = useCallback((text: string) => {
    const words = text.trim().split(/\s+/);
    const firstThreeWords = words.slice(0, 3).join(' ');
    return firstThreeWords + (words.length > 3 ? '...' : '');
  }, []);

  const processAIResponse = useCallback(
    async (conversationId: string, userMessage: Message) => {
      try {
        const activePrompt = getActivePrompt(store.state);
        let systemPrompt;
        if (activePrompt) {
          systemPrompt = { value: activePrompt.content, enabled: true };
        }
        const response = await genAIResponse({
          data: { messages: [...messages, userMessage], systemPrompt },
          authToken: token ?? undefined,
        });
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader found in response');
        const decoder = new TextDecoder();
        let done = false;
        let newMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: '',
        };
        let buffer = '';
        let pendingTextQueue: string[] = [];
        let isRendering = false;
        const renderTextSmoothly = async () => {
          if (isRendering) return;
          isRendering = true;
          while (pendingTextQueue.length > 0) {
            const chunk = pendingTextQueue.shift()!;
            const isCodeBlock =
              newMessage.content.includes('```') &&
              newMessage.content.split('```').length % 2 === 0;
            const charsPerFrame = isCodeBlock ? 5 : 2;
            const delay = isCodeBlock ? 2 : 5;
            for (let i = 0; i < chunk.length; i += charsPerFrame) {
              const slice = chunk.slice(i, i + charsPerFrame);
              newMessage = { ...newMessage, content: newMessage.content + slice };
              setPendingMessage({ ...newMessage });
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
          isRendering = false;
        };
        const scheduleUIUpdate = (text: string) => {
          pendingTextQueue.push(text);
          renderTextSmoothly();
        };
        while (!done) {
          const out = await reader.read();
          done = out.done;
          if (!done && out.value) {
            buffer += decoder.decode(out.value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const json = JSON.parse(line);
                  if (json.type === 'content_block_delta' && json.delta?.text) {
                    scheduleUIUpdate(json.delta.text);
                  }
                } catch (e) {
                  console.error('Error parsing streaming response:', e, 'Line:', line);
                }
              }
            }
          }
        }
        while (pendingTextQueue.length > 0 || isRendering) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        setPendingMessage(null);
        if (newMessage.content.trim()) {
          await addMessage(conversationId, newMessage);
        }
      } catch (err) {
        console.error('Error in AI response:', err);
        if (err instanceof ChatApiError) {
          setBannerVisible(true);
        }
        const displayMessage = err instanceof ChatApiError ? err.message : 'Sorry, I encountered an error generating a response. Please set the required API keys in your environment variables.';
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: displayMessage,
        };
        await addMessage(conversationId, errorMessage);
      }
    },
    [messages, getActivePrompt, addMessage, token, setBannerVisible]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const currentInput = input;
      setInput('');
      setLoading(true);
      setError(null);
      const conversationTitle = createTitleFromInput(currentInput);
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: currentInput.trim(),
      };
      let conversationId = currentConversationId;
      if (!conversationId) {
        try {
          const convexId = await createNewConversation(conversationTitle);
          if (convexId) {
            conversationId = convexId;
            await addMessage(conversationId, userMessage);
          } else {
            const tempId = Date.now().toString();
            actions.addConversation({
              id: tempId,
              title: conversationTitle,
              messages: [],
            });
            conversationId = tempId;
            actions.addMessage(conversationId, userMessage);
          }
        } catch (err) {
          console.error('Error creating conversation:', err);
          throw new Error('Failed to create conversation');
        }
      } else {
        await addMessage(conversationId, userMessage);
      }
      try {
        await processAIResponse(conversationId, userMessage);
      } catch (err) {
        console.error('Error:', err);
        if (err instanceof ChatApiError) {
          setBannerVisible(true);
        }
        const displayMessage = err instanceof ChatApiError ? err.message : 'Sorry, I encountered an error processing your request.';
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: displayMessage,
        };
        if (currentConversationId) {
          await addMessage(currentConversationId, errorMessage);
        } else {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    },
    [
      input,
      isLoading,
      createTitleFromInput,
      currentConversationId,
      createNewConversation,
      addMessage,
      processAIResponse,
      setLoading,
      setBannerVisible,
    ]
  );

  const handleNewChat = useCallback(() => createNewConversation(), [createNewConversation]);
  const handleDeleteChat = useCallback(async (id: string) => await deleteConversation(id), [deleteConversation]);
  const handleUpdateChatTitle = useCallback(
    async (id: string, title: string) => {
      await updateConversationTitle(id, title);
      setEditingChatId(null);
      setEditingTitle('');
    },
    [updateConversationTitle]
  );

  return (
    <div className="relative flex h-screen bg-gray-900">
      <div className="absolute right-5 top-5 z-50">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        handleNewChat={handleNewChat}
        setCurrentConversationId={setCurrentConversationId}
        handleDeleteChat={handleDeleteChat}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        handleUpdateChatTitle={handleUpdateChatTitle}
      />
      <div className="flex flex-1 flex-col">
        <TopBanner />
        {error && (
          <p className="mx-auto w-full max-w-3xl p-4 font-bold text-orange-500">{error}</p>
        )}
        {currentConversationId ? (
          <>
            <div
              ref={messagesContainerRef}
              className="messages-container flex-1 overflow-y-auto pb-24"
            >
              <div className="mx-auto w-full max-w-3xl px-4">
                {[...messages, pendingMessage]
                  .filter((message): message is Message => message !== null)
                  .map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isStreaming={message === pendingMessage && isLoading}
                    />
                  ))}
                {isLoading && <LoadingIndicator />}
              </div>
            </div>
            <ChatInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </>
        ) : (
          <WelcomeScreen
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
