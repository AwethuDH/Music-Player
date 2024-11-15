// Get Elements
const createPlaylistBtn = document.getElementById("create-playlist");
const playlistsContainer = document.getElementById("playlists");
const songInput = document.getElementById("song-input");
const addSongBtn = document.getElementById("add-song");
const playlistNameInput = document.getElementById("playlist-name");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");
const volumeSlider = document.getElementById("volume-slider");
const currentTimeEl = document.getElementById("current-time");
const totalDurationEl = document.getElementById("total-duration");
const volumeIcon = document.getElementById("volume-icon"); 
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const playBtn = document.getElementById("play");
const audio = document.getElementById("audio");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

// Store playlists and songs
let playlists = {};
let currentPlaylist = [];
let currentPlaylistName = "";

// Shuffle and Repeat States
let isShuffle = false;
let isRepeat = false;

// Song stats
let mostPlayed = {};
let favoriteSongs = new Set();

// Clicking the "Add Songs" button will trigger the hidden file input
addSongBtn.addEventListener("click", () => {
  if (currentPlaylistName) {
    songInput.click();
  } else {
    alert("Please create or select a playlist first!");
  }
});

// Handling the file input change event
songInput.addEventListener("change", () => {
  const files = songInput.files;
  if (files.length > 0) {
    Array.from(files).forEach((file) => {
      const songURL = URL.createObjectURL(file);
      currentPlaylist.push({
        title: file.name.replace(".mp3", ""),
        src: songURL,
      });
    });
    playlists[currentPlaylistName] = currentPlaylist;
    renderPlaylists();
    songInput.value = "";
  }
});

// Create a new playlist
createPlaylistBtn.addEventListener("click", () => {
  const playlistName = playlistNameInput.value.trim();
  if (playlistName && !playlists[playlistName]) {
    playlists[playlistName] = [];
    currentPlaylistName = playlistName;
    currentPlaylist = playlists[playlistName];
    renderPlaylists();
    alert(`Playlist '${playlistName}' created!`);
    playlistNameInput.value = "";
  } else if (playlists[playlistName]) {
    alert("Playlist already exists!");
  } else {
    alert("Please enter a valid playlist name.");
  }
});

// Render all playlists
function renderPlaylists() {
  playlistsContainer.innerHTML = '';
  for (const [name, songs] of Object.entries(playlists)) {
    // Playlist div
    const playlistDiv = document.createElement("div");
    playlistDiv.className = "playlist";
    playlistDiv.textContent = `${name} (${songs.length} songs)`;
    
    // Song list container
    const songList = document.createElement("ul");
    songList.className = "song-list";
    
    // Populate the song list
    songs.forEach((song, index) => {
      const songItem = document.createElement("li");
      songItem.textContent = song.title;
      songItem.onclick = () => playSong(index, name);
      songList.appendChild(songItem);
    });

    // Toggle song list display on playlist click
    playlistDiv.addEventListener("click", () => {
      const isActive = playlistDiv.classList.contains("active");
      // Collapse any open playlist
      document.querySelectorAll(".playlist").forEach(div => div.classList.remove("active"));
      document.querySelectorAll(".song-list").forEach(list => list.style.display = "none");
      
      // Expand the clicked playlist's song list
      if (!isActive) {
        playlistDiv.classList.add("active");
        songList.style.display = "block";
      }
    });

    // Append the playlist and its song list
    playlistDiv.appendChild(songList);
    playlistsContainer.appendChild(playlistDiv);
  }
}

// Play the selected song from the list
function playSong(index, playlistName) {
  let songIndex = index;

  if (isShuffle) {
    songIndex = Math.floor(Math.random() * playlists[playlistName].length);
  }

  const song = playlists[playlistName][songIndex];
  audio.src = song.src;
  const title = document.getElementById("title");
  title.textContent = song.title;
  audio.play();

  // Update Most Played Count
  mostPlayed[song.title] = (mostPlayed[song.title] || 0) + 1;

  // When Song Ends, Handle Repeat and Next
  audio.onended = () => {
    if (isRepeat) {
      playSong(songIndex, playlistName);
    } else {
      nextSong();
    }
  };
}

  
// Update Shuffle State
document.getElementById("shuffle").addEventListener("click", function () {
    this.classList.toggle("active");
  });

// Update Repeat State
document.getElementById("repeat").addEventListener("click", function () {
    this.classList.toggle("active");
  });


// Toggle the visibility of the volume slider
volumeIcon.addEventListener("click", () => {
  const volumeControls = document.getElementById("volume-controls");
  volumeControls.classList.toggle("visible"); // Toggle visibility of the slider
});

// Update volume
volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value;
});

// Update Time Display
audio.addEventListener("timeupdate", updateTimeDisplay);

// Function to update current time and duration
function updateTimeDisplay() {
  const currentTime = audio.currentTime;
  const duration = audio.duration;
  currentTimeEl.textContent = formatTime(currentTime);
  totalDurationEl.textContent = formatTime(duration);
}

// Format Time in MM:SS
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Play/Pause functionality
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.querySelector("i").classList.remove("fa-play");
    playBtn.querySelector("i").classList.add("fa-pause");
  } else {
    audio.pause();
    playBtn.querySelector("i").classList.add("fa-play");
    playBtn.querySelector("i").classList.remove("fa-pause");
  }
});

// Next Button
nextBtn.addEventListener("click", () => {
  let currentSongIndex = playlists[currentPlaylistName].findIndex(song => song.src === audio.src);
  let nextSongIndex = (currentSongIndex + 1) % playlists[currentPlaylistName].length;
  playSong(nextSongIndex, currentPlaylistName);
});

// Previous Button
prevBtn.addEventListener("click", () => {
  let currentSongIndex = playlists[currentPlaylistName].findIndex(song => song.src === audio.src);
  let prevSongIndex = (currentSongIndex - 1 + playlists[currentPlaylistName].length) % playlists[currentPlaylistName].length;
  playSong(prevSongIndex, currentPlaylistName);
});

// Progress Bar update
audio.addEventListener("timeupdate", () => {
  const progress = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = `${progress}%`;
});

// Seek to a specific time when clicking on the progress bar
progressContainer.addEventListener("click", (e) => {
  const clickPosition = e.offsetX;
  const containerWidth = progressContainer.offsetWidth;
  const seekTime = (clickPosition / containerWidth) * audio.duration;
  audio.currentTime = seekTime;
});

// Initial render
renderPlaylists();
