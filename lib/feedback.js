// lib/feedback.js
// Saves user feedback (likes/dislikes) to Firestore

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Call this when user clicks 👍 or 👎 on any AI message
 */
export async function saveFeedback({ uid, userEmail, messageContent, aiReply, reaction, mode }) {
  try {
    await addDoc(collection(db, 'feedback'), {
      uid:        uid || 'anonymous',
      userEmail:  userEmail || 'unknown',
      userMsg:    messageContent?.replace(/<[^>]+>/g, '').slice(0, 300) || '',
      aiReply:    aiReply?.replace(/<[^>]+>/g, '').slice(0, 500) || '',
      reaction,   // 'like' or 'dislike'
      mode:       mode || 'chat',
      createdAt:  serverTimestamp(),
    });
    console.log('[Feedback] saved:', reaction);
  } catch (err) {
    console.error('[Feedback] save failed:', err);
  }
}
