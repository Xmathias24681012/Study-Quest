// --- 1. Constantes e Estrutura de Dados ---

const XP_TO_LEVEL_UP = 500;
const XP_PER_TASK = 100;
const GOLD_PER_TASK = 50;
const WORLDS = 3; 

let playerProfile = {
    name: "Herói",
    class: "Aprendiz",
    level: 1,
    xp: 0,
    gold: 0,
    tasksCompleted: 0,
    achievements: [],
    // Matérias iniciais + as que o usuário criar
    subjects: ["Código", "Matemática", "História", "Geral"],
    activeTasks: [
        { id: 1, description: "Revisar JS Básico", subject: "Código" },
        { id: 2, description: "Resolver 5 Equações", subject: "Matemática" }
    ]
};

const availableAchievements = [
    { id: 'first_quest', requirement: 1, name: 'Primeira Missão', message: 'Você deu o primeiro passo! A jornada é longa, mas gratificante.' },
    { id: 'apprentice', requirement: 5, name: 'Aprendiz Dedicado', message: 'Cinco missões! Sua dedicação é notável, continue assim.' },
    { id: 'journeyman', requirement: 10, name: 'Viajante do Conhecimento', message: 'Dez tarefas concluídas! Você é um verdadeiro viajante.' },
    { id: 'level_5', requirement_level: 5, name: 'Mundo Novo Desbloqueado', message: 'Nível 5 alcançado! O mundo de estudo se expandiu. Veja a nova paisagem!' },
];

// --- 2. Persistência e Controle de Menu ---

function loadProfile() {
    const savedProfile = localStorage.getItem('studyQuestProfile');
    if (savedProfile) {
        const loadedData = JSON.parse(savedProfile);
        playerProfile = { ...playerProfile, ...loadedData };
        if (!Array.isArray(playerProfile.activeTasks)) playerProfile.activeTasks = [];
        if (!Array.isArray(playerProfile.subjects) || playerProfile.subjects.length === 0) {
             playerProfile.subjects = ["Código", "Matemática", "História", "Geral"];
        }
    }
}

function saveProfile() {
    localStorage.setItem('studyQuestProfile', JSON.stringify(playerProfile));
}

/**
 * NOVO: Alterna a visibilidade do menu lateral.
 */
function toggleMenu() {
    document.getElementById('tools-menu').classList.toggle('active');
    // Chama a renderização da lista de matérias sempre que abre o menu
    if (document.getElementById('tools-menu').classList.contains('active')) {
        updateSubjectManagerDOM();
    }
}


// --- 3. Lógica de Jogo (Game Logic) ---

function setNPCMessage(message) {
    document.getElementById('npc-message').innerHTML = `<p>${message}</p>`;
}

function checkLevelUp() {
    let leveledUp = false;
    while (playerProfile.xp >= XP_TO_LEVEL_UP) {
        playerProfile.level++;
        playerProfile.xp -= XP_TO_LEVEL_UP;
        setNPCMessage(`🎉 NÍVEL ${playerProfile.level} ALCANÇADO! Sua força intelectual aumentou!`);
        leveledUp = true;
    }
    return leveledUp;
}

function checkAchievements() {
    availableAchievements.forEach(achievement => {
        const isUnlocked = playerProfile.achievements.some(a => a.id === achievement.id);
        let requirementMet = false;

        if (achievement.requirement && playerProfile.tasksCompleted >= achievement.requirement) requirementMet = true;
        if (achievement.requirement_level && playerProfile.level >= achievement.requirement_level) requirementMet = true;

        if (!isUnlocked && requirementMet) {
            playerProfile.achievements.push(achievement);
            setNPCMessage(`🏆 CONQUISTA DESBLOQUEADA: "${achievement.name}"! ${achievement.message}`);
        }
    });
}

function completeTask(taskId = null) {
    // 1. Recompensas
    playerProfile.xp += XP_PER_TASK;
    playerProfile.gold += GOLD_PER_TASK;
    playerProfile.tasksCompleted++;
    setNPCMessage(`Missão concluída! Você ganhou ${XP_PER_TASK} XP e ${GOLD_PER_TASK} Ouro.`);

    // 2. Remove a tarefa ativa, se for com ID
    if (taskId !== null) {
        playerProfile.activeTasks = playerProfile.activeTasks.filter(t => t.id !== taskId);
    }

    // 3. Lógica
    checkLevelUp();
    checkAchievements();

    // 4. Atualiza tudo
    saveProfile();
    updateDOM();
}


// --- 4. Funções de Gestão (Perfil, Matérias e Tarefas) ---

/**
 * NOVO: Adiciona uma nova matéria à lista.
 */
function addSubject() {
    const input = document.getElementById('new-subject-input');
    const newSubject = input.value.trim();

    if (newSubject && !playerProfile.subjects.includes(newSubject)) {
        playerProfile.subjects.push(newSubject);
        input.value = '';
        setNPCMessage(`Nova matéria "${newSubject}" adicionada ao seu grimório!`);
        saveProfile();
        updateSubjectSelectDOM(); // Atualiza dropdown de criação de tarefas
        updateSubjectManagerDOM(); // Atualiza lista de gerenciamento
    } else if (playerProfile.subjects.includes(newSubject)) {
        setNPCMessage("Guardião: Essa matéria já existe, Herói!");
    }
}

/**
 * NOVO: Remove uma matéria da lista.
 * Garante que a matéria "Geral" não possa ser removida.
 */
