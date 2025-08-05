// public/firebase-messaging-sw.js
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
});
