// Calculadora de Bádminton - Versión Funcional Garantizada
class BadmintonCalculator {
    constructor() {
        this.matches = {
            DX: { sets: [], winner: null },
            DF: { sets: [], winner: null },
            DM: { sets: [], winner: null },
            IF2: { sets: [], winner: null },
            IM2: { sets: [], winner: null },
            IF1: { sets: [], winner: null },
            IM1: { sets: [], winner: null }
        };
        
        this.globalStats = {
            ppc: { encuentros: 0, partidos: 3, sets: 10, puntos: 200 },
            ies: { encuentros: 1, partidos: 4, sets: 14, puntos: 225 }
        };
        
        this.champion = null;
        this.soundEnabled = true;
        this.theme = 'light';
        
        this.init();
    }

    init() {
        console.log('🏸 Iniciando calculadora de bádminton...');
        
        // Ocultar loading screen después de 2 segundos
        setTimeout(() => {
            this.hideLoadingScreen();
            console.log('✅ Loading screen ocultado');
        }, 2000);
        
        this.setupEventListeners();
        this.updateDisplay();
        console.log('✅ Calculadora iniciada correctamente');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    setupEventListeners() {
        // Listeners para inputs de matches
        document.querySelectorAll('.match-card input').forEach(input => {
            input.addEventListener('input', (e) => this.handleScoreInput(e));
            input.addEventListener('blur', (e) => this.handleAutoComplete(e));
        });

        // Controles superiores
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSound());
        }

