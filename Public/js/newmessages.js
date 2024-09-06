// messages.js

// Fetch messages from the server
fetch('/messages')
  .then(response => response.json())
  .then(messages => {
    const messagesList = document.getElementById('messages-list');
    messages.forEach(message => {
      const div = document.createElement('div');
      div.classList.add('message');
      div.innerHTML = `
        <p class="meta">${message.username} <span>${new Date(message.timestamp).toLocaleTimeString()}</span></p>
        <p class="text">${message.text}</p>
      `;
      messagesList.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Error fetching messages:', error);
  });

// Back to chat button
document.getElementById('back-to-chat').addEventListener('click', () => {
  window.location.href = '/chat.html'; // Change to your chat page URL
});
