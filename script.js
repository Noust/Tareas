// Estado de la aplicación
let tasks = [];
let currentDate = new Date();
let selectedDate = null;
let currentFilter = 'all';

// Variables para manejo inteligente de guardado
let lastSavedTasksHash = '';
let hasUnsavedChanges = false;
let isCurrentlySaving = false;

// Elementos del DOM
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const noDateTask = document.getElementById('noDateTask');
const recurringTask = document.getElementById('recurringTask');
const recurringOptions = document.getElementById('recurringOptions');
const recurringType = document.getElementById('recurringType');
const recurringDays = document.getElementById('recurringDays');
const recurringMonthlyDays = document.getElementById('recurringMonthlyDays');
const hasTimeReminder = document.getElementById('hasTimeReminder');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn = document.getElementById('addTaskBtn');
const datedTasksList = document.getElementById('datedTasksList');
const datedTasksCount = document.getElementById('datedTasksCount');
const datedTasksSection = document.querySelector('.dated-tasks-section');
const noDateTasksList = document.getElementById('noDateTasksList');
const noDateTasksCount = document.getElementById('noDateTasksCount');
const noDateTasksSection = document.querySelector('.no-date-tasks-section');
const recurringTasksList = document.getElementById('recurringTasksList');
const recurringTasksCount = document.getElementById('recurringTasksCount');
const recurringTasksSection = document.querySelector('.recurring-tasks-section');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksSpan = document.getElementById('totalTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const calendarGrid = document.querySelector('.calendar-grid');
const currentMonthSpan = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDateTitle = document.getElementById('selectedDateTitle');
const selectedDateTasksList = document.getElementById('selectedDateTasksList');

// Nombres de los meses
const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    cleanupPastRecurringInstances(); // Limpiar instancias de tareas recurrentes pasadas
    setTodayAsDefault();
    generateRecurringTasks(); // Generar instancias para hoy
    renderAllTasks();
    initializeCollapsible(); // Inicializar funcionalidad de colapso
    ensureMobileSectionsVisible(); // Asegurar que las secciones estén visibles en móviles
});

// Event Listeners
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Event listener para el checkbox de sin fecha
noDateTask.addEventListener('change', function() {
    taskDate.disabled = this.checked;
    taskTime.disabled = this.checked;
    if (this.checked) {
        taskDate.value = '';
        taskTime.value = '';
        recurringTask.checked = false;
        recurringOptions.style.display = 'none';
    } else {
        setTodayAsDefault();
    }
});

// Event listener para el checkbox de tarea recurrente
recurringTask.addEventListener('change', function() {
    if (this.checked) {
        recurringOptions.style.display = 'block';
        noDateTask.checked = false;
        taskDate.disabled = false;
        taskTime.disabled = false;
        if (!taskDate.value) {
            setTodayAsDefault();
        }
    } else {
        recurringOptions.style.display = 'none';
    }
});

// Event listener para el tipo de recurrencia
recurringType.addEventListener('change', function() {
    if (this.value === 'custom') {
        recurringDays.style.display = 'block';
        recurringMonthlyDays.style.display = 'none';
    } else if (this.value === 'monthly') {
        recurringDays.style.display = 'none';
        recurringMonthlyDays.style.display = 'block';
    } else {
        recurringDays.style.display = 'none';
        recurringMonthlyDays.style.display = 'none';
    }
});

// Event listener para el recordatorio con hora
hasTimeReminder.addEventListener('change', function() {
    if (this.checked && !taskTime.value) {
        taskTime.value = '09:00'; // Hora por defecto
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderAllTasks();
    });
});

prevMonthBtn.addEventListener('click', function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
});

nextMonthBtn.addEventListener('click', function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
});

// Event listeners para respaldo
document.getElementById('exportBtn').addEventListener('click', exportTasks);
document.getElementById('importBtn').addEventListener('click', function() {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        importTasks(file);
        // Limpiar el input para permitir seleccionar el mismo archivo otra vez
        e.target.value = '';
    }
});

// Event listener para cambios de tamaño de ventana (solo para generar calendario)
window.addEventListener('resize', function() {
    // Solo regenerar el calendario en resize, no forzar expansión de secciones
    generateCalendar();
});

// Funciones principales
function setTodayAsDefault() {
    const today = new Date();
    const todayString = formatDateToString(today);
    taskDate.value = todayString;
    selectedDate = todayString;
    updateSelectedDateTasks();
}

