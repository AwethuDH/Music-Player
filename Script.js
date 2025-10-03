class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio');
        this.playButton = document.getElementById('play');
        this.prevButton = document.getElementById('prev');
        this.nextButton = document.getElementById('next');
        this.shuffleButton = document.getElementById('shuffle');
        this.repeatButton = document.getElementById('repeat');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeIcon = document.getElementById('volume-icon');
        this.progress = document.getElementById('progress');
        this.progressContainer = document.getElementById('progress-container');
        this.title = document.getElementById('title');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalDurationEl = document.getElementById('total-duration');
        this.songInput = document.getElementById('song-input');
        this.scanDeviceButton = document.getElementById('scan-device');
        this.addLocalButton = document.getElementById('add-local');
        this.useDemoButton = document.getElementById('use-demo');
        this.playlistNameInput = document.getElementById('playlist-name');
        this.createPlaylistButton = document.getElementById('create-playlist');
        this.playlistsContainer = document.getElementById('playlists');
        this.songList = document.getElementById('song-list');
        this.sourceIndicator = document.getElementById('source-indicator');
        this.sourceText = document.getElementById('source-text');
        this.songCount = document.getElementById('song-count');

        this.songs = [];
        this.playlists = JSON.parse(localStorage.getItem('playlists')) || {};
        this.currentPlaylist = 'default';
        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none';
        this.originalPlaylist = [];
        this.currentSource = 'none';

        this.demoSongs = [
            {
                name: "See You Again",
                url: "Songs\\Wiz-Khalifa-See-You-Again (2).mp3",
                duration: "0:00",
                source: "demo"
            },
            {
                name: "Amagents",
                url: "Songs\\Samthing-Soweto-Amagents-zamusic.org-.mp3",
                duration: "0:00",
                source: "demo"
            },
            {
                name: "Bank On It",
                url: "Songs\\Burna_Boy_-_Bank_On_It-HIPHOPMORE.COM.mp3",
                duration: "0:00",
                source: "demo"
            },
            {
                name: "Furnace",
                url: "C:\\Users\\Awethu Flathela\\DevRepos\\Music-Player\\Songs\\Kota-Embassy-Furnace.mp3",
                duration: "0:00",
                source: "demo"
            },
            {
                name: "Bambelela",
                url: "C:\\Users\\Awethu Flathela\\DevRepos\\Music-Player\\Songs\\Mas_Musiq_Aymos_-_Bambelela.mp3",
                duration: "0:00",
                source: "demo"
            }
        ];

        this.init();
    }

    init() {
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.prevButton.addEventListener('click', () => this.prevSong());
        this.nextButton.addEventListener('click', () => this.nextSong());
        this.shuffleButton.addEventListener('click', () => this.toggleShuffle());
        this.repeatButton.addEventListener('click', () => this.toggleRepeat());
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.volumeIcon.addEventListener('click', () => this.toggleMute());
        this.progressContainer.addEventListener('click', (e) => this.setProgress(e));
        this.addLocalButton.addEventListener('click', () => this.songInput.click());
        this.scanDeviceButton.addEventListener('click', () => this.scanDeviceForMusic());
        this.useDemoButton.addEventListener('click', () => this.useDemoSongs());
        this.songInput.addEventListener('change', (e) => this.handleSongUpload(e));
        this.createPlaylistButton.addEventListener('click', () => this.createPlaylist());

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());

        this.setupThemes();
        this.updatePlaylistsDisplay();
        this.setVolume();
        this.autoDetectMusic();
    }

    async autoDetectMusic() {
        if (this.playlists.local && this.playlists.local.length > 0) {
            this.songs = this.playlists.local;
            this.currentSource = 'local';
            this.updateSongList();
            this.updateSourceIndicator('Using your local music files', 'local');
            return;
        }

        const hasDeviceMusic = await this.scanDeviceForMusic();
        
        if (!hasDeviceMusic && this.songs.length === 0) {
            this.updateSourceIndicator('No music found. Try demo songs!');
        }
    }

    async scanDeviceForMusic() {
        this.updateSourceIndicator('Scanning device for music...', 'loading');
        
        try {
            if (this.playlists.device && this.playlists.device.length > 0) {
                this.songs = this.playlists.device;
                this.currentSource = 'device';
                this.updateSongList();
                this.updateSourceIndicator('Using previously found device music', 'device');
                return true;
            }

            this.updateSourceIndicator('Please select your music files manually');
            this.addLocalButton.click();
            return false;

        } catch (error) {
            console.log('Device scan not available:', error);
            this.updateSourceIndicator('Device scan not supported in this browser');
            return false;
        }
    }

    useDemoSongs() {
        this.songs = [...this.demoSongs];
        this.currentSource = 'demo';
        this.updateSongList();
        this.updateSourceIndicator('Using demo songs - Add your own music!', 'demo');
        
        if (this.songs.length > 0) {
            setTimeout(() => {
                this.loadSong(0);
                this.playSong();
            }, 500);
        }
    }

    updateSourceIndicator(message, type = 'info') {
        this.sourceText.textContent = message;
        this.sourceIndicator.className = 'music-source-indicator';
        
        if (type === 'local') this.sourceIndicator.classList.add('source-local');
        else if (type === 'demo') this.sourceIndicator.classList.add('source-demo');
        else if (type === 'device') this.sourceIndicator.classList.add('source-device');
        else if (type === 'loading') this.sourceIndicator.classList.add('loading');
    }

    handleSongUpload(event) {
        const files = event.target.files;
        if (!files.length) return;

        let addedCount = 0;
        Array.from(files).forEach(file => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                this.songs.push({
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    url: url,
                    duration: '0:00',
                    source: 'local'
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            this.currentSource = 'local';
            this.updateSourceIndicator(`Added ${addedCount} local music files`, 'local');
            this.savePlaylist();
            this.updateSongList();

            if (!this.audio.src && this.songs.length > 0) {
                this.loadSong(0);
            }
        }

        event.target.value = '';
    }

    createPlaylist() {
        const name = this.playlistNameInput.value.trim();
        if (!name) {
            alert('Please enter a playlist name');
            return;
        }

        this.playlists[name] = [...this.songs];
        this.savePlaylists();
        this.updatePlaylistsDisplay();
        this.playlistNameInput.value = '';
        
        this.updateSourceIndicator(`Playlist "${name}" created with ${this.songs.length} songs`);
    }

    savePlaylist() {
        this.playlists[this.currentPlaylist] = this.songs;
        this.playlists.local = this.songs;
        this.savePlaylists();
    }

    savePlaylists() {
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
    }

    updatePlaylistsDisplay() {
        this.playlistsContainer.innerHTML = '';
        Object.keys(this.playlists).forEach(name => {
            if (name !== 'local') {
                const playlistEl = document.createElement('div');
                playlistEl.className = `playlist-item ${name === this.currentPlaylist ? 'active' : ''}`;
                playlistEl.textContent = `${name} (${this.playlists[name].length} songs)`;
                playlistEl.addEventListener('click', () => this.switchPlaylist(name));
                this.playlistsContainer.appendChild(playlistEl);
            }
        });
    }

    switchPlaylist(name) {
        this.currentPlaylist = name;
        this.songs = this.playlists[name] || [];
        this.currentSource = 'local';
        this.updatePlaylistsDisplay();
        this.updateSongList();
        this.currentSongIndex = 0;
        
        if (this.songs.length > 0) {
            this.loadSong(0);
            this.updateSourceIndicator(`Loaded playlist: ${name}`, 'local');
        } else {
            this.audio.src = '';
            this.title.textContent = 'Playlist is empty';
            this.updateProgress();
        }
    }

    updateSongList() {
        this.songList.innerHTML = '';
        
        if (this.songs.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-music-found';
            emptyMessage.innerHTML = `
                <i class="fas fa-music"></i>
                <div>No music found</div>
                <small>Try adding local files or using demo songs</small>
            `;
            this.songList.appendChild(emptyMessage);
            this.songCount.textContent = '0 songs';
            return;
        }

        this.songCount.textContent = `${this.songs.length} songs`;

        if (this.currentSource === 'demo') {
            const demoNotice = document.createElement('div');
            demoNotice.className = 'demo-notice';
            demoNotice.innerHTML = '<i class="fas fa-info-circle"></i> Playing demo songs - Add your own music!';
            this.songList.appendChild(demoNotice);
        }

        this.songs.forEach((song, index) => {
            const songEl = document.createElement('div');
            songEl.className = `song-item ${index === this.currentSongIndex ? 'active' : ''}`;
            
            const sourceIcon = song.source === 'demo' ? 'fas fa-star' : 'fas fa-file-audio';
            songEl.innerHTML = `
                <div class="song-info">
                    <i class="${sourceIcon}"></i>
                    <span>${song.name}</span>
                </div>
                <span class="song-duration">${song.duration}</span>
            `;
            songEl.addEventListener('click', () => this.loadSong(index));
            this.songList.appendChild(songEl);
        });
    }

    loadSong(index) {
        if (this.songs.length === 0) return;

        this.currentSongIndex = index;
        const song = this.songs[index];
        
        this.audio.src = song.url;
        this.title.textContent = song.name;
        
        document.querySelectorAll('.song-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        if (this.isPlaying) {
            this.audio.play().catch(console.error);
        }
    }

    togglePlay() {
        if (this.songs.length === 0) {
            this.useDemoSongs();
            return;
        }

        if (this.isPlaying) {
            this.pauseSong();
        } else {
            this.playSong();
        }
    }

    playSong() {
        if (!this.audio.src && this.songs.length > 0) {
            this.loadSong(0);
        }

        this.audio.play().then(() => {
            this.isPlaying = true;
            this.playButton.innerHTML = '<i class="fas fa-pause"></i>';
            this.playButton.classList.add('playing');
        }).catch(console.error);
    }

    pauseSong() {
        this.audio.pause();
        this.isPlaying = false;
        this.playButton.innerHTML = '<i class="fas fa-play"></i>';
        this.playButton.classList.remove('playing');
    }

    prevSong() {
        if (this.songs.length === 0) return;

        this.currentSongIndex--;
        if (this.currentSongIndex < 0) {
            this.currentSongIndex = this.songs.length - 1;
        }
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.audio.play();
        }
    }

    nextSong() {
        if (this.songs.length === 0) return;

        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
            return;
        }

        this.currentSongIndex++;
        if (this.currentSongIndex >= this.songs.length) {
            this.currentSongIndex = 0;
        }
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.audio.play();
        }
    }

    handleSongEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.repeatMode === 'all' || this.currentSongIndex < this.songs.length - 1) {
            this.nextSong();
        } else {
            this.pauseSong();
            this.audio.currentTime = 0;
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleButton.classList.toggle('active', this.isShuffled);
        
        if (this.isShuffled) {
            this.originalPlaylist = [...this.songs];
            this.shuffleSongs();
        } else {
            this.songs = [...this.originalPlaylist];
        }
        this.updateSongList();
    }

    shuffleSongs() {
        for (let i = this.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
        }
    }

    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        this.repeatButton.classList.toggle('active', this.repeatMode !== 'none');
        this.repeatButton.innerHTML = this.repeatMode === 'one' ? 
            '<i class="fas fa-redo-alt"></i>' : 
            '<i class="fas fa-redo"></i>';
    }

    setVolume() {
        const volume = this.volumeSlider.value;
        this.audio.volume = volume;
        
        let icon = 'fa-volume-up';
        if (volume == 0) icon = 'fa-volume-mute';
        else if (volume < 0.5) icon = 'fa-volume-down';
        
        this.volumeIcon.innerHTML = `<i class="fas ${icon}"></i>`;
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.audio.volume = 0;
            this.volumeSlider.value = 0;
            this.volumeIcon.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            this.audio.volume = 0.7;
            this.volumeSlider.value = 0.7;
            this.volumeIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    setProgress(e) {
        const width = this.progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        
        this.audio.currentTime = (clickX / width) * duration;
    }

    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = `${percent}%`;
            
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }

    updateDuration() {
        if (this.audio.duration) {
            this.totalDurationEl.textContent = this.formatTime(this.audio.duration);
            
            if (this.songs[this.currentSongIndex]) {
                this.songs[this.currentSongIndex].duration = this.formatTime(this.audio.duration);
                this.updateSongList();
                this.savePlaylist();
            }
        }
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    setupThemes() {
        const themes = {
            'light-mode': 'light',
            'dark-mode': 'dark',
            'sky-blue-mode': 'sky-blue',
            'pink-mode': 'pink'
        };

        Object.entries(themes).forEach(([buttonId, theme]) => {
            document.getElementById(buttonId).addEventListener('click', () => {
                document.documentElement.setAttribute('data-theme', theme);
                document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById(buttonId).classList.add('active');
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});