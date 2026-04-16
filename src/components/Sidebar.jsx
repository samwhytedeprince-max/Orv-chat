import { useState } from 'react';
import { useAuthStore } from '../lib/authStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../lib/supabase';
import { Users, Settings, LogOut, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AddContactModal } from './AddContactModal';

export function Sidebar({ onAddContact }) {
  const { profile, user } = useAuthStore();
  const navigate = useNavigate();
  const [showAddContact, setShowAddContact] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleAddContact = async (contactData) => {
    await onAddContact(contactData);
    setShowAddContact(false);
  };

  return (
    <>
      <div className="w-20 bg-gradient-to-b from-blue-600 to-cyan-600 flex flex-col items-center py-6 space-y-8">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 cursor-pointer"
        >
          {profile?.display_name?.[0]?.toUpperCase() || 'U'}
        </motion.div>

        <div className="flex-1 flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddContact(true)}
            className="p-3 hover:bg-blue-500 rounded-full transition text-white"
            title="Add contact"
          >
            <Plus size={24} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 hover:bg-blue-500 rounded-full transition text-white"
            title="Contacts"
          >
            <Users size={24} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 hover:bg-blue-500 rounded-full transition text-white"
            title="Settings"
          >
            <Settings size={24} />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSignOut}
          className="p-3 hover:bg-red-500 rounded-full transition text-white"
          title="Sign out"
        >
          <LogOut size={24} />
        </motion.button>
      </div>

      {showAddContact && (
        <AddContactModal
          onClose={() => setShowAddContact(false)}
          onAdd={handleAddContact}
        />
      )}
    </>
  );
}