function addTask() {
    const text = taskInput.value.trim();
    const date = noDateTask.checked ? null : taskDate.value;
    const time = taskTime.value;
    const priority = taskPriority.value;
    const isRecurring = recurringTask.checked;
    
    if (!text) {
        alert('Por favor, escribe una tarea');
        return;
    }
    
    if (!noDateTask.checked && !isRecurring && !date) {
        alert('Por favor, selecciona una fecha o marca "Sin fecha específica"');
        return;
    }
    
    // Para tareas recurrentes, validar configuración
    if (isRecurring) {
        if (recurringType.value === 'custom') {
            const selectedDays = Array.from(recurringDays.querySelectorAll('input[type="checkbox"]:checked'));
            if (selectedDays.length === 0) {
                alert('Por favor, selecciona al menos un día de la semana para la tarea recurrente');
                return;
            }
        } else if (recurringType.value === 'monthly') {
            const selectedMonthlyDays = Array.from(recurringMonthlyDays.querySelectorAll('input[type="checkbox"]:checked'));
            if (selectedMonthlyDays.length === 0) {
                alert('Por favor, selecciona al menos un día del mes para la tarea recurrente');
                return;
            }
        }
    }
    
    const task = {
        id: Date.now().toString(),
        text: text,
        date: date,
        time: time,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString(),
        hasNoDate: noDateTask.checked,
        isRecurring: isRecurring,
        recurringConfig: isRecurring ? {
            type: recurringType.value,
            days: recurringType.value === 'custom' ? 
                Array.from(recurringDays.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value)) :
                null,
            monthlyDays: recurringType.value === 'monthly' ? 
                Array.from(recurringMonthlyDays.querySelectorAll('input[type="checkbox"]:checked')).map(cb => parseInt(cb.value)) :
                null,
            hasTimeReminder: hasTimeReminder.checked
        } : null
    };
    
    tasks.push(task);
    
    // Si es recurrente, generar instancias para los próximos días
    if (isRecurring) {
        generateRecurringTaskInstances(task);
    }
    
    onTasksChanged(true);
    renderAllTasks();
    
    // Limpiar formulario
    taskInput.value = '';
    taskTime.value = '';
    noDateTask.checked = false;
    recurringTask.checked = false;
    recurringOptions.style.display = 'none';
    recurringType.value = 'daily';
    recurringDays.style.display = 'none';
    recurringMonthlyDays.style.display = 'none';
    hasTimeReminder.checked = false;
    taskDate.disabled = false;
    taskTime.disabled = false;
    // Limpiar días seleccionados
    recurringDays.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    recurringMonthlyDays.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    if (!taskDate.value) {
        setTodayAsDefault();
    }
    taskInput.focus();
}

function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        // Si es una tarea recurrente, también eliminar sus instancias
        const task = tasks.find(t => t.id === id);
        if (task && task.isRecurring) {
            tasks = tasks.filter(t => t.id !== id && t.parentRecurringId !== id);
        } else {
            tasks = tasks.filter(t => t.id !== id);
        }
        
        onTasksChanged(true);
        renderAllTasks();
    }
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        onTasksChanged(); // Usar delay para toggle (puede hacerse múltiples veces rápido)
        renderAllTasks();
    }
}

function renderAllTasks() {
    renderDatedTasks();
    renderNoDateTasks();
    renderRecurringTasks();
    updateTaskStats();
    generateCalendar();
    updateSelectedDateTasks();
}

function renderDatedTasks() {
    // Filtrar tareas con fecha que no sean sin fecha específica, que no sean templates de recurrentes ni instancias de recurrentes
    let filteredTasks = tasks.filter(task => task.date && !task.hasNoDate && !task.isRecurring && !task.isRecurringInstance);
    
    switch (currentFilter) {
        case 'pending':
            filteredTasks = filteredTasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
        case 'no-date':
            filteredTasks = []; // Para el filtro "sin fecha", no mostramos nada en la lista de tareas con fecha
            break;
        case 'recurring':
            filteredTasks = []; // Para el filtro "recurrentes", no mostramos nada en la lista de tareas con fecha
            break;
        case 'urgent':
            filteredTasks = filteredTasks.filter(task => task.priority === 'urgent');
            break;
        case 'high':
            filteredTasks = filteredTasks.filter(task => task.priority === 'high');
            break;
        case 'medium':
            filteredTasks = filteredTasks.filter(task => task.priority === 'medium');
            break;
        case 'low':
            filteredTasks = filteredTasks.filter(task => task.priority === 'low');
            break;
        default:
            // Para "all", mostramos solo las tareas con fecha
            break;
    }
    
    // Ordenar por prioridad primero, luego por fecha y luego por hora de creación
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    filteredTasks.sort((a, b) => {
        // Primero por prioridad
        const priorityA = priorityOrder[a.priority || 'medium'];
        const priorityB = priorityOrder[b.priority || 'medium'];
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // Luego por fecha
        if (a.date !== b.date) {
            return new Date(a.date) - new Date(b.date);
        }
        
        // Finalmente por hora de creación
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    // Actualizar contador
    datedTasksCount.textContent = filteredTasks.length;
    
    // Siempre mostrar la sección
    datedTasksSection.classList.remove('empty');
    
    // Manejar colapso automático según contenido
    autoCollapseSection('dated-tasks', filteredTasks.length === 0);
    
    datedTasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        const filterText = currentFilter === 'all' ? 'No tienes tareas con fecha específica aún. ¡Agrega tu primera tarea!' : 
                          currentFilter === 'pending' ? 'No tienes tareas con fecha pendientes. ¡Buen trabajo!' : 
                          currentFilter === 'completed' ? 'No tienes tareas con fecha completadas aún.' :
                          `No tienes tareas con fecha con prioridad ${getPriorityLabel(currentFilter)}.`;
        
        datedTasksList.innerHTML = `
            <li class="no-tasks">
                <p style="text-align: center; color: #71717a; padding: 2rem; font-weight: 400;">
                    ${filterText}
                </p>
            </li>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const priority = task.priority || 'medium';
        const li = document.createElement('li');
        li.className = `task-item priority-${priority} ${task.completed ? 'completed' : ''}`;
        
        const timeInfo = task.time ? `<div class="task-time"><i class="fas fa-clock"></i> ${task.time}</div>` : '';
        const recurringInfo = task.isRecurringInstance ? 
            `<div class="task-recurring-info"><i class="fas fa-repeat"></i> Tarea recurrente</div>` : '';
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-date">${formatDate(task.date)}</div>
                ${timeInfo}
                ${recurringInfo}
                <div class="task-priority-indicator">${getPriorityLabel(priority)}</div>
            </div>
            <div class="task-actions">
                <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Eliminar tarea">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        datedTasksList.appendChild(li);
    });
}

function renderNoDateTasks() {
    let noDateTasks = tasks.filter(task => (!task.date || task.hasNoDate) && !task.isRecurring);
    
    switch (currentFilter) {
        case 'pending':
            noDateTasks = noDateTasks.filter(task => !task.completed);
            break;
        case 'completed':
            noDateTasks = noDateTasks.filter(task => task.completed);
            break;
        case 'no-date':
            // Para el filtro "sin fecha", mostramos todas las tareas sin fecha
            break;
        case 'urgent':
            noDateTasks = noDateTasks.filter(task => task.priority === 'urgent');
            break;
        case 'high':
            noDateTasks = noDateTasks.filter(task => task.priority === 'high');
            break;
        case 'medium':
            noDateTasks = noDateTasks.filter(task => task.priority === 'medium');
            break;
        case 'low':
            noDateTasks = noDateTasks.filter(task => task.priority === 'low');
            break;
        default:
            // Para "all", mostramos todas las tareas sin fecha
            break;
    }
    
    // Ordenar por prioridad y fecha de creación
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    noDateTasks.sort((a, b) => {
        const priorityA = priorityOrder[a.priority || 'medium'];
        const priorityB = priorityOrder[b.priority || 'medium'];
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    // Actualizar contador
    noDateTasksCount.textContent = noDateTasks.length;
    
    // Siempre mostrar la sección
    noDateTasksSection.classList.remove('empty');
    
    // Manejar colapso automático según contenido
    autoCollapseSection('no-date-tasks', noDateTasks.length === 0);
    
    noDateTasksList.innerHTML = '';
    
    if (noDateTasks.length === 0) {
        const filterText = currentFilter === 'all' ? 'No tienes tareas sin fecha específica aún. ¡Agrega tu primera tarea!' : 
                          currentFilter === 'pending' ? 'No tienes tareas sin fecha pendientes. ¡Buen trabajo!' : 
                          currentFilter === 'completed' ? 'No tienes tareas sin fecha completadas aún.' :
                          currentFilter === 'no-date' ? 'No tienes tareas sin fecha específica.' :
                          `No tienes tareas sin fecha con prioridad ${getPriorityLabel(currentFilter)}.`;
        
        noDateTasksList.innerHTML = `
            <li class="no-tasks">
                <p style="text-align: center; color: #71717a; padding: 2rem; font-weight: 400;">
                    ${filterText}
                </p>
            </li>
        `;
        return;
    }
    
    noDateTasks.forEach(task => {
        const priority = task.priority || 'medium';
        const li = document.createElement('li');
        li.className = `task-item priority-${priority} ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-date">Sin fecha específica</div>
                <div class="task-priority-indicator">${getPriorityLabel(priority)}</div>
            </div>
            <div class="task-actions">
                <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Eliminar tarea">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        noDateTasksList.appendChild(li);
    });
}