        console.log('✅ Event listeners configurados');
    }

    handleScoreInput(e) {
        const input = e.target;
        let value = parseInt(input.value);
        
        // Validar entrada
        if (isNaN(value) || value < 0) value = 0;
        if (value > 30) value = 30;
        
        input.value = value || '';
        
        this.processMatchData();
        this.updateDisplay();
        this.checkForChampion();
    }

    handleAutoComplete(e) {
        const input = e.target;
        const setContainer = input.closest('.set-input');
        const ppcInput = setContainer.querySelector('.ppc-score');
        const iesInput = setContainer.querySelector('.ies-score');
        
        const ppcScore = parseInt(ppcInput.value) || 0;
        const iesScore = parseInt(iesInput.value) || 0;
        
        // Autocompletado inteligente
        if (input === ppcInput && ppcScore > 0 && ppcScore < 11 && iesScore === 0) {
            iesInput.value = 11;
        } else if (input === iesInput && iesScore > 0 && iesScore < 11 && ppcScore === 0) {
            ppcInput.value = 11;
        }
        
        // Prevenir 11-11
        if (ppcScore === 11 && iesScore === 11) {
            input.value = 10;
        }
        
        this.processMatchData();
        this.updateDisplay();
    }

    processMatchData() {
        Object.keys(this.matches).forEach(matchKey => {
            const matchCard = document.querySelector(`[data-match="${matchKey}"]`);
            if (!matchCard) return;
            
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
                        
                        // Mostrar siguiente set si el partido no ha terminado
                        if (ppcSets < 3 && iesSets < 3 && index < 4) {
                            this.showNextSet(matchCard, index + 2);
                        }
                    } else {
                        const setWinner = setInput.querySelector('.set-winner');
                        setWinner.textContent = '';
                        setWinner.className = 'set-winner';
                    }
                }
            });
            
            this.matches[matchKey].sets = sets;
            
            // Determinar ganador del partido
            if (ppcSets === 3) {
                this.matches[matchKey].winner = 'ppc';
            } else if (iesSets === 3) {
                this.matches[matchKey].winner = 'ies';
            } else {
                this.matches[matchKey].winner = null;
            }
            
            this.updateMatchResult(matchCard, ppcSets, iesSets, this.matches[matchKey].winner);
        });
    }

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
        if (!resultDiv) return;
        
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
        
        // Actualizar estadísticas de equipos de forma segura
        this.updateElementText('ppc-encuentros', totals.ppc.encuentros);
        this.updateElementText('ppc-partidos', totals.ppc.partidos);
        this.updateElementText('ppc-sets', totals.ppc.sets);
        this.updateElementText('ppc-puntos', totals.ppc.puntos);
        
        this.updateElementText('ies-encuentros', totals.ies.encuentros);
        this.updateElementText('ies-partidos', totals.ies.partidos);
        this.updateElementText('ies-sets', totals.ies.sets);
        this.updateElementText('ies-puntos', totals.ies.puntos);
        
        // Actualizar marcador global
        this.updateElementText('global-score-text', `${totals.ppc.encuentros} - ${totals.ies.encuentros}`);
        
        this.updateScenarios(totals);
    }

    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    checkForChampion() {
        if (this.champion) return;
        
        const totals = this.calculateTotals();
        
        // Aplicar criterios de desempate según Artículo 19
        if (totals.ppc.encuentros > totals.ies.encuentros) {
            this.declareChampion('PPC');
        } else if (totals.ies.encuentros > totals.ppc.encuentros) {
            this.declareChampion('IES');
        } else if (totals.ppc.encuentros === totals.ies.encuentros && totals.ppc.encuentros > 0) {
            // Empate a encuentros, aplicar criterios de desempate
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

    declareChampion(team) {
        if (this.champion) return;
        
        this.champion = team;
        const banner = document.getElementById('champion-banner');
        const championText = document.getElementById('champion-text');
        
        const teamName = team === 'PPC' ? 'Puertas Padilla Cartagena' : 'Recreativo IES La Orden';
        
        if (championText) championText.textContent = teamName;
        if (banner) banner.style.display = 'flex';
        
        // Deshabilitar todos los inputs
        document.querySelectorAll('.match-card input').forEach(input => {
            input.disabled = true;
        });
        
        this.showConfetti();
        console.log(`🏆 ¡${teamName} es campeón!`);
    }

    showConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#ffd700'];
        
        for (let i = 0; i < 50; i++) {
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

    updateScenarios(totals) {
        const scenariosContent = document.getElementById('scenarios-content');
        if (!scenariosContent) return;
        
        if (this.champion) {
            scenariosContent.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
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
        
        let scenarios = '<div style="display: grid; gap: 1rem;">';
        
        if (totals.ppc.encuentros === totals.ies.encuentros) {
            scenarios += `
                <div style="padding: 1rem; background: #ffe6e6; border-radius: 8px;">
                    <h4>🔴 PPC necesita:</h4>
                    <ul>
                        <li>Ganar el encuentro de vuelta para forzar desempate</li>
                        <li>Ventaja actual en partidos: ${totals.ppc.partidos - totals.ies.partidos}</li>
                    </ul>
                </div>
                <div style="padding: 1rem; background: #e6ffe6; border-radius: 8px;">
                    <h4>🟢 IES necesita:</h4>
                    <ul>
                        <li>Empatar o ganar mantiene la ventaja de la ida</li>
                        <li>Ventaja actual en partidos: ${totals.ies.partidos - totals.ppc.partidos}</li>
                    </ul>
                </div>
            `;
        } else {
            scenarios += `
                <p><strong>Estado actual:</strong></p>
                <p>PPC: ${totals.ppc.encuentros} encuentros</p>
                <p>IES: ${totals.ies.encuentros} encuentros</p>
                <p>Partidos restantes: ${remainingMatches}</p>
            `;
        }
        
        scenarios += '</div>';
        scenariosContent.innerHTML = scenarios;
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.theme);
        
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        console.log(`🎨 Tema cambiado a: ${this.theme}`);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('sound-toggle');
        const soundIcon = soundBtn?.querySelector('i');
        
        if (this.soundEnabled) {
            soundBtn?.classList.add('active');
            if (soundIcon) soundIcon.className = 'fas fa-volume-up';
        } else {
            soundBtn?.classList.remove('active');
            if (soundIcon) soundIcon.className = 'fas fa-volume-mute';
        }
        
        console.log(`🔊 Sonido: ${this.soundEnabled ? 'activado' : 'desactivado'}`);
    }
}

// Inicializar la aplicación de forma segura
document.addEventListener('DOMContentLoaded', () => {
    try {
        const calculator = new BadmintonCalculator();
        window.calculator = calculator; // Para debugging
        console.log('✅ Calculadora de bádminton iniciada correctamente');
    } catch (error) {
        console.error('❌ Error al iniciar la calculadora:', error);
        
        // Ocultar loading screen en caso de error
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Mostrar mensaje de error al usuario
        document.body.innerHTML += `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        text-align: center; z-index: 10000;">
                <h2>❌ Error al cargar la aplicación</h2>
                <p>Por favor, recarga la página o verifica la consola del navegador (F12).</p>
                <button onclick="location.reload()" style="padding: 1rem 2rem; margin-top: 1rem; 
                        background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Recargar Página
                </button>
            </div>
        `;
    }
});
