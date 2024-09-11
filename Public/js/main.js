const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userDropdown = document.getElementById('user-dropdown');
const createRoomForm = document.getElementById('create-room-form');
const usernameInput = document.getElementById('username');
const addRoomButton = document.getElementById('add-room-button');
const roomNameInput = document.getElementById('room-name-input');

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
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  populateDropdown();
  populateCurrentRooms(users);
});

// Populate the current rooms list
function populateCurrentRooms(users) {
  const currentRoomsList = document.getElementById('current-rooms-list');

  // Clear the list
  currentRoomsList.innerHTML = '';

  // Add each room to the list
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user.room;
    currentRoomsList.appendChild(li);
  });
}

// Create room
async function createRoom(roomName) {
  try {
    const response = await fetch('/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, username }),
    });

    if (response.ok) {
      window.location.href = `/chat.html?room=${roomName}`;
    } else {
      console.error('Error creating room:', await response.text());
    }
  } catch (error) {
    console.error('Error creating room:', error);
  }
}

// Form submit event
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = e.target.elements.msg.value;
  socket.emit('chatMessage', msg);
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to the chat
// Output message to the chat
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

  // Check if the message's username matches the current user's username
  if (message.username === username) {
    div.style.backgroundColor = 'rgb(66, 66, 66)'; // Replace with your desired color for the current user
  } else {
    div.style.backgroundColor = '#1b1b1b';
    div.style.right = '10px';
    div.style.marginLeft = '10px';
  }

  div.innerHTML = `
    <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>
  `;
  chatMessages.appendChild(div);
}

// Output room name
function outputRoomName(room) {
  const roomNameElement = document.getElementById('room-name');
  const currentUsername = username;

  // Remove the currentUsername and hyphens from the room name
  const displayedRoomName = room
    .replace(currentUsername, '')
    .replace(/-/, '') // Remove the first hyphen
    .replace(/\d+/g, '') // Remove all numbers
    .trim();

  roomNameElement.innerText = displayedRoomName;
}