function updateTaskStats() {
    // Contar solo las tareas principales (no instancias de recurrentes)
    const mainTasks = tasks.filter(task => !task.isRecurringInstance);
    const total = mainTasks.length;
    const pending = mainTasks.filter(task => !task.completed).length;
    const completed = mainTasks.filter(task => task.completed).length;
    
    totalTasksSpan.textContent = `${total} tarea${total !== 1 ? 's' : ''} total${total !== 1 ? 'es' : ''}`;
    pendingTasksSpan.textContent = `${pending} pendiente${pending !== 1 ? 's' : ''}`;
    completedTasksSpan.textContent = `${completed} completada${completed !== 1 ? 's' : ''}`;
    updateClearButton();
}

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthSpan.textContent = `${monthNames[month]} ${year}`;
    
    // Limpiar días anteriores (excepto headers)
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(el => el.remove());
    
    // Primer día del mes y último día del mes anterior
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, true, year, month - 1);
        calendarGrid.appendChild(dayElement);
    }
    
    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = year === today.getFullYear() && 
                       month === today.getMonth() && 
                       day === today.getDate();
        const dayElement = createDayElement(day, false, year, month, isToday);
        calendarGrid.appendChild(dayElement);
    }
    
    // Días del próximo mes
    const totalCells = calendarGrid.children.length - 7; // Restar headers
    const remainingCells = 42 - totalCells; // 6 filas x 7 días = 42
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true, year, month + 1);
        calendarGrid.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth, year, month, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    // Crear fecha string para comparar
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Verificar si hay tareas en esta fecha (excluyendo las tareas recurrentes plantilla)
    const tasksOnDate = tasks.filter(task => 
        task.date === dateString && 
        !task.isRecurring // Excluir las tareas recurrentes plantilla
    );
    
    // También verificar si hay tareas recurrentes que deberían aparecer en esta fecha
    const recurringTasksForDate = getRecurringTasksForDate(dateString);
    
    if (tasksOnDate.length > 0 || recurringTasksForDate.length > 0) {
        dayElement.classList.add('has-tasks');
    }
    
    // Marcar como seleccionado si es la fecha seleccionada
    if (selectedDate === dateString) {
        dayElement.classList.add('selected');
    }
    
    // Event listener para seleccionar fecha
    dayElement.addEventListener('click', function() {
        // Remover selección anterior
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Seleccionar nueva fecha
        this.classList.add('selected');
        selectedDate = dateString;
        updateSelectedDateTasks();
        
        // Actualizar el input de fecha
        taskDate.value = dateString;
    });
    
    return dayElement;
}

