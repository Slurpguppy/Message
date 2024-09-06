const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userDropdown = document.getElementById('user-dropdown');

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const socket = io();

// Emit a joinRoom event when the user joins
socket.emit('joinRoom', { username, room });

// Receive chat history from the server
socket.on('chatHistory', (chatHistory) => {
  chatHistory.forEach((message) => {
    outputMessage({
      username: message.username,
      text: message.message,
      time: new Date(message.timestamp).toLocaleTimeString(),
    });
  });

  // Scroll down after loading history
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Update room and user list
socket.on('roomUsers', ({ room }) => {
  outputRoomName(room);
  // Populate dropdown with users
  populateDropdown();
});

// Form submit event
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const msg = e.target.elements.msg.value;

  socket.emit('chatMessage', msg);

  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to the chat
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
    <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>
  `;
  chatMessages.appendChild(div);
}

// Output room name
function outputRoomName(room) {
  roomName.innerText = room;
}

// Populate the user dropdown
async function populateDropdown() {
  console.log('Populating dropdown...'); // Debug log
  try {
    const response = await fetch('/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    console.log('Fetched users:', users); // Debug log

    userDropdown.innerHTML = '<option value="">Select User</option>'; // Reset dropdown

    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.username;
      option.textContent = user.username;
      userDropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// Populate dropdown on page load
document.addEventListener('DOMContentLoaded', () => {
  populateDropdown();
});


