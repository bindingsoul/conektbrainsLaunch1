class ReflexGame {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.timer = 30;
        this.gameActive = false;
        this.currentObject = null;
        this.gameMode = 'normal';
        this.spawnInterval = 2000;
        this.objects = [];
        
        this.sounds = {
            click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-click-1114.mp3'),
            success: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
            gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-over-trombone-1940.mp3')
        };
        this.soundEnabled = true;

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.scoreEl = document.getElementById('score');
        this.timerEl = document.getElementById('timer');
        this.comboEl = document.getElementById('combo');
        this.gameScreen = document.getElementById('game-screen');
        this.startScreen = document.getElementById('start-screen');
        this.endScreen = document.getElementById('end-screen');
        this.finalScoreEl = document.getElementById('final-score');
        this.highScoresEl = document.getElementById('high-scores');
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
    }

    initEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('game-mode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
        });
        this.gameScreen.addEventListener('click', (e) => {
            if (!e.target.classList.contains('game-object')) {
                this.missClick();
            }
        });
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#sound-toggle i');
        icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }

    playSound(sound) {
        if (this.soundEnabled) {
            this.sounds[sound].currentTime = 0;
            this.sounds[sound].play();
        }
    }

    createParticles(x, y) {
        const particleCount = 8;
        const container = document.querySelector('.particle-container');
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 100;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
            
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 600);
        }
    }

    startGame() {
        this.score = 0;
        this.combo = 0;
        this.timer = this.gameMode === 'normal' ? 30 : Infinity;
        this.gameActive = true;
        this.spawnInterval = 2000;
        
        this.updateUI();
        this.showScreen('game');
        this.startSpawning();
        this.startTimer();
    }

    showScreen(screen) {
        [this.startScreen, this.gameScreen, this.endScreen].forEach(s => 
            s.classList.add('hidden'));
        
        switch(screen) {
            case 'start': this.startScreen.classList.remove('hidden'); break;
            case 'game': this.gameScreen.classList.remove('hidden'); break;
            case 'end': this.endScreen.classList.remove('hidden'); break;
        }
    }

    spawnObject() {
        if (!this.gameActive) return;

        const object = document.createElement('div');
        object.classList.add('game-object');
        
        const size = Math.max(30, 50 - this.score/100);
        const x = Math.random() * (this.gameScreen.offsetWidth - size);
        const y = Math.random() * (this.gameScreen.offsetHeight - size);
        
        object.style.width = `${size}px`;
        object.style.height = `${size}px`;
        object.style.left = `${x}px`;
        object.style.top = `${y}px`;
        
        object.addEventListener('click', () => this.hitObject(object));
        
        this.gameScreen.appendChild(object);
        this.objects.push(object);
        
        setTimeout(() => {
            if (object.parentNode) {
                object.parentNode.removeChild(object);
                this.missClick();
            }
        }, this.spawnInterval - 500);
    }

    hitObject(object) {
        if (!this.gameActive) return;
        
        const rect = object.getBoundingClientRect();
        this.createParticles(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        
        this.playSound('success');

        this.score += 10 * (1 + this.combo * 0.1);
        this.combo++;
        this.spawnInterval = Math.max(800, 2000 - this.score/10);
        
        object.parentNode.removeChild(object);
        this.updateUI();
    }

    missClick() {
        if (!this.gameActive) return;
        
        this.playSound('click');

        this.combo = 0;
        if (this.gameMode === 'endurance') {
            this.endGame();
        }
        this.updateUI();
    }

    startTimer() {
        const timerInterval = setInterval(() => {
            if (!this.gameActive) {
                clearInterval(timerInterval);
                return;
            }
            
            if (this.gameMode === 'normal') {
                this.timer--;
                if (this.timer <= 0) {
                    this.endGame();
                    clearInterval(timerInterval);
                }
            }
            
            this.updateUI();
        }, 1000);
    }

    startSpawning() {
        const spawn = () => {
            if (!this.gameActive) return;
            this.spawnObject();
            setTimeout(spawn, this.spawnInterval);
        };
        spawn();
    }

    updateTimerDisplay() {
        const progress = document.querySelector('.timer-ring circle.progress');
        const maxTime = this.gameMode === 'normal' ? 30 : Infinity;
        const percentage = (this.timer / maxTime) * 100;
        
        // Update the circle progress
        if (progress) {
            const circumference = 2 * Math.PI * 35; // r = 35
            const offset = circumference - (percentage / 100) * circumference;
            progress.style.strokeDashoffset = offset;
            
            // Update color based on remaining time
            if (percentage > 60) {
                progress.style.stroke = '#4CAF50';
            } else if (percentage > 30) {
                progress.style.stroke = '#FFC107';
            } else {
                progress.style.stroke = '#F44336';
            }
        }
        
        // Update timer text
        this.timerEl.textContent = Math.ceil(this.timer);
    }

    updateUI() {
        this.scoreEl.textContent = Math.floor(this.score);
        this.updateTimerDisplay();
        this.comboEl.textContent = this.combo;
    }

    endGame() {
        this.playSound('gameOver');

        this.gameActive = false;
        this.finalScoreEl.textContent = Math.floor(this.score);
        this.updateHighScores();
        this.showScreen('end');
        
        // Clear any remaining objects
        this.objects.forEach(obj => {
            if (obj.parentNode) obj.parentNode.removeChild(obj);
        });
        this.objects = [];
    }

    updateHighScores() {
        let highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        highScores.push(this.score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5);
        localStorage.setItem('highScores', JSON.stringify(highScores));
        
        this.highScoresEl.innerHTML = highScores
            .map(score => `<li>${Math.floor(score)}</li>`)
            .join('');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReflexGame();
});