function updateSelectedDateTasks() {
    if (!selectedDate) {
        selectedDateTitle.textContent = 'Selecciona una fecha';
        selectedDateTasksList.innerHTML = '';
        return;
    }
    
    const date = new Date(selectedDate + 'T00:00:00');
    selectedDateTitle.textContent = `Tareas para ${formatDate(selectedDate)}`;
    
    // Filtrar tareas para esta fecha, excluyendo las tareas recurrentes plantilla
    const tasksForDate = tasks.filter(task => 
        task.date === selectedDate && 
        !task.isRecurring // Excluir las tareas recurrentes plantilla
    );
    
    // También obtener tareas recurrentes para esta fecha
    const recurringTasksForDate = getRecurringTasksForDate(selectedDate);
    
    // Combinar todas las tareas
    const allTasksForDate = [...tasksForDate, ...recurringTasksForDate];
    
    // Ordenar por prioridad
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    allTasksForDate.sort((a, b) => {
        const priorityA = priorityOrder[a.priority || 'medium'];
        const priorityB = priorityOrder[b.priority || 'medium'];
        return priorityA - priorityB;
    });
    
    selectedDateTasksList.innerHTML = '';
    
    if (allTasksForDate.length === 0) {
        selectedDateTasksList.innerHTML = '<li style="text-align: center; color: #71717a; padding: 1rem; font-weight: 400;">No hay tareas para esta fecha</li>';
        return;
    }
    
    allTasksForDate.forEach(task => {
        const priority = task.priority || 'medium';
        const priorityEmoji = {
            urgent: '🔴',
            high: '🟠', 
            medium: '🟡',
            low: '🟢'
        };
        
        const li = document.createElement('li');
        li.style.textDecoration = task.completed ? 'line-through' : 'none';
        li.style.opacity = task.completed ? '0.7' : '1';
        li.style.cursor = 'pointer';
        li.style.padding = '0.5rem';
        li.style.borderRadius = '6px';
        li.style.transition = 'background-color 0.2s ease';
        
        // Agregar indicador para tareas recurrentes
        const recurringIndicator = task.isFromRecurring ? 
            '<i class="fas fa-repeat" style="margin-right: 0.25rem; color: #a78bfa; font-size: 0.8rem;" title="Tarea recurrente"></i>' : '';
        
        const timeIndicator = task.time ? 
            `<span style="margin-left: 0.5rem; font-size: 0.8rem; color: #a1a1aa;"><i class="fas fa-clock" style="margin-right: 0.25rem;"></i>${task.time}</span>` : '';
        
        li.innerHTML = `
            <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}" 
               style="margin-right: 0.5rem; color: ${task.completed ? '#10b981' : '#ffffff'}; opacity: ${task.completed ? '1' : '0.7'}; transition: color 0.2s ease;"></i>
            <span style="margin-right: 0.5rem;">${priorityEmoji[priority]}</span>
            ${recurringIndicator}${escapeHtml(task.text)}${timeIndicator}
        `;
        
        // Agregar efectos de hover
        li.addEventListener('mouseenter', function() {
            if (!task.completed) {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
        });
        
        li.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        // Agregar funcionalidad para marcar como completada
        li.addEventListener('click', function() {
            toggleTaskFromCalendar(task, selectedDate);
        });
        
        selectedDateTasksList.appendChild(li);
    });
}

// Funciones auxiliares
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    
    // Normalizar las fechas para evitar problemas de zona horaria
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowString = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    if (dateString === todayString) {
        return 'Hoy';
    } else if (dateString === tomorrowString) {
        return 'Mañana';
    } else if (dateString === yesterdayString) {
        return 'Ayer';
    } else {
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para formatear fecha evitando problemas de zona horaria
function formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Almacenamiento local mejorado
function saveTasks(forceShow = false) {
    // Si ya se está guardando, evitar guardados múltiples
    if (isCurrentlySaving) {
        return;
    }
    
    // Verificar si realmente hay cambios
    if (!hasTasksChanged() && !forceShow) {
        return;
    }
    
    isCurrentlySaving = true;
    
    try {
        const tasksData = {
            tasks: tasks,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        const currentDataString = JSON.stringify(tasksData);
        const existingDataString = localStorage.getItem('todoTasks');
        
        // Solo guardar si los datos son diferentes
        if (currentDataString !== existingDataString) {
            localStorage.setItem('todoTasks', currentDataString);
            
            // Respaldo adicional
            localStorage.setItem('todoTasksBackup', currentDataString);
            
            // Marcar como guardado
            markTasksAsSaved();
        } else {
            // Los datos en localStorage ya están actualizados
            markTasksAsSaved();
        }
        
    } catch (error) {
        console.error('Error al guardar tareas:', error);
        
        // Intentar con sessionStorage como respaldo
        try {
            const tasksData = {
                tasks: tasks,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };
            sessionStorage.setItem('todoTasks', JSON.stringify(tasksData));
            markTasksAsSaved();
        } catch (sessionError) {
            console.error('Error al guardar en sessionStorage:', sessionError);
            
            // Mostrar alerta solo si es crítico
            setTimeout(() => {
                alert('No se pudieron guardar las tareas. Es posible que tengas poco espacio de almacenamiento.');
            }, 100);
        }
    } finally {
        isCurrentlySaving = false;
    }
}

function loadTasks() {
    try {
        // Intentar cargar desde localStorage
        let storedData = localStorage.getItem('todoTasks');
        
        if (!storedData) {
            // Si no existe, intentar cargar desde el respaldo
            storedData = localStorage.getItem('todoTasksBackup');
        }
        
        if (!storedData) {
            // Último intento desde sessionStorage
            storedData = sessionStorage.getItem('todoTasks');
        }
        
        if (storedData) {
            const data = JSON.parse(storedData);
            
            // Verificar si es el formato nuevo con metadatos
            if (data.tasks && Array.isArray(data.tasks)) {
                tasks = data.tasks;
            } else if (Array.isArray(data)) {  
                // Formato antiguo - migrar
                tasks = data;
                saveTasks(); // Guardar en nuevo formato
            }
            
            // Validar que todas las tareas tengan los campos necesarios
            tasks = tasks.filter(task => task && task.id && task.text);
            
            // Asegurar que todas las tareas tengan prioridad
            tasks = tasks.map(task => {
                if (!task.priority) {
                    task.priority = 'medium';
                }
                return task;
            });
            
            // Actualizar IDs si es necesario (por si hay duplicados)
            const seenIds = new Set();
            tasks = tasks.map(task => {
                if (seenIds.has(task.id)) {
                    task.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                }
                seenIds.add(task.id);
                return task;
            });
            
            // Inicializar el hash después de cargar las tareas
            lastSavedTasksHash = generateTasksHash();
            hasUnsavedChanges = false;
        }
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        tasks = [];
        // Inicializar hash para lista vacía
        lastSavedTasksHash = generateTasksHash();
        hasUnsavedChanges = false;
        alert('Hubo un problema al cargar tus tareas guardadas. Se iniciará con una lista vacía.');
    }
}

// Función para exportar tareas (respaldo manual)
function exportTasks() {
    try {
        const tasksData = {
            tasks: tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(tasksData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `tareas-backup-${formatDateToString(new Date())}.json`;
        link.click();
    } catch (error) {
        console.error('Error al exportar tareas:', error);
        alert('Error al exportar las tareas');
    }
}

// Función para importar tareas
function importTasks(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.tasks && Array.isArray(data.tasks)) {
                if (confirm(`¿Deseas importar ${data.tasks.length} tareas? Esto reemplazará tus tareas actuales.`)) {
                    tasks = data.tasks;
                    saveTasks(true); // Forzar guardado y mostrar confirmación
                    renderAllTasks();
                    alert('Tareas importadas correctamente');
                }
            } else {
                alert('El archivo no tiene el formato correcto');
            }
        } catch (error) {
            console.error('Error al importar tareas:', error);
            alert('Error al leer el archivo de respaldo');
        }
    };
    reader.readAsText(file);
}

// Función para limpiar tareas completadas
function clearCompletedTasks() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las tareas completadas?')) {
        tasks = tasks.filter(task => !task.completed);
        onTasksChanged(true); // Guardar inmediatamente al limpiar tareas completadas
        renderAllTasks();
    }
}

