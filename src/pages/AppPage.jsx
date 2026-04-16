import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/authStore';
import { useMessageStore } from '../lib/messageStore';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';

export function AppPage() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile, setUser, setLoading } = useAuthStore();
  const { currentConversation, setCurrentConversation, createOrGetConversation, addContact } = useMessageStore();
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, [setUser, fetchProfile, setLoading, navigate]);

  useEffect(() => {
    if (!user) {
      const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
        } else {
          setUser(user);
          fetchProfile(user.id);
        }
      };
      checkAuth();
    }
  }, []);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setCurrentConversation(conversation);
  };

  const handleAddContact = async (contactData) => {
    if (user) {
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone_number', contactData.phone_number)
        .maybeSingle();

      if (otherUser) {
        await addContact(user.id, otherUser.id);
        await createOrGetConversation(user.id, otherUser.id);
      }
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar onAddContact={handleAddContact} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 max-w-md">
          <ChatList onSelectConversation={handleSelectConversation} />
        </div>
        <ChatWindow conversation={selectedConversation} />
      </div>
    </div>
  );
}