function removeSubject(subjectToRemove) {
    if (subjectToRemove === "Geral") {
        setNPCMessage("Guardião: A matéria 'Geral' é essencial e não pode ser removida!");
        return;
    }
    
    // Filtra e remove a matéria
    playerProfile.subjects = playerProfile.subjects.filter(s => s !== subjectToRemove);
    
    // Move tarefas da matéria removida para 'Geral'
    playerProfile.activeTasks.forEach(task => {
        if (task.subject === subjectToRemove) {
            task.subject = "Geral";
        }
    });

    setNPCMessage(`Matéria "${subjectToRemove}" removida. Missões realocadas para 'Geral'.`);
    saveProfile();
    updateSubjectSelectDOM();
    updateSubjectManagerDOM();
    updateTaskListDOM();
}

/**
 * Adiciona uma nova tarefa com matéria selecionada.
 */
function addTask() {
    const input = document.getElementById('new-task-input');
    const select = document.getElementById('new-task-subject');
    const description = input.value.trim();
    const subject = select.value;

    if (description) {
        const newId = Date.now();
        playerProfile.activeTasks.push({ id: newId, description: description, subject: subject });
        input.value = ''; 
        setNPCMessage(`Nova missão registrada em ${subject}.`);
        saveProfile();
        updateTaskListDOM();
    } else {
        setNPCMessage("Guardião: A missão precisa de uma descrição, Herói!");
    }
}

function updateProfile() {
    const nameInput = document.getElementById('input-name').value.trim();
    const classSelect = document.getElementById('select-class').value;

    if (nameInput) {
        playerProfile.name = nameInput;
        document.getElementById('input-name').value = ''; 
    }
    
    playerProfile.class = classSelect;

    saveProfile();
    updateDOM();
    setNPCMessage(`Perfil atualizado! Você agora é um(a) ${playerProfile.class}.`);
}


// --- 5. Atualizações de Interface (DOM) ---

/**
 * NOVO: Renderiza a lista de matérias no painel de gerenciamento.
 */
function updateSubjectManagerDOM() {
    const list = document.getElementById('subject-list-manager');
    list.innerHTML = '';
    
    playerProfile.subjects.forEach(subject => {
        const li = document.createElement('li');
        li.className = 'subject-item';
        li.innerHTML = `
            <span>${subject}</span>
            <button class="game-button remove-btn" onclick="removeSubject('${subject}')">
                Remover
            </button>
        `;
        list.appendChild(li);
    });
}

/**
 * NOVO: Popula a dropdown de seleção de matéria para criação de tarefas.
 */
function updateSubjectSelectDOM() {
    const select = document.getElementById('new-task-subject');
    select.innerHTML = ''; // Limpa opções existentes

    playerProfile.subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        select.appendChild(option);
    });
}

/**
 * Renderiza a lista de tarefas, agrupando por matéria.
 */
function updateTaskListDOM() {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = ''; 

    if (playerProfile.activeTasks.length === 0) {
        tasksList.innerHTML = '<p class="achievement-placeholder">Nenhuma missão ativa. Crie uma no menu "Ferramentas".</p>';
        return;
    }

    // Agrupa tarefas por matéria
    const tasksBySubject = playerProfile.activeTasks.reduce((acc, task) => {
        const subject = task.subject || 'Geral'; 
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(task);
        return acc;
    }, {});

    // Renderiza cada grupo de matéria
    for (const subject of playerProfile.subjects) { // Itera na ordem das matérias
        const tasks = tasksBySubject[subject];
        if (tasks && tasks.length > 0) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'subject-group';
            groupDiv.innerHTML = `<h3>${subject} (${tasks.length})</h3>`;

            tasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                taskItem.innerHTML = `
                    <p>${task.description}</p>
                    <button class="game-button small-button" onclick="completeTask(${task.id})">
                        Concluir
                    </button>
                `;
                groupDiv.appendChild(taskItem);
            });

            tasksList.appendChild(groupDiv);
        }
    }
}

/**
 * Muda o fundo da página (simula a mudança de "Mundo").
 */
function changeWorldBackground() {
    const body = document.getElementById('game-body');
    const currentWorld = Math.floor((playerProfile.level - 1) / 5) + 1; 
    
    const worldClassIndex = (currentWorld % WORLDS) || WORLDS; 
    const worldClass = `world-${worldClassIndex}`;
    
    body.className = ''; 
    body.classList.add(worldClass);
}

/**
 * Função mestre para atualizar todo o estado visual.
 */
function updateDOM() {
    const { name, level, xp, gold, class: playerClass, achievements } = playerProfile;

    // Atualiza Informações de status
    document.getElementById('player-name').textContent = name;
    document.getElementById('player-level').textContent = level;
    document.getElementById('player-gold').textContent = `${gold} G`;
    document.getElementById('player-class').textContent = playerClass;

    // Atualiza Barra de XP
    const progressPercent = (xp / XP_TO_LEVEL_UP) * 100;
    document.getElementById('xp-bar').style.width = `${progressPercent}%`;
    document.getElementById('xp-text').textContent = `${xp} / ${XP_TO_LEVEL_UP} XP`;

    // Atualiza o fundo
    changeWorldBackground(); 
    
    // Atualiza listas (Tarefas e Conquistas)
    updateTaskListDOM();
    updateSubjectSelectDOM(); // Garante que a dropdown de criação de tarefas esteja atualizada
    
    // Atualiza lista de conquistas (mantido simples)
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = achievements.map(a => 
        `<li class="achievement-item"><strong>${a.name}</strong></li>`
    ).join('') || '<li class="achievement-placeholder">Nenhuma conquista ainda.</li>';
}


// --- 6. Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    loadProfile(); 
    updateDOM();   
    setNPCMessage(`Boas-vindas, ${playerProfile.name}! Sua classe é ${playerProfile.class}. Clique em "Ferramentas" para começar!`);
});