// Agregar botón para limpiar tareas completadas
function updateClearButton() {
    const completedTasks = tasks.filter(task => task.completed);
    const existingBtn = document.getElementById('clearCompletedBtn');
    
    if (completedTasks.length > 0 && !existingBtn) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearCompletedBtn';
        clearBtn.innerHTML = '<i class="fas fa-broom"></i> Limpiar completadas';
        clearBtn.style.cssText = `
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 400;
            cursor: pointer;
            margin-top: 1rem;
            transition: all 0.2s ease;
        `;
        clearBtn.addEventListener('click', clearCompletedTasks);
        clearBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(239, 68, 68, 0.25)';
            this.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        });
        clearBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(239, 68, 68, 0.15)';
            this.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        });
        
        document.querySelector('.task-stats').appendChild(clearBtn);
    } else if (completedTasks.length === 0 && existingBtn) {
        existingBtn.remove();
    }
}

// Funciones de teclado
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        addTask();
    }
    if (e.key === 'Escape' && document.activeElement === taskInput) {
        taskInput.value = '';
    }
});

// Función para monitorear la salud del almacenamiento
function checkStorageHealth() {
    try {
        const testKey = 'storage-test';
        const testValue = 'test';
        localStorage.setItem(testKey, testValue);
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn('Problema con localStorage:', error);
        return false;
    }
}

// Función para obtener información del almacenamiento
function getStorageInfo() {
    if (!localStorage) return null;
    
    try {
        const used = JSON.stringify(localStorage).length;
        const tasksData = localStorage.getItem('todoTasks');
        const tasksSize = tasksData ? tasksData.length : 0;
        
        return {
            totalUsed: used,
            tasksSize: tasksSize,
            tasksCount: tasks.length
        };
    } catch (error) {
        console.error('Error al obtener información del almacenamiento:', error);
        return null;
    }
}

// Auto-guardar mejorado
let autoSaveInterval;
let lastSaveTime = Date.now();

function startAutoSave() {
    let healthCheckCounter = 0;
    
    // Guardar cada 30 segundos si hay cambios sin guardar
    autoSaveInterval = setInterval(() => {
        if (hasUnsavedChanges && !isCurrentlySaving) {
            saveTasks();
        }
        
        // Verificar salud del almacenamiento cada 2 minutos (4 intervalos)
        healthCheckCounter++;
        if (healthCheckCounter >= 4) {
            healthCheckCounter = 0;
            if (!checkStorageHealth()) {
                console.warn('Problema detectado con el almacenamiento local');
            }
        }
    }, 30000);
}

