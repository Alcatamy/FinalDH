class AdvancedBadmintonCalculator {
    constructor() {
        this.matches = {
            DX: { sets: [], winner: null, startTime: null, duration: 0 },
            DF: { sets: [], winner: null, startTime: null, duration: 0 },
            DM: { sets: [], winner: null, startTime: null, duration: 0 },
            IF2: { sets: [], winner: null, startTime: null, duration: 0 },
            IM2: { sets: [], winner: null, startTime: null, duration: 0 },
            IF1: { sets: [], winner: null, startTime: null, duration: 0 },
            IM1: { sets: [], winner: null, startTime: null, duration: 0 }
        };
        
        this.globalStats = {
            ppc: { encuentros: 0, partidos: 3, sets: 10, puntos: 200 },
            ies: { encuentros: 1, partidos: 4, sets: 14, puntos: 225 }
        };
        
        this.champion = null;
        this.matchTimer = null;
        this.matchStartTime = null;
        this.soundEnabled = true;
        this.theme = 'light';
        this.timeline = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        await this.showLoadingScreen();
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupCharts();
        this.updateDisplay();
        this.calculateProbabilities();
        this.hideLoadingScreen();
    }

    showLoadingScreen() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    loadFromStorage() {
        const saved = localStorage.getItem('badminton-final-2025');
        if (saved) {
            const data = JSON.parse(saved);
            this.matches = data.matches || this.matches;
            this.timeline = data.timeline || [];
            this.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
            this.theme = data.theme || 'light';
            
            document.body.setAttribute('data-theme', this.theme);
            this.updateSoundToggle();
        }
    }

    saveToStorage() {
        const data = {
            matches: this.matches,
            timeline: this.timeline,
            soundEnabled: this.soundEnabled,
            theme: this.theme,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('badminton-final-2025', JSON.stringify(data));
    }

    setupEventListeners() {
        // Existing match input listeners
        document.querySelectorAll('.match-card input').forEach(input => {
            input.addEventListener('input', (e) => this.handleScoreInput(e));
            input.addEventListener('blur', (e) => this.handleAutoComplete(e));
        });

        // New control listeners
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('fullscreen-toggle').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('export-pdf').addEventListener('click', () => this.exportToPDF());
        document.getElementById('timer-control').addEventListener('click', () => this.toggleTimer());

        // Tab listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleScoreInput(e) {
        const input = e.target;
        const value = parseInt(input.value) || 0;
        
        if (value < 0) input.value = 0;
        if (value > 30) input.value = 30;
        
        const matchCard = input.closest('.match-card');
        const matchKey = matchCard.dataset.match;
        
        // Start match timer if first input
        if (!this.matches[matchKey].startTime && value > 0) {
            this.matches[matchKey].startTime = new Date();
            this.addToTimeline(`Inicio del partido ${matchKey}`);
            this.playSound('match-start');
        }
        
        this.processMatchData();
        this.updateDisplay();
        this.calculateProbabilities();
        this.updateCharts();
        this.checkForChampion();
        this.saveToStorage();
    }

    handleAutoComplete(e) {
        const input = e.target;
        const setContainer = input.closest('.set-input');
        const ppcInput = setContainer.querySelector('.ppc-score');
        const iesInput = setContainer.querySelector('.ies-score');
        
        const ppcScore = parseInt(ppcInput.value) || 0;
        const iesScore = parseInt(iesInput.value) || 0;
        
        // Enhanced autocomplete with sound feedback
        if (input === ppcInput && ppcScore > 0 && ppcScore < 11 && iesScore === 0) {
            iesInput.value = 11;
            this.playSound('autocomplete');
        } else if (input === iesInput && iesScore > 0 && iesScore < 11 && ppcScore === 0) {
            ppcInput.value = 11;
            this.playSound('autocomplete');
        }
        
        // Prevent 11-11
        if (ppcScore === 11 && iesScore === 11) {
            input.value = 10;
            this.showToast('No se permite empate 11-11', 'warning');
        }
        
        this.processMatchData();
        this.updateDisplay();
    }

    processMatchData() {
        Object.keys(this.matches).forEach(matchKey => {
            const matchCard = document.querySelector(`[data-match="${matchKey}"]`);
            const setInputs = matchCard.querySelectorAll('.set-input');
            
            let ppcSets = 0;
            let iesSets = 0;
            const sets = [];
            
            setInputs.forEach((setInput, index) => {
                const ppcScore = parseInt(setInput.querySelector('.ppc-score').value) || 0;
                const iesScore = parseInt(setInput.querySelector('.ies-score').value) || 0;
                
                if (ppcScore > 0 || iesScore > 0) {
                    sets.push({ ppc: ppcScore, ies: iesScore });
                    
                    if (this.isValidSet(ppcScore, iesScore)) {
                        const setWinner = setInput.querySelector('.set-winner');
                        if (ppcScore > iesScore) {
                            ppcSets++;
                            setWinner.textContent = 'P';
                            setWinner.className = 'set-winner ppc';
                        } else {
                            iesSets++;
                            setWinner.textContent = 'I';
                            setWinner.className = 'set-winner ies';
                        }
                        
                        // Show next set if match not finished
                        if (ppcSets < 3 && iesSets < 3 && index < 4) {
                            this.showNextSet(matchCard, index + 2);
                        }
                    }
                }
            });
            
            this.matches[matchKey].sets = sets;
            
            // Check for match winner
            const previousWinner = this.matches[matchKey].winner;
            if (ppcSets === 3) {
                this.matches[matchKey].winner = 'ppc';
                if (!previousWinner) {
                    this.addToTimeline(`PPC gana ${matchKey} (${ppcSets}-${iesSets})`);
                    this.playSound('match-win');
                }
            } else if (iesSets === 3) {
                this.matches[matchKey].winner = 'ies';
                if (!previousWinner) {
                    this.addToTimeline(`IES gana ${matchKey} (${ppcSets}-${iesSets})`);
                    this.playSound('match-win');
                }
            } else {
                this.matches[matchKey].winner = null;
            }
            
            // Update match status
            this.updateMatchStatus(matchCard, ppcSets, iesSets, this.matches[matchKey].winner);
            this.updateMatchResult(matchCard, ppcSets, iesSets, this.matches[matchKey].winner);
        });
    }

    updateMatchStatus(matchCard, ppcSets, iesSets, winner) {
        const statusIndicator = matchCard.querySelector('.match-status-indicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (winner) {
            statusDot.className = 'status-dot finished';
            statusText.textContent = 'Finalizado';
        } else if (ppcSets > 0 || iesSets > 0) {
            statusDot.className = 'status-dot playing';
            statusText.textContent = 'En juego';
        } else {
            statusDot.className = 'status-dot pending';
            statusText.textContent = 'Pendiente';
        }
    }

    calculateProbabilities() {
        const totals = this.calculateTotals();
        
        // Simple probability calculation based on current state
        let ppcProb = 50;
        let iesProb = 50;
        
        // Adjust based on current state
        const encuentrosDiff = totals.ies.encuentros - totals.ppc.encuentros;
        const partidosDiff = totals.ies.partidos - totals.ppc.partidos;
        const setsDiff = totals.ies.sets - totals.ppc.sets;
        
        iesProb += encuentrosDiff * 20 + partidosDiff * 5 + setsDiff * 2;
        ppcProb = 100 - iesProb;
        
        // Ensure bounds
        ppcProb = Math.max(5, Math.min(95, ppcProb));
        iesProb = 100 - ppcProb;
        
        // Update UI
        document.getElementById('ppc-probability').style.width = ppcProb + '%';
        document.getElementById('ies-probability').style.width = iesProb + '%';
        document.getElementById('ppc-prob-text').textContent = Math.round(ppcProb) + '%';
        document.getElementById('ies-prob-text').textContent = Math.round(iesProb) + '%';
    }

    setupCharts() {
        // Progress chart
        const progressCanvas = document.getElementById('progress-canvas');
        const progressCtx = progressCanvas.getContext('2d');
        this.charts.progress = { canvas: progressCanvas, ctx: progressCtx };
        
        this.drawProgressChart();
    }

    drawProgressChart() {
        const ctx = this.charts.progress.ctx;
        const canvas = this.charts.progress.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 7; i++) {
            const x = (i / 7) * canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw progress line
        const matchKeys = Object.keys(this.matches);
        const lineY = canvas.height / 2;
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        
        matchKeys.forEach((key, index) => {
            const x = ((index + 1) / 7) * canvas.width;
            const match = this.matches[key];
            let y = lineY;
            
            if (match.winner === 'ppc') {
                y = canvas.height * 0.75;
            } else if (match.winner === 'ies') {
                y = canvas.height * 0.25;
            }
            
            ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        
        // Draw points
        matchKeys.forEach((key, index) => {
            const x = ((index + 1) / 7) * canvas.width;
            const match = this.matches[key];
            let y = lineY;
            let color = '#6c757d';
            
            if (match.winner === 'ppc') {
                y = canvas.height * 0.75;
                color = '#dc3545';
            } else if (match.winner === 'ies') {
                y = canvas.height * 0.25;
                color = '#28a745';
            }
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    updateCharts() {
        this.drawProgressChart();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.theme);
        
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        this.playSound('click');
        this.saveToStorage();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundToggle();
        this.playSound('click');
        this.saveToStorage();
    }

    updateSoundToggle() {
        const soundBtn = document.getElementById('sound-toggle');
        const soundIcon = soundBtn.querySelector('i');
        
        if (this.soundEnabled) {
            soundBtn.classList.add('active');
            soundIcon.className = 'fas fa-volume-up';
        } else {
            soundBtn.classList.remove('active');
            soundIcon.className = 'fas fa-volume-mute';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.querySelector('#fullscreen-toggle i').className = 'fas fa-compress';
        } else {
            document.exitFullscreen();
            document.querySelector('#fullscreen-toggle i').className = 'fas fa-expand';
        }
        this.playSound('click');
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        let frequency, duration;
        
        switch (type) {
            case 'click':
                frequency = 800;
                duration = 0.1;
                break;
            case 'autocomplete':
                frequency = 600;
                duration = 0.2;
                break;
            case 'match-start':
                frequency = 440;
                duration = 0.3;
                break;
            case 'match-win':
                frequency = 880;
                duration = 0.4;
                break;
            case 'champion':
                frequency = 1000;
                duration = 1;
                break;
            default:
                frequency = 500;
                duration = 0.1;
        }
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    addToTimeline(event) {
        const timestamp = new Date();
        this.timeline.push({
            time: timestamp,
            event: event,
            formatted: timestamp.toLocaleTimeString()
        });
        
        this.updateTimelineDisplay();
    }

    updateTimelineDisplay() {
        const timelineContent = document.getElementById('timeline-content');
        timelineContent.innerHTML = '';
        
        this.timeline.slice(-10).reverse().forEach(item => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-time">${item.formatted}</div>
                <div class="timeline-event">${item.event}</div>
            `;
            timelineContent.appendChild(timelineItem);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.playSound('click');
    }

    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add content to PDF
        doc.setFontSize(20);
        doc.text('Final División de Honor 2025', 20, 30);
        
        doc.setFontSize(12);
        doc.text('Resultado detallado del encuentro', 20, 50);
        
        // Add match results
        let yPosition = 70;
        Object.keys(this.matches).forEach(matchKey => {
            const match = this.matches[matchKey];
            if (match.winner) {
                const winner = match.winner === 'ppc' ? 'PPC' : 'IES';
                doc.text(`${matchKey}: Ganador ${winner}`, 20, yPosition);
                yPosition += 10;
            }
        });
        
        // Save PDF
        doc.save('final-badminton-2025.pdf');
        
        this.showToast('PDF exportado correctamente', 'success');
        this.playSound('click');
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveToStorage();
                    this.showToast('Datos guardados', 'success');
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportToPDF();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        }
        
        switch (e.key) {
            case 'Escape':
                if (document.fullscreenElement) {
                    this.toggleFullscreen();
                }
                break;
        }
    }

    declareChampion(team) {
        if (this.champion) return;
        
        this.champion = team;
        const banner = document.getElementById('champion-banner');
        const championText = document.getElementById('champion-text');
        const championStats = document.getElementById('champion-stats');
        
        const teamName = team === 'PPC' ? 'Puertas Padilla Cartagena' : 'Recreativo IES La Orden';
        championText.textContent = teamName;
        
        // Add champion stats
        const totals = this.calculateTotals();
        const stats = totals[team.toLowerCase()];
        championStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.encuentros}</div>
                <div class="stat-label">Encuentros</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.partidos}</div>
                <div class="stat-label">Partidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.sets}</div>
                <div class="stat-label">Sets</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.puntos}</div>
                <div class="stat-label">Puntos</div>
            </div>
        `;
        
        banner.style.display = 'flex';
        
        // Disable all inputs
        document.querySelectorAll('.match-card input').forEach(input => {
            input.disabled = true;
        });
        
        // Add to timeline
        this.addToTimeline(`🏆 ${teamName} es CAMPEÓN!`);
        
        // Play celebration
        this.playSound('champion');
        this.showConfetti();
        
        this.saveToStorage();
    }

    showConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#ffd700'];
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 4 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                
                container.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 6000);
            }, i * 50);
        }
    }

    // Include all previous methods (calculateTotals, updateDisplay, etc.)
    calculateTotals() {
        let ppcMatches = 0;
        let iesMatches = 0;
        let ppcSetsTotal = this.globalStats.ppc.sets;
        let iesSetsTotal = this.globalStats.ies.sets;
        let ppcPointsTotal = this.globalStats.ppc.puntos;
        let iesPointsTotal = this.globalStats.ies.puntos;
        
        Object.values(this.matches).forEach(match => {
            if (match.winner === 'ppc') ppcMatches++;
            else if (match.winner === 'ies') iesMatches++;
            
            match.sets.forEach(set => {
                if (this.isValidSet(set.ppc, set.ies)) {
                    if (set.ppc > set.ies) ppcSetsTotal++;
                    else if (set.ies > set.ppc) iesSetsTotal++;
                    
                    ppcPointsTotal += set.ppc;
                    iesPointsTotal += set.ies;
                }
            });
        });
        
        return {
            ppc: {
                encuentros: this.globalStats.ppc.encuentros + (ppcMatches > iesMatches ? 1 : 0),
                partidos: this.globalStats.ppc.partidos + ppcMatches,
                sets: ppcSetsTotal,
                puntos: ppcPointsTotal
            },
            ies: {
                encuentros: this.globalStats.ies.encuentros + (iesMatches > ppcMatches ? 1 : 0),
                partidos: this.globalStats.ies.partidos + iesMatches,
                sets: iesSetsTotal,
                puntos: iesPointsTotal
            }
        };
    }

    updateDisplay() {
        const totals = this.calculateTotals();
        
        // Update team stats
        document.getElementById('ppc-encuentros').textContent = totals.ppc.encuentros;
        document.getElementById('ppc-partidos').textContent = totals.ppc.partidos;
        document.getElementById('ppc-sets').textContent = totals.ppc.sets;
        document.getElementById('ppc-puntos').textContent = totals.ppc.puntos;
        
        document.getElementById('ies-encuentros').textContent = totals.ies.encuentros;
        document.getElementById('ies-partidos').textContent = totals.ies.partidos;
        document.getElementById('ies-sets').textContent = totals.ies.sets;
        document.getElementById('ies-puntos').textContent = totals.ies.puntos;
        
        // Update global score
        document.getElementById('global-score-text').textContent = 
            `${totals.ppc.encuentros} - ${totals.ies.encuentros}`;
        
        this.updateScenarios(totals);
    }

    checkForChampion() {
        const totals = this.calculateTotals();
        
        // Apply Article 19 criteria
        if (totals.ppc.encuentros > totals.ies.encuentros) {
            this.declareChampion('PPC');
        } else if (totals.ies.encuentros > totals.ppc.encuentros) {
            this.declareChampion('IES');
        } else if (totals.ppc.encuentros === totals.ies.encuentros && totals.ppc.encuentros > 0) {
            // Tie-breaking criteria
            if (totals.ppc.partidos > totals.ies.partidos) {
                this.declareChampion('PPC');
            } else if (totals.ies.partidos > totals.ppc.partidos) {
                this.declareChampion('IES');
            } else if (totals.ppc.sets > totals.ies.sets) {
                this.declareChampion('PPC');
            } else if (totals.ies.sets > totals.ppc.sets) {
                this.declareChampion('IES');
            } else if (totals.ppc.puntos > totals.ies.puntos) {
                this.declareChampion('PPC');
            } else if (totals.ies.puntos > totals.ppc.puntos) {
                this.declareChampion('IES');
            }
        }
    }

    // Include remaining methods from previous version...
    isValidSet(ppcScore, iesScore) {
        if (ppcScore === 0 && iesScore === 0) return false;
        if (ppcScore === 11 && iesScore === 11) return false;
        
        if (ppcScore === 11) return iesScore < 11;
        if (iesScore === 11) return ppcScore < 11;
        
        return false;
    }

    showNextSet(matchCard, setNumber) {
        if (setNumber > 5) return;
        
        let nextSetInput = matchCard.querySelector(`[data-set="${setNumber}"]`);
        if (!nextSetInput) {
            nextSetInput = this.createSetInput(setNumber);
            matchCard.querySelector('.sets-container').appendChild(nextSetInput);
        }
        nextSetInput.classList.remove('hidden');
    }

    createSetInput(setNumber) {
        const setDiv = document.createElement('div');
        setDiv.className = 'set-input';
        setDiv.setAttribute('data-set', setNumber);
        setDiv.innerHTML = `
            <label>Set ${setNumber}:</label>
            <div class="score-input-group">
                <input type="number" class="ppc-score" min="0" max="30" placeholder="PPC">
                <span class="score-separator">-</span>
                <input type="number" class="ies-score" min="0" max="30" placeholder="IES">
            </div>
            <div class="set-winner"></div>
        `;
        
        setDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => this.handleScoreInput(e));
            input.addEventListener('blur', (e) => this.handleAutoComplete(e));
        });
        
        return setDiv;
    }

    updateMatchResult(matchCard, ppcSets, iesSets, winner) {
        const resultDiv = matchCard.querySelector('.match-result');
        
        if (winner === 'ppc') {
            resultDiv.textContent = `Ganador: PPC (${ppcSets}-${iesSets})`;
            resultDiv.className = 'match-result ppc-win';
        } else if (winner === 'ies') {
            resultDiv.textContent = `Ganador: IES (${ppcSets}-${iesSets})`;
            resultDiv.className = 'match-result ies-win';
        } else if (ppcSets > 0 || iesSets > 0) {
            resultDiv.textContent = `En juego: ${ppcSets}-${iesSets}`;
            resultDiv.className = 'match-result';
        } else {
            resultDiv.textContent = '';
            resultDiv.className = 'match-result';
        }
    }

    updateScenarios(totals) {
        const scenariosContent = document.getElementById('scenarios-content');
        
        if (this.champion) {
            scenariosContent.innerHTML = `
                <div class="champion-scenario">
                    <h4>🏆 ${this.champion === 'PPC' ? 'Puertas Padilla Cartagena' : 'Recreativo IES La Orden'} es el CAMPEÓN!</h4>
                    <p>La final ha sido decidida según los criterios del Artículo 19.</p>
                </div>
            `;
            return;
        }
        
        const remainingMatches = Object.values(this.matches).filter(m => !m.winner).length;
        
        if (remainingMatches === 0) {
            scenariosContent.innerHTML = '<p>Todos los partidos completados. Verificando criterios de desempate...</p>';
            return;
        }
        
        let scenarios = '<div class="scenarios-grid">';
        
        // Calculate what each team needs
        if (totals.ppc.encuentros === totals.ies.encuentros) {
            scenarios += `
                <div class="scenario-card ppc">
                    <h4><i class="fas fa-chess-king"></i> PPC necesita:</h4>
                    <ul>
                        <li>Ganar el encuentro de vuelta para forzar desempate</li>
                        <li>En caso de empate: más partidos individuales</li>
                        <li>Si empatan en partidos: más sets totales</li>
                    </ul>
                </div>
                <div class="scenario-card ies">
                    <h4><i class="fas fa-shield-alt"></i> IES necesita:</h4>
                    <ul>
                        <li>Empatar o ganar el encuentro mantiene ventaja</li>
                        <li>Ventaja actual en encuentros globales (1-0)</li>
                        <li>Margen en partidos individuales: ${totals.ies.partidos - totals.ppc.partidos}</li>
                    </ul>
                </div>
            `;
        }
        
        scenarios += '</div>';
        scenariosContent.innerHTML = scenarios;
    }
}

// Global functions for champion banner buttons
function shareResult() {
    if (navigator.share) {
        navigator.share({
            title: 'Final División de Honor 2025',
            text: 'Resultado de la final de bádminton',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        calculator.showToast('Enlace copiado al portapapeles', 'success');
    }
}

function triggerCelebration() {
    calculator.showConfetti();
    calculator.playSound('champion');
}

// Initialize the advanced calculator
let calculator;
document.addEventListener('DOMContentLoaded', () => {
    calculator = new AdvancedBadmintonCalculator();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