// Populate the user dropdown
async function populateDropdown() {
  console.log('Populating dropdown...');
  try {
    const response = await fetch('/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    console.log('Fetched users:', users);

    userDropdown.innerHTML = '<option value="">Add user</option>'; // Reset dropdown

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

// Assuming you have the username after the form is submitted
document.getElementById('create-room-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const userInfoBtn = document.getElementById('user-info');
  userInfoBtn.innerText = `${username}`;
});

// Set the username in the 'user-info' button
if (username) {
  const userInfoBtn = document.getElementById('user-info');
  userInfoBtn.innerText = `${username}`;
}

// Function to add a room to the list
function addRoomToList(room) {
  const roomList = document.getElementById('room-list');
  const currentUsername = username;

  // Check if the room already exists in the list
  const existingRoom = Array.from(roomList.children).find(
    (li) => li.textContent.trim() === room.replace(currentUsername, '').replace(/-/, '').replace(/\d+/g, '').trim()
  );

  if (existingRoom) {
    // Room already exists, do not add it again
    return;
  }

  const li = document.createElement('li');
  const displayedRoomName = room
    .replace(currentUsername, '')
    .replace(/-/, '') // Remove the first hyphen
    .replace(/\d+/g, '') // Remove all numbers
    .trim();
  li.textContent = displayedRoomName;
  li.classList.add('room-item');

  const arrowIcon = document.createElement('i');
  arrowIcon.classList.add('fa', 'fa-arrow-right');
  arrowIcon.setAttribute('aria-hidden', 'true');
  li.appendChild(arrowIcon);

  const userIcon = document.createElement('i');
  userIcon.classList.add('fa', 'fa-user-circle-o'); // Font Awesome user icon
  userIcon.setAttribute('aria-hidden', 'true');
  li.appendChild(userIcon); // Append the user icon to the 'li'

  roomList.appendChild(li);

  li.addEventListener('click', () => {
    window.location.href = `/chat.html?room=${encodeURIComponent(room)}`;
  });
}

// Listen for the 'roomAdded' event from the server
socket.on('roomAdded', (room) => {
  addRoomToList(room);
});

// Listen for the 'roomRemoved' event from the server
socket.on('roomRemoved', (room) => {
  const roomList = document.getElementById('room-list');
  const rooms = Array.from(roomList.children);

  rooms.forEach(item => {
    if (item.textContent.trim() === room) {
      roomList.removeChild(item);
    }
  });
});

// Fetch user-specific rooms when joining a room
socket.emit('getUserRooms', username);

// Listen for the userRooms event to update the room list
socket.on('userRooms', (rooms) => {
  const roomListElement = document.getElementById('room-list');
  
  rooms.forEach((room) => {
    addRoomToList(room.roomName);
    // Find the existing <li> element with the correct data-room attribute
    const roomElement = document.querySelector(`li[data-room="${room.roomName}"]`);
    
    if (roomElement) {
      // Find the existing <p> element within this <li> or create it if it doesn't exist
      let lastMessageElement = roomElement.querySelector('p.last-message');
      
      if (!lastMessageElement) {
        // Create a new <p> element if it doesn't exist
        lastMessageElement = document.createElement('p');
        lastMessageElement.className = 'last-message';
        roomElement.appendChild(lastMessageElement);
      }
      
      // Update the text content of the <p> element
      lastMessageElement.textContent = room.lastMessage || 'No messages yet';
    } else {
      console.error(`Room element not found for: ${room.roomName}`);
    }
  });
});

addRoomButton.addEventListener('click', () => {
  const roomName = roomNameInput.value;

  if (roomName.trim()) {
    socket.emit('addRoom', roomName);
    roomNameInput.value = '';
  }
});

// Fetch user-specific rooms on page load
document.addEventListener('DOMContentLoaded', () => {
  socket.emit('getUserRooms', username);
});

// Function to open the chat popup
document.getElementById('open-popup').addEventListener('click', function() {
  const popup = document.getElementById('popup');
  popup.style.display = 'block'; // Ensure the popup is visible
  popup.classList.remove('hide');
  popup.classList.add('show');
});

// Function to close the chat popup
document.getElementById('close-popup').addEventListener('click', function() {
  const popup = document.getElementById('popup');
  popup.classList.remove('show');
  popup.classList.add('hide');

  setTimeout(() => {
    popup.style.display = 'none';
    popup.classList.remove('hide');
  }, 500);
});

// Function to open the add user popup
document.getElementById('add-user-btn').addEventListener('click', function() {
  document.getElementById('add-user-popup').style.display = 'block';
});

// Function to close the add user popup
document.getElementById('close-user-popup').addEventListener('click', function() {
  document.getElementById('add-user-popup').style.display = 'none';
});

// Close the add user popup if the user clicks outside of the popup content
window.onclick = function(event) {
  if (event.target == document.getElementById('add-user-popup')) {
    document.getElementById('add-user-popup').style.display = 'none';
  }
};

// Function to handle user dropdown change event
document.getElementById('user-dropdown').addEventListener('change', async (event) => {
  const selectedUser = event.target.value;
  const username = document.getElementById('user-info').innerText;

  if (selectedUser && username) {
    try {
      const response = await fetch('/create-private-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withUser: selectedUser, username }),
      });

      if (response.ok) {
        const { room } = await response.json();
        addRoomToList(room);
        window.location.href = `/chat.html?room=${encodeURIComponent(room)}`;
      } else {
        console.error('Error creating room:', await response.text());
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  } else {
    console.error('Selected user or username is missing');
  }
});

// Room search functionality
document.addEventListener('DOMContentLoaded', () => {
  // Room search functionality
  const roomSearchInput = document.getElementById('search-bar');
  const roomList = document.getElementById('room-list');

  if (roomSearchInput && roomList) {
    console.log('Room search input and room list found');

    const updateRoomListVisibility = () => {
      const query = roomSearchInput.value.toLowerCase();
      const roomListItems = roomList.querySelectorAll('.room-item');

      console.log('Room search query:', query);
      console.log('Number of room items:', roomListItems.length);

      roomListItems.forEach(item => {
        const roomName = item.textContent.toLowerCase();
        console.log('Room item text:', roomName);
        item.style.display = roomName.includes(query) ? 'block' : 'none';
      });
    };

    roomSearchInput.addEventListener('input', updateRoomListVisibility);

    // Initialize visibility
    updateRoomListVisibility();
  } else {
    console.error('Room search input or room list element not found');
  }

  // User search functionality
  const userSearchInput = document.getElementById('user-search');
  const userDropdown = document.getElementById('user-dropdown');

  if (userSearchInput && userDropdown) {
    console.log('User search input and user dropdown found');

    const updateUserDropdownVisibility = () => {
      const query = userSearchInput.value.toLowerCase();
      const options = userDropdown.querySelectorAll('option');

      console.log('User search query:', query);
      console.log('Number of dropdown options:', options.length);

      options.forEach(option => {
        const userName = option.textContent.toLowerCase();
        console.log('Dropdown option text:', userName);
        option.style.display = userName.includes(query) ? 'block' : 'none';
      });
    };

    userSearchInput.addEventListener('input', updateUserDropdownVisibility);

    // Initialize visibility
    updateUserDropdownVisibility();
  } else {
    console.error('User search input or user dropdown element not found');
  }
});

// user search functionality

document.addEventListener('DOMContentLoaded', () => {
  const userSearchInput = document.getElementById('user-search');
  const userDropdown = document.getElementById('user-dropdown');

  userSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const options = userDropdown.querySelectorAll('option');

    options.forEach(option => {
      const userName = option.textContent.toLowerCase();
      option.style.display = userName.includes(query) ? 'block' : 'none';
    });
  });
});

//start user login

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let username = urlParams.get('username');
  let room = urlParams.get('room');

  // If username or room is missing from the URL, check localStorage
  if (!username) {
    username = localStorage.getItem('username');
  }
  if (!room) {
    room = localStorage.getItem('room');
  }

  // If username or room is still missing, redirect to login
  if (!username) {
    window.location.href = 'http://localhost:3000/login.html';
    return;
  }

  // Ensure both username and room are in the URL
  if (!urlParams.has('username') || !urlParams.has('room')) {
    window.location.href = `http://localhost:3000/chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`;
    return;
  }

  // Save the username and room in localStorage
  localStorage.setItem('username', username);
  localStorage.setItem('room', room);

  // Optionally, use these variables (username and room) to initialize the chat interface
  console.log('User:', username);
  console.log('Room:', room);
});

// Function to join a new room
function joinRoom(newRoom) {
  const username = localStorage.getItem('username');
  if (!username) {
    // Handle case where username is not set
    console.error('Username not set in localStorage.');
    return;
  }

  // Update localStorage and URL with the new room
  localStorage.setItem('room', newRoom);
  window.location.href = `http://localhost:3000/chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(newRoom)}`;
}



//end user login


const userInfoElement = document.getElementById('user-info');
userInfoElement.textContent = userInfoElement.textContent.replace(/\d+/g, ''); // Removes all numbers

// Function to remove numbers from the text content of option elements
function removeNumbersFromOptions() {
  const selectElement = document.getElementById('user-select');
  const options = selectElement.querySelectorAll('option');

  options.forEach(option => {
      option.textContent = option.textContent.replace(/\d+/g, ''); // Remove all numbers
  });
}

// Call the function to apply the changes
removeNumbersFromOptions();