// Iniciar auto-guardado
startAutoSave();

// Guardar antes de cerrar la página
window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        saveTasks(true); // Forzar guardado si hay cambios sin guardar
    }
});

// Guardar cuando la página pierde el foco
document.addEventListener('visibilitychange', function() {
    if (document.hidden && hasUnsavedChanges) {
        saveTasks(true); // Forzar guardado si hay cambios sin guardar
    }
});

// Timeout para agrupar cambios rápidos
let saveTimeout;

// Evento para detectar cambios en las tareas
function onTasksChanged(immediate = false) {
    markTasksAsChanged();
    
    if (immediate) {
        // Limpiar timeout pendiente y guardar inmediatamente
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        saveTasks(true);
    } else {
        // Limpiar timeout anterior y crear uno nuevo para agrupar cambios
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            if (hasUnsavedChanges) {
                saveTasks();
            }
            saveTimeout = null;
        }, 1000);
    }
}

function getPriorityLabel(priority) {
    const priorityLabels = {
        urgent: 'Urgente',
        high: 'Alta',
        medium: 'Media',
        low: 'Baja'
    };
    return priorityLabels[priority] || 'Media';
}

// Funciones para manejo inteligente de guardado
function generateTasksHash() {
    // Crear un string con la información relevante para detectar cambios
    const relevantData = tasks.map(task => ({
        id: task.id,
        text: task.text,
        date: task.date,
        priority: task.priority,
        completed: task.completed
    }));
    
    // Ordenar por ID para consistencia
    relevantData.sort((a, b) => a.id.localeCompare(b.id));
    
    // Generar hash simple
    const dataString = JSON.stringify(relevantData);
    let hash = 0;
    if (dataString.length === 0) return hash.toString();
    
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a 32-bit integer
    }
    
    return hash.toString();
}

function hasTasksChanged() {
    const currentHash = generateTasksHash();
    return currentHash !== lastSavedTasksHash;
}

function markTasksAsChanged() {
    hasUnsavedChanges = true;
    lastSaveTime = Date.now();
}

function markTasksAsSaved() {
    lastSavedTasksHash = generateTasksHash();
    hasUnsavedChanges = false;
}

