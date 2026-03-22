'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, SendHorizonal, Store } from 'lucide-react';
import apiClient from '@/lib/api-client';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RoomItem {
  id: string;
  title: string;
  subtitle: string;
  lastMessageAt: string | null;
}

interface MessageItem {
  id: string;
  senderName: string;
  message: string;
  createdAt: string;
}

const normalizeRoom = (room: any): RoomItem => ({
  id: String(room.id),
  title:
    room.shop?.name ||
    room.participant2Name ||
    room.participant1Name ||
    'Cuộc trò chuyện',
  subtitle: room.lastMessage || 'Chưa có tin nhắn',
  lastMessageAt: room.lastMessageAt || null,
});

const normalizeMessage = (message: any): MessageItem => ({
  id: String(message.id),
  senderName: message.senderName || message.sender?.fullName || message.sender?.email || 'Người dùng',
  message: message.content || message.message || '',
  createdAt: message.createdAt || new Date().toISOString(),
});

function ChatPageContent() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shop');

  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const fetchRooms = async (preferredShopId?: string | null) => {
    try {
      setIsLoadingRooms(true);
      if (preferredShopId) {
        try {
          await apiClient.post(`/chat/rooms?shopId=${preferredShopId}`);
        } catch (error) {
          console.error('Failed to create room for shop:', error);
        }
      }

      const response = await apiClient.get('/chat/rooms');
      const items = (response.data?.data || []).map(normalizeRoom);
      setRooms(items);
      if (items.length > 0) {
        setSelectedRoomId((current) => current || items[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
      toast.error('Không thể tải danh sách chat');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await apiClient.get(`/chat/rooms/${roomId}/messages`, {
        params: { page: 0, size: 50 },
      });
      const items = response.data?.data?.content || [];
      setMessages(items.map(normalizeMessage).reverse());
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      toast.error('Không thể tải tin nhắn');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchRooms(shopId);
  }, [shopId]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
    }
  }, [selectedRoomId]);

  const handleSend = async () => {
    if (!selectedRoomId || !draft.trim()) return;
    try {
      setIsSending(true);
      await apiClient.post(`/chat/rooms/${selectedRoomId}/messages?content=${encodeURIComponent(draft.trim())}`);
      setDraft('');
      fetchMessages(selectedRoomId);
      fetchRooms(shopId);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      toast.error('Không thể gửi tin nhắn');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container-custom py-8 h-[calc(100vh-100px)]">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full">
        <section className="bg-card border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Tin nhắn</h1>
            <p className="text-sm text-muted-foreground mt-1">Kết nối trực tiếp với shop qua API backend thật.</p>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto h-[calc(100%-80px)]">
            {isLoadingRooms ? (
              [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-xl" />)
            ) : rooms.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <MessageCircle className="w-10 h-10 mx-auto mb-3" />
                Chưa có cuộc trò chuyện nào.
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedRoomId === room.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-4 h-4 text-primary" />
                    <span className="font-medium truncate">{room.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{room.subtitle}</p>
                  {room.lastMessageAt && (
                    <p className="text-xs text-muted-foreground mt-2">{formatDateTime(room.lastMessageAt)}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </section>

        <section className="bg-card border rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold">{selectedRoom?.title || 'Chọn một cuộc trò chuyện'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{selectedRoom?.subtitle || 'Bạn có thể bắt đầu bằng cách chọn shop từ trang shop.'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedRoomId ? (
              isLoadingMessages ? (
                [1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-xl" />)
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">Chưa có tin nhắn nào trong cuộc trò chuyện này.</div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border rounded-xl p-4 bg-background">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="font-medium">{message.senderName}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.message}</p>
                  </div>
                ))
              )
            ) : (
              <div className="text-center text-muted-foreground py-16">Chọn một cuộc trò chuyện từ danh sách bên trái.</div>
            )}
          </div>

          <div className="border-t p-4 flex gap-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedRoomId ? 'Nhập tin nhắn...' : 'Chọn cuộc trò chuyện để nhắn tin'}
              disabled={!selectedRoomId || isSending}
              className="input-field min-h-12 max-h-32 resize-y"
            />
            <Button onClick={handleSend} isLoading={isSending} disabled={!selectedRoomId || !draft.trim()}>
              Gửi
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container-custom py-8"><Skeleton className="h-[70vh] rounded-2xl" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
}