// Funciones para tareas recurrentes
function renderRecurringTasks() {
    const recurringTasks = tasks.filter(task => task.isRecurring);
    
    // Aplicar filtros
    let filteredTasks = recurringTasks;
    switch (currentFilter) {
        case 'pending':
            filteredTasks = recurringTasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = recurringTasks.filter(task => task.completed);
            break;
        case 'recurring':
            filteredTasks = recurringTasks; // Mostrar todas las recurrentes
            break;
        case 'no-date':
            filteredTasks = []; // Las recurrentes no se muestran en "sin fecha"
            break;
        case 'urgent':
            filteredTasks = recurringTasks.filter(task => task.priority === 'urgent');
            break;
        case 'high':
            filteredTasks = recurringTasks.filter(task => task.priority === 'high');
            break;
        case 'medium':
            filteredTasks = recurringTasks.filter(task => task.priority === 'medium');
            break;
        case 'low':
            filteredTasks = recurringTasks.filter(task => task.priority === 'low');
            break;
        case 'all':
        default:
            if (currentFilter !== 'all') {
                filteredTasks = []; // No mostrar en otros filtros específicos
            }
            break;
    }
    
    // Actualizar contador
    recurringTasksCount.textContent = filteredTasks.length;
    
    // Siempre mostrar la sección
    recurringTasksSection.classList.remove('empty');
    
    // Manejar colapso automático según contenido
    autoCollapseSection('recurring-tasks', filteredTasks.length === 0);
    
    recurringTasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        const filterText = currentFilter === 'all' ? 'No tienes tareas recurrentes aún. ¡Crea tu primera tarea recurrente!' : 
                          currentFilter === 'pending' ? 'No tienes tareas recurrentes pendientes. ¡Buen trabajo!' : 
                          currentFilter === 'completed' ? 'No tienes tareas recurrentes completadas aún.' :
                          currentFilter === 'recurring' ? 'No tienes tareas recurrentes aún. ¡Crea tu primera tarea recurrente!' :
                          `No tienes tareas recurrentes con prioridad ${getPriorityLabel(currentFilter)}.`;
        
        recurringTasksList.innerHTML = `
            <li class="no-tasks">
                <p style="text-align: center; color: #71717a; padding: 2rem; font-weight: 400;">
                    ${filterText}
                </p>
            </li>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item recurring priority-${task.priority}`;
        if (task.completed) li.classList.add('completed');
        
        const recurringInfo = getRecurringInfo(task);
        const timeInfo = task.time ? `<div class="task-time"><i class="fas fa-clock"></i> ${task.time}</div>` : '';
        
        li.innerHTML = `
            <div class="task-priority-indicator"></div>
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                ${timeInfo}
                <div class="task-recurring-info">
                    <i class="fas fa-repeat"></i> ${recurringInfo}
                </div>
            </div>
            <div class="task-actions">
                <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Eliminar tarea">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        recurringTasksList.appendChild(li);
    });
}

function getRecurringInfo(task) {
    if (!task.isRecurring || !task.recurringConfig) return '';
    
    const config = task.recurringConfig;
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    switch (config.type) {
        case 'daily':
            return 'Todos los días';
        case 'monthly':
            if (config.monthlyDays && config.monthlyDays.length > 0) {
                const dayNumbers = config.monthlyDays.sort((a, b) => a - b).join(', ');
                return `El día ${dayNumbers} de cada mes`;
            }
            return 'Mensualmente';
        case 'custom':
            if (config.days && config.days.length > 0) {
                const dayNames = config.days.map(dayNum => days[dayNum]).join(', ');
                return `Los ${dayNames}`;
            }
            return 'Días personalizados';
        default:
            return 'Recurrente';
    }
}

function generateRecurringTaskInstances(recurringTask) {
    // Esta función genera instancias de tareas recurrentes para los próximos 30 días
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30); // Generar para los próximos 30 días
    
    const startDate = recurringTask.date ? new Date(recurringTask.date + 'T00:00:00') : today;
    
    // Crear una nueva fecha para cada iteración para evitar problemas de zona horaria
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        if (shouldCreateInstanceForDate(recurringTask, currentDate)) {
            // Usar formato local para evitar problemas de zona horaria
            const dateStr = formatDateToString(currentDate);
            
            // Verificar si ya existe una instancia para este día
            const existingInstance = tasks.find(task => 
                task.parentRecurringId === recurringTask.id && 
                task.date === dateStr
            );
            
            if (!existingInstance) {
                const instance = {
                    id: `${recurringTask.id}_${dateStr}`,
                    parentRecurringId: recurringTask.id,
                    text: recurringTask.text,
                    date: dateStr,
                    time: recurringTask.time,
                    priority: recurringTask.priority,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    hasNoDate: false,
                    isRecurring: false,
                    isRecurringInstance: true
                };
                
                tasks.push(instance);
            }
        }
    }
}

function shouldCreateInstanceForDate(recurringTask, date) {
    const config = recurringTask.recurringConfig;
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    // Si la tarea recurrente tiene una fecha de inicio, no crear instancias antes de esa fecha
    if (recurringTask.date) {
        const startDate = new Date(recurringTask.date + 'T00:00:00');
        // Comparar solo las fechas (sin horas) para evitar problemas de zona horaria
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        
        if (dateOnly < startDateOnly) {
            return false;
        }
    }
    
    switch (config.type) {
        case 'daily':
            return true;
        case 'monthly':
            return config.monthlyDays && config.monthlyDays.includes(dayOfMonth);
        case 'custom':
            return config.days && config.days.includes(dayOfWeek);
        default:
            return false;
    }
}

function generateRecurringTasks() {
    // Generar instancias para todas las tareas recurrentes existentes
    const recurringTasks = tasks.filter(task => task.isRecurring);
    recurringTasks.forEach(task => {
        generateRecurringTaskInstances(task);
    });
}

// Función para limpiar instancias de tareas recurrentes que ya pasaron
function cleanupPastRecurringInstances() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrar instancias de tareas recurrentes que no sean completadas y que ya pasaron
    const tasksToRemove = tasks.filter(task => {
        if (task.isRecurringInstance && task.date && !task.completed) {
            const taskDate = new Date(task.date + 'T00:00:00');
            return taskDate < today;
        }
        return false;
    });
    
    if (tasksToRemove.length > 0) {
        tasks = tasks.filter(task => !tasksToRemove.includes(task));
        onTasksChanged(true); // Guardar cambios inmediatamente
    }
}

function getRecurringTasksForDate(dateString) {
    const recurringTasks = tasks.filter(task => task.isRecurring);
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear horas para comparación de solo fecha
    const tasksForDate = [];
    
    // Solo mostrar tareas recurrentes para el día actual o fechas futuras
    // Usar comparación de solo fecha para evitar problemas de zona horaria
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (dateOnly < todayOnly) {
        return tasksForDate; // Retornar array vacío para fechas pasadas
    }
    
    recurringTasks.forEach(recurringTask => {
        if (shouldCreateInstanceForDate(recurringTask, date)) {
            // Verificar si ya existe una instancia real para esta fecha
            const existingInstance = tasks.find(task => 
                task.parentRecurringId === recurringTask.id && 
                task.date === dateString
            );
            
            if (existingInstance) {
                // Si existe una instancia real, no agregar la virtual
                return;
            }
            
            // Crear una representación virtual de la tarea recurrente para esta fecha
            const virtualTask = {
                id: `virtual_${recurringTask.id}_${dateString}`,
                text: recurringTask.text,
                date: dateString,
                time: recurringTask.time,
                priority: recurringTask.priority,
                completed: false,
                isFromRecurring: true,
                parentRecurringId: recurringTask.id
            };
            
            tasksForDate.push(virtualTask);
        }
    });
    
    return tasksForDate;
}

// Función para marcar/desmarcar tareas desde el calendario
function toggleTaskFromCalendar(task, dateString) {
    if (task.isFromRecurring) {
        // Si es una tarea virtual de recurrente, crear una instancia real
        const realInstance = {
            id: `${task.parentRecurringId}_${dateString}`,
            parentRecurringId: task.parentRecurringId,
            text: task.text,
            date: dateString,
            time: task.time,
            priority: task.priority,
            completed: true, // La marcamos como completada
            createdAt: new Date().toISOString(),
            hasNoDate: false,
            isRecurring: false,
            isRecurringInstance: true
        };
        
        tasks.push(realInstance);
        onTasksChanged(true);
    } else {
        // Es una tarea normal, cambiar su estado
        const realTask = tasks.find(t => t.id === task.id);
        if (realTask) {
            realTask.completed = !realTask.completed;
            onTasksChanged();
        }
    }
    
    // Actualizar las vistas
    renderAllTasks();
}

// Función para inicializar la funcionalidad de colapso
function initializeCollapsible() {
    const collapseBtns = document.querySelectorAll('.collapse-btn');
    
    collapseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionType = this.dataset.section;
            toggleSection(sectionType, this);
        });
    });
    
    // Cargar estados guardados
    loadCollapsedStates();
}

// Función para alternar el estado de colapso de una sección
function toggleSection(sectionType, button) {
    const targetElement = getTargetElement(sectionType);
    
    if (!targetElement) return;
    
    const isCollapsed = targetElement.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Expandir
        targetElement.classList.remove('collapsed');
        button.classList.remove('collapsed');
    } else {
        // Colapsar
        targetElement.classList.add('collapsed');
        button.classList.add('collapsed');
    }
    
    // Guardar estado y marcar como acción manual del usuario
    saveCollapsedState(sectionType, !isCollapsed);
    markAsManuallyToggled(sectionType);
}

// Función para guardar el estado de colapso en localStorage
function saveCollapsedState(sectionType, isCollapsed) {
    const states = JSON.parse(localStorage.getItem('collapsedStates') || '{}');
    states[sectionType] = isCollapsed;
    localStorage.setItem('collapsedStates', JSON.stringify(states));
}

// Función para marcar que una sección fue toggleada manualmente
function markAsManuallyToggled(sectionType) {
    const manualStates = JSON.parse(localStorage.getItem('manuallyToggledStates') || '{}');
    manualStates[sectionType] = true;
    localStorage.setItem('manuallyToggledStates', JSON.stringify(manualStates));
}

// Función para verificar si una sección fue toggleada manualmente
function wasManuallyToggled(sectionType) {
    const manualStates = JSON.parse(localStorage.getItem('manuallyToggledStates') || '{}');
    return manualStates[sectionType] === true;
}

// Función para cargar los estados de colapso guardados
function loadCollapsedStates() {
    const states = JSON.parse(localStorage.getItem('collapsedStates') || '{}');
    const isMobile = window.innerWidth <= 768;
    
    Object.keys(states).forEach(sectionType => {
        if (states[sectionType]) {
            const button = document.querySelector(`[data-section="${sectionType}"]`);
            if (button) {
                // Si el usuario ha toggleado manualmente, respetar su decisión
                if (wasManuallyToggled(sectionType)) {
                    // Aplicar el estado guardado sin interferir
                    const targetElement = getTargetElement(sectionType);
                    if (targetElement) {
                        targetElement.classList.add('collapsed');
                        button.classList.add('collapsed');
                    }
                } else {
                    // Para secciones no toggleadas manualmente, aplicar lógica de móvil
                    if (isMobile && (sectionType === 'recurring-tasks' || sectionType === 'no-date-tasks' || sectionType === 'dated-tasks')) {
                        // No colapsar en móviles a menos que sea manual
                        const targetElement = getTargetElement(sectionType);
                        if (targetElement) {
                            targetElement.classList.remove('collapsed');
                            button.classList.remove('collapsed');
                        }
                    } else {
                        // Aplicar el estado guardado normalmente
                        const targetElement = getTargetElement(sectionType);
                        if (targetElement) {
                            targetElement.classList.add('collapsed');
                            button.classList.add('collapsed');
                        }
                    }
                }
            }
        }
    });
}

// Función auxiliar para obtener el elemento objetivo
function getTargetElement(sectionType) {
    switch(sectionType) {
        case 'todo-section':
            return document.querySelector('.todo-content');
        case 'calendar-section':
            return document.querySelector('.calendar-container');
        case 'dated-tasks':
            return document.querySelector('.dated-tasks-container');
        case 'recurring-tasks':
            return document.querySelector('.recurring-tasks-container');
        case 'no-date-tasks':
            return document.querySelector('.no-date-tasks-container');
        default:
            return null;
    }
}

// Función para colapsar automáticamente secciones según su contenido
function autoCollapseSection(sectionType, shouldCollapse) {
    // Solo aplicar colapso automático si el usuario no ha interactuado manualmente con la sección
    if (wasManuallyToggled(sectionType)) {
        return; // El usuario tiene control manual, no interferir
    }
    
    const targetElement = getTargetElement(sectionType);
    const button = document.querySelector(`[data-section="${sectionType}"]`);
    
    if (!targetElement || !button) return;
    
    if (shouldCollapse) {
        // Colapsar si está vacía
        if (!targetElement.classList.contains('collapsed')) {
            targetElement.classList.add('collapsed');
            button.classList.add('collapsed');
        }
    } else {
        // Expandir si tiene contenido
        if (targetElement.classList.contains('collapsed')) {
            targetElement.classList.remove('collapsed');
            button.classList.remove('collapsed');
        }
    }
}

// Función para asegurar que las secciones principales estén visibles en móviles
function ensureMobileSectionsVisible() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Solo expandir secciones que no han sido toggleadas manualmente por el usuario
        const sectionsToShow = ['dated-tasks', 'recurring-tasks', 'no-date-tasks'];
        
        sectionsToShow.forEach(sectionType => {
            // Solo auto-expandir si el usuario no ha interactuado manualmente con esta sección
            if (!wasManuallyToggled(sectionType)) {
                const targetElement = getTargetElement(sectionType);
                const button = document.querySelector(`[data-section="${sectionType}"]`);
                
                if (targetElement && button && targetElement.classList.contains('collapsed')) {
                    targetElement.classList.remove('collapsed');
                    button.classList.remove('collapsed');
                }
            }
        });
    }
} 