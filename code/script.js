const form = document.getElementById("training-form");
const calendar = document.getElementById("calendar");
const trainingDetail = document.getElementById("training-detail");

let trainings = [];
let currentUser = null;
let editingId = null;
let weeklyGoal = Number(localStorage.getItem("weeklyGoal")) || 4;
let currentCalendarDate = new Date();
//let routines = JSON.parse(localStorage.getItem("routines-demo")) || [];
let routines = []; // per la web real
let activeRoutineId = null;
let editingExerciseIndex = null;
let draggedExerciseIndex = null;
let pendingDeleteRoutineId = null;
let pendingDeleteId = null;
let deletedTraining = null;
let undoTimeout = null;
let lastSavedDate = null;
let chartMode = "last10";
const heroTag = document.querySelector(".hero-content .tag");

const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const monthName = document.getElementById("month-name");

/* rutines */
const routineForm = document.getElementById("routine-form");
const routinesGrid = document.getElementById("routines-grid");
const exerciseForm = document.getElementById("exercise-form");

function obrirRutina(id) {
  activeRoutineId = id;

  const routine = routines.find(r => String(r.id) === String(id));
  if (!routine) return;

  const exercises = routine.exercises || [];

  routinesGrid.innerHTML = `
    <div class="routine-detail-card full">
      <button class="routine-back-btn" onclick="tornarLlistaRutines()">← ${t("backButton")}</button>

      <span class="routine-color big" style="background:${colorTipus(routine.sport)}"></span>
      <h3>${routine.title}</h3>
      <p><strong>${routine.sport}</strong></p>
      <p>${routine.notes || t("noGeneralNotes")}</p>

      <button class="form-btn" type="button" onclick="obrirFormExercici('${routine.id}')">
       ${t("addExercise")}
      </button>

      <div class="exercises-list">
        ${exercises.length === 0 ? `
          <p class="empty-exercises">${t("noExercises")}</p>
        ` : exercises.map((ex, index) => `
          <div class="exercise-card" data-exercise-index="${index}">
            <div class="exercise-main">
              <div class="exercise-title-row">
                <span 
                  class="drag-handle"
                  onpointerdown="startExercisePointerDrag(event, '${routine.id}', ${index})"
                >≡</span>
                <h4>${ex.name}</h4>
              </div>

              <p>
                ${ex.sets ? `${ex.sets} num` : ""}
                ${ex.reps ? ` · ${ex.reps} reps` : ""}
                ${ex.weight ? ` · ${ex.weight} kg` : ""}
                ${ex.time ? ` · ${ex.time}` : ""}
              </p>

              ${ex.notes ? `<small>${ex.notes}</small>` : ""}
            </div>

            <div class="exercise-actions">
              <button type="button" onclick="editarExercici('${routine.id}', ${index})">${t("editExercise")}</button>
              <button type="button" class="exercise-delete-btn" onclick="eliminarExercici('${routine.id}', ${index})">${t("deleteExercise")}</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

let pointerDragRoutineId = null;
let pointerDragStartIndex = null;

function startExercisePointerDrag(event, routineId, index) {
  event.preventDefault();

  pointerDragRoutineId = routineId;
  pointerDragStartIndex = index;

  const card = event.target.closest(".exercise-card");
  if (card) card.classList.add("dragging");

  document.addEventListener("pointerup", finishExercisePointerDrag);
}

async function finishExercisePointerDrag(event) {
  document.removeEventListener("pointerup", finishExercisePointerDrag);

  const target = document.elementFromPoint(event.clientX, event.clientY);
  const targetCard = target?.closest(".exercise-card");

  document.querySelectorAll(".exercise-card").forEach(card => {
    card.classList.remove("dragging");
  });

  if (!targetCard) return;

  const targetIndex = Number(targetCard.dataset.exerciseIndex);

  if (
    pointerDragRoutineId === null ||
    pointerDragStartIndex === null ||
    targetIndex === pointerDragStartIndex
  ) return;

  const routine = routines.find(r => String(r.id) === String(pointerDragRoutineId));
  if (!routine) return;

  const [movedExercise] = routine.exercises.splice(pointerDragStartIndex, 1);
  routine.exercises.splice(targetIndex, 0, movedExercise);

  const routineId = pointerDragRoutineId;

  // 🔥 guardar a Firebase
  await actualitzarRutinaFirebase(routineId, {
    exercises: routine.exercises
  });

  pointerDragRoutineId = null;
  pointerDragStartIndex = null;

  obrirRutina(routineId);
}

function obrirFormRutina() {
  routineForm.style.display = "flex";
  routineForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function tancarFormRutina() {
  routineForm.style.display = "none";
  routineForm.reset();
}

if (routineForm) {
  routineForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const routine = {
      sport: document.getElementById("routine-sport").value.trim(),
      title: document.getElementById("routine-title").value.trim(),
      notes: document.getElementById("routine-notes").value.trim(),
      exercises: []
    };

    await guardarRutinaFirebase(routine);

    tancarFormRutina();
    mostrarToast(t("routineSaved"));
  });
}

function pintarRutines() {
  if (!routinesGrid) return;

  if (routines.length === 0) {
    routinesGrid.innerHTML = `
      <div class="routine-empty-card">
        <h3>${t("routinesEmptyTitle")}</h3>
        <p>${t("routinesEmptyText")}</p>
      </div>
    `;
    return;
  }

  routinesGrid.innerHTML = routines.map(routine => `
  <div class="routine-card-wrapper">
    <button class="routine-card" onclick="obrirRutina('${routine.id}')">
      <span class="routine-color" style="background:${colorTipus(routine.sport)}"></span>
      <h3>${routine.sport}</h3>
      <p>${routine.title}</p>
      <small>${(routine.exercises || []).length} ${t("exercisesCount")}</small>
    </button>

    <button 
      class="routine-delete-circle" 
      onclick="event.stopPropagation(); demanarEliminarRutina('${routine.id}')"
      title="Eliminar rutina"
    >
      🗑️
    </button>
  </div>
`).join("");
}

function demanarEliminarRutina(id) {
  pendingDeleteRoutineId = id;
  document.getElementById("delete-routine-modal").classList.add("show");
}

document.getElementById("cancel-delete-routine").addEventListener("click", () => {
  pendingDeleteRoutineId = null;
  document.getElementById("delete-routine-modal").classList.remove("show");
});

document.getElementById("confirm-delete-routine").addEventListener("click", async () => {
  if (pendingDeleteRoutineId === null) return;

  await eliminarRutinaFirebase(pendingDeleteRoutineId);

  pendingDeleteRoutineId = null;
  document.getElementById("delete-routine-modal").classList.remove("show");

  mostrarToast(t("routineDeleted"));
});

function tornarLlistaRutines() {
  activeRoutineId = null;
  tancarFormExercici();
  pintarRutines();
}

function obrirFormExercici(routineId) {
  activeRoutineId = routineId;
  exerciseForm.style.display = "flex";
  exerciseForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function tancarFormExercici() {
  exerciseForm.style.display = "none";
  exerciseForm.reset();
}

exerciseForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const routine = routines.find(r => String(r.id) === String(activeRoutineId));
  if (!routine) return;

  const exercise = {
    name: document.getElementById("exercise-name").value.trim(),
    sets: document.getElementById("exercise-sets").value,
    reps: document.getElementById("exercise-reps").value,
    weight: document.getElementById("exercise-weight").value,
    time: document.getElementById("exercise-time").value.trim(),
    notes: document.getElementById("exercise-notes").value.trim()
  };

  if (editingExerciseIndex !== null) {
  routine.exercises[editingExerciseIndex] = exercise;
  editingExerciseIndex = null;
} else {
  routine.exercises.push(exercise);
}

await actualitzarRutinaFirebase(activeRoutineId, {
  exercises: routine.exercises
});

tancarFormExercici();
document.querySelector("#exercise-form .form-btn").textContent = t("saveExerciseButton");
obrirRutina(activeRoutineId);
mostrarToast(t("exerciseSaved"));
});

function editarExercici(routineId, index) {
  const routine = routines.find(r => String(r.id) === String(routineId));
  if (!routine) return;

  const ex = routine.exercises[index];
  if (!ex) return;

  activeRoutineId = routineId;
  editingExerciseIndex = index;

  document.getElementById("exercise-name").value = ex.name || "";
  document.getElementById("exercise-sets").value = ex.sets || "";
  document.getElementById("exercise-reps").value = ex.reps || "";
  document.getElementById("exercise-weight").value = ex.weight || "";
  document.getElementById("exercise-time").value = ex.time || "";
  document.getElementById("exercise-notes").value = ex.notes || "";

  document.querySelector("#exercise-form .form-btn").textContent = t("updateExercise");
  exerciseForm.style.display = "flex";

  exerciseForm.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


async function eliminarExercici(routineId, index) {
  const routine = routines.find(r => String(r.id) === String(routineId));
  if (!routine) return;

  routine.exercises.splice(index, 1);

  await actualitzarRutinaFirebase(routineId, {
    exercises: routine.exercises
  });

  obrirRutina(routineId);
  mostrarToast(t("exerciseDeleted"));
}

function anarARegistrarAvui() {
  canviarTab("inici");

  setTimeout(() => {
    const avui = new Date().toISOString().split("T")[0];
    document.getElementById("data").value = avui;
    document.getElementById("registre").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 100);
}

/* TRADUCCIÓ */
const translations = {
  ca: {
    navHome: "Inici",
    navCalendar: "Calendari",
    navEvolution: "Evolució",
    navCoach: "AI Coach",

    saveExerciseButton: "Guardar exercici",
    backButton: "Tornar",
    noGeneralNotes: "Sense notes generals",
    loginToSaveR: "Has de fer login per guardar rutines",
    loginToSaveTrain: "Has de fer login per guardar entrenaments",
    loginToDeleteTrain:"Has de fer login per eliminar entrenaments",

    noIntensityData: "Encara no hi ha dades d'intensitat.",
    exercisesCount: "exercicis",
    sessionsLabel: "sessions",
    trainingUpdateButton: "Actualitzar",
    coachGoalReached: "Aquesta setmana portes {current}/{goal} sessions. Has complert l’objectiu setmanal, molt bé 🔥",
    coachGoalPending: "Aquesta setmana portes {current}/{goal} sessions. Et falten {remaining} sessió/ns per arribar a l’objectiu. Encara hi ets a temps.",

    congratsGoal: "Felicitats! Has completat el teu objectiu setmanal ✨ Segueix així!",
    loginFail:"Error iniciant sessió",
    trainingUpdated: "Entrenament actualitzat",
    trainingSaved: "Entrenament guardat",

    heroTag: "Pilates · Barre · Força · Benestar",
    heroTitle: "Registra els teus entrenaments i entén la teva evolució",
    heroText: "Guarda cada sessió, consulta el calendari i analitza el teu progrés.",
    heroButton: "Registra el teu entrenament",

    welcomeTitle: "Benvinguda",
    welcomeText: "Registra els teus entrenaments, consulta el calendari i segueix la teva evolució.",
    welcomeLogin: "Continuar amb Google",
    welcomeSkip: "Continuar sense iniciar sessió",

    registerTag: "Registre",
    registerTitle: "Com ha anat avui?",
    typePlaceholder: "Tipus",
    typePilates: "Pilates",
    typeBarre: "Barre",
    typeStrength: "Força",
    typeCardio: "Cardio",
    placePlaceholder: "Lloc",
    placeHome: "Casa",
    placeGym: "Gimnàs / Classe",
    placeOutdoor: "Exterior",
    durationPlaceholder: "Durada (min)",
    intensityLabel: "Intensitat",
    notesPlaceholder: "Notes...",
    saveButton: "Guardar",

    routineSportPlaceholder: "Tipus (Pilates, Força...)",
    routineNamePlaceholder: "Nom de la rutina",
    routineNotesPlaceholder: "Notes generals...",
    saveRoutineButton: "Guardar rutina",

    noExercises: "Encara no tens exercicis en aquesta rutina.",
    addExercise: "+ Afegir exercici",
    editExercise: "Editar",
    deleteExercise: "Eliminar",
    updateExercise: "Actualitzar exercici",

    calendarTag: "Calendari",
    calendarTitlePrefix: "Dies entrenats d’",
    monthlyGoalDefault: "Aquest mes has complert 0/0 setmanes",
    annualSummary: "Resum anual",
    backCalendar: "Tornar al calendari",

    exerciseName: "Nom de l’exercici",
    exerciseSets: "Sèries",
    exerciseReps: "Repeticions",
    exerciseWeight: "Pes (kg)",
    exerciseTime: "Temps / durada",

    navRoutines: "Rutines",
    routinesTag: "Rutines",
    routinesTitle: "Les teves rutines",
    routinesSubtitle: "Organitza les teves rutines per esport i guarda els exercicis que fas habitualment.",
    routinesEmptyTitle: "Encara no tens rutines",
    routinesEmptyText: "Crea la teva primera rutina per esport: Pilates, Cardio, Força, Rem...",

    newRoutineButton: "+ Nova rutina",
    saveRoutineButton: "Guardar rutina",

    progressTag: "Progrés",
    progressTitle: "La teva evolució",
    totalTrainings: "Entrenaments totals",
    totalMinutes: "Minuts acumulats",
    avgIntensity: "Intensitat mitjana",
    weeklyGoal: "Objectiu setmanal",
    changeGoal: "Canviar objectiu",
    sessionsPerWeek: "Sessions per setmana",
    evolutionTag: "Evolució",
    intensityChartTitle: "Intensitat dels entrenaments",
    last10: "Últims 10",
    monthlyAvg: "Mitjana mensual",

    coachTitle: "Parla amb el teu entrenador IA",
    coachWelcome: "Hola! En què et puc ajudar?",
    coachProgress: "Com vaig?",
    coachWeek: "Objectiu setmanal",
    coachIntensity: "Intensitat",
    coachImprove: "Com millorar",

    annualCalendarTitle: "Calendari anual",
    noTrainings: "Encara no tens entrenaments registrats. Guarda’n alguns i podré analitzar millor el teu progrés 💪",

    noTrainings: "Encara no tens entrenaments registrats. Guarda’n alguns i podré analitzar millor el teu progrés 💪",
    trainingsDay: "Entrenaments del dia",
    detailType: "Tipus",
    detailPlace: "Lloc",
    detailDuration: "Durada",
    detailMinutes: "minuts",
    detailIntensity: "Intensitat",
    detailNotes: "Notes",
    noNotes: "Sense notes",
    editButton: "Editar",
    deleteButton: "Eliminar",
    deleteTitle: "Eliminar entrenament?",
    deleteText: "Segur que vols eliminar aquest entrenament?",
    cancelButton: "Cancel·lar",

    typeYoga: "Yoga",
    typeRunning: "Córrer",
    typeOther: "Altres",
    typeOtherPlaceholder: "Escriu el teu esport...",

        // CA
    navProfile: "Perfil",
    profileTitle: "El teu perfil",
    profilePhotoAlt: "Foto de perfil",
    deleteRoutineTitle: "Eliminar rutina?",
    deleteRoutineText: "Segur que vols eliminar aquesta rutina i tots els seus exercicis?",
    trainingDeleted: "Entrenament eliminat",
    undoButton: "Desfer",
    noSession: "Sense sessió",
    loginPrompt: "Inicia sessió",

    typeOtherLegend: "Altres (color automàtic)",

    footerCreated: "Creat per Jana Pons · Training Mind",
    footerContact: "Contacte:"
  },

  es: {
    navHome: "Inicio",
    navCalendar: "Calendario",
    navEvolution: "Evolución",
    navCoach: "AI Coach",

    saveExerciseButton: "Guardar ejercicio",
    backButton: "Volver",
    noGeneralNotes: "Sin notas generales",

    noIntensityData: "Aún no hay datos de intensidad.",
    exercisesCount: "ejercicios",
    sessionsLabel: "sesiones",
    trainingUpdateButton: "Actualizar",
    loginToSaveR: "Tienes que hacer login para guardar rutinas",
    loginToSaveTrain: "Tienes que hacer login para guardar entrenamientos",
    loginToDeleteTrain:"Tienes que hacer login para eliminar entrenamientos",

    coachGoalReached: "Esta semana llevas {current}/{goal} sesiones. Has cumplido el objetivo semanal, muy bien 🔥",
    coachGoalPending: "Esta semana llevas {current}/{goal} sesiones. Te faltan {remaining} sesión/es para llegar al objetivo. Aún estás a tiempo.",

    congratsGoal: "¡Felicidades! Has completado tu objetivo semanal ✨ ¡Sigue así!",
    loginFail:"Error iniciando sessión",
    trainingUpdated: "Entrenamiento actualizado",
    trainingSaved: "Entrenamiento guardado",

    heroTag: "Pilates · Barre · Fuerza · Bienestar",
    heroTitle: "Registra tus entrenamientos y entiende tu evolución",
    heroText: "Guarda cada sesión, consulta el calendario y analiza tu progreso.",
    heroButton: "Registra tu entrenamiento",

    welcomeTitle: "Bienvenida",
    welcomeText: "Registra tus entrenamientos, consulta el calendario y sigue tu evolución.",
    welcomeLogin: "Continuar con Google",
    welcomeSkip: "Continuar sin iniciar sesión",

    registerTag: "Registro",
    registerTitle: "¿Cómo ha ido hoy?",
    typePlaceholder: "Tipo",
    typePilates: "Pilates",
    typeBarre: "Barre",
    typeStrength: "Fuerza",
    typeCardio: "Cardio",
    placePlaceholder: "Lugar",
    placeHome: "Casa",
    placeGym: "Gimnasio / Clase",
    placeOutdoor: "Exterior",
    durationPlaceholder: "Duración (min)",
    intensityLabel: "Intensidad",
    notesPlaceholder: "Notas...",
    saveButton: "Guardar",

    routineSportPlaceholder: "Tipo (Pilates, Fuerza...)",
    routineNamePlaceholder: "Nombre de la rutina",
    routineNotesPlaceholder: "Notas generales...",
    saveRoutineButton: "Guardar rutina",

    noExercises: "Aún no tienes ejercicios en esta rutina.",
    addExercise: "+ Añadir ejercicio",
    editExercise: "Editar",
    deleteExercise: "Eliminar",
    updateExercise: "Actualizar ejercicio",
    
    calendarTag: "Calendario",
    calendarTitlePrefix: "Días entrenados de ",
    monthlyGoalDefault: "Este mes has cumplido 0/0 semanas",
    annualSummary: "Resumen anual",
    backCalendar: "Volver al calendario",

    exerciseName: "Nombre del ejercicio",
    exerciseSets: "Series",
    exerciseReps: "Repeticiones",
    exerciseWeight: "Peso (kg)",
    exerciseTime: "Tiempo / duración",

    navRoutines: "Rutinas",
    routinesTag: "Rutinas",
    routinesTitle: "Tus rutinas",
    routinesSubtitle: "Organiza tus rutinas por deporte y guarda los ejercicios que haces habitualmente.",
    routinesEmptyTitle: "Aún no tienes rutinas",
    routinesEmptyText: "Crea tu primera rutina por deporte: Pilates, Cardio, Fuerza, Remo...",

    newRoutineButton: "+ Nueva rutina",
    saveRoutineButton: "Guardar rutina",

    progressTag: "Progreso",
    progressTitle: "Tu evolución",
    totalTrainings: "Entrenamientos totales",
    totalMinutes: "Minutos acumulados",
    avgIntensity: "Intensidad media",
    weeklyGoal: "Objetivo semanal",
    changeGoal: "Cambiar objetivo",
    sessionsPerWeek: "Sesiones por semana",
    evolutionTag: "Evolución",
    intensityChartTitle: "Intensidad de los entrenamientos",
    last10: "Últimos 10",
    monthlyAvg: "Media mensual",

    coachTitle: "Habla con tu entrenador IA",
    coachWelcome: "¡Hola! ¿En qué puedo ayudarte?",
    coachProgress: "¿Cómo voy?",
    coachWeek: "Objetivo semanal",
    coachIntensity: "Intensidad",
    coachImprove: "Cómo mejorar",

    annualCalendarTitle: "Calendario anual",
    noTrainings: "Aún no tienes entrenamientos registrados. Guarda algunos y podré analizar mejor tu progreso 💪",
    noTrainings: "Aún no tienes entrenamientos registrados. Guarda algunos y podré analizar mejor tu progreso 💪",
    trainingsDay: "Entrenamientos del día",
    detailType: "Tipo",
    detailPlace: "Lugar",
    detailDuration: "Duración",
    detailMinutes: "minutos",
    detailIntensity: "Intensidad",
    detailNotes: "Notas",
    noNotes: "Sin notas",
    editButton: "Editar",
    deleteButton: "Eliminar",
    deleteTitle: "¿Eliminar entrenamiento?",
    deleteText: "¿Seguro que quieres eliminar este entrenamiento?",
    cancelButton: "Cancelar",

    typeYoga: "Yoga",
    typeRunning: "Correr",
    typeOther: "Otros",
    typeOtherPlaceholder: "Escribe tu deporte...",

    // ES
    navProfile: "Perfil",
    profileTitle: "Tu perfil",
    profilePhotoAlt: "Foto de perfil",
    deleteRoutineTitle: "¿Eliminar rutina?",
    deleteRoutineText: "¿Seguro que quieres eliminar esta rutina y todos sus ejercicios?",
    trainingDeleted: "Entrenamiento eliminado",
    undoButton: "Deshacer",
    noSession: "Sin sesión",
    loginPrompt: "Inicia sesión",

    typeOtherLegend: "Otros (color automático)",

    footerCreated: "Creado por Jana Pons · Training Mind",
    footerContact: "Contacto:"
  },

  en: {
    navHome: "Home",
    navCalendar: "Calendar",
    navEvolution: "Progress",
    navCoach: "AI Coach",

    saveExerciseButton: "Save the exercise",
    backButton: "Return",
    noGeneralNotes: "Without general notes",

    loginToSaveR: "You must log in to save routines",
    loginToSaveTrain: "You must log in to save workouts",
    loginToDeleteTrain:"You must be logged in to delete workouts",

    noIntensityData: "There is no intensity data yet.",
    exercisesCount: "exercises",
    sessionsLabel: "sessions",
    trainingUpdateButton: "Update",
    coachGoalReached: "This week you have completed {current}/{goal} sessions. You reached your weekly goal, great job 🔥",
    coachGoalPending: "This week you have completed {current}/{goal} sessions. You need {remaining} more session(s) to reach your goal. You're still on time.",

    congratsGoal: "Congratulations! You've completed your weekly goal ✨ Keep it up!",
    loginFail:"Error logging in",
    trainingUpdated: "Workout updated",
    trainingSaved: "Workout saved",

    heroTag: "Pilates · Barre · Strength · Wellness",
    heroTitle: "Log your workouts and understand your progress",
    heroText: "Save each session, check the calendar and analyze your progress.",
    heroButton: "Log your workout",

    welcomeTitle: "Welcome",
    welcomeText: "Log your workouts, check your calendar and follow your progress.",
    welcomeLogin: "Continue with Google",
    welcomeSkip: "Continue without signing in",

    registerTag: "Log",
    registerTitle: "How did it go today?",
    typePlaceholder: "Type",
    typePilates: "Pilates",
    typeBarre: "Barre",
    typeStrength: "Strength",
    typeCardio: "Cardio",
    placePlaceholder: "Place",
    placeHome: "Home",
    placeGym: "Gym / Class",
    placeOutdoor: "Outdoor",
    durationPlaceholder: "Duration (min)",
    intensityLabel: "Intensity",
    notesPlaceholder: "Notes...",
    saveButton: "Save",

    routineSportPlaceholder: "Type (Pilates, Strength...)",
    routineNamePlaceholder: "Routine name",
    routineNotesPlaceholder: "General notes...",
    saveRoutineButton: "Save routine",

    noExercises: "You don’t have exercises in this routine yet.",
    addExercise: "+ Add exercise",
    editExercise: "Edit",
    deleteExercise: "Delete",
    updateExercise: "Update exercise",  

    calendarTag: "Calendar",
    calendarTitlePrefix: "Training days in ",
    monthlyGoalDefault: "This month you completed 0/0 weeks",
    annualSummary: "Year summary",
    backCalendar: "Back to calendar",

    exerciseName: "Name of the exercise",
    exerciseSets: "Series",
    exerciseReps: "Repetitions",
    exerciseWeight: "Weight (kg)",
    exerciseTime: "Time / duration",

    navRoutines: "Routines",
    routinesTag: "Routines",
    routinesTitle: "Your routines",
    routinesSubtitle: "Organize your routines by sport and save the exercises you usually do.",
    routinesEmptyTitle: "You don’t have routines yet",
    routinesEmptyText: "Create your first routine by sport: Pilates, Cardio, Strength, Rowing...",

    newRoutineButton: "+ New routine",
    saveRoutineButton: "Save routine",

    progressTag: "Progress",
    progressTitle: "Your progress",
    totalTrainings: "Total workouts",
    totalMinutes: "Total minutes",
    avgIntensity: "Average intensity",
    weeklyGoal: "Weekly goal",
    changeGoal: "Change goal",
    sessionsPerWeek: "Sessions per week",
    evolutionTag: "Progress",
    intensityChartTitle: "Workout intensity",
    last10: "Last 10",
    monthlyAvg: "Monthly average",

    coachTitle: "Talk to your AI coach",
    coachWelcome: "Hi! How can I help you?",
    coachProgress: "How am I doing?",
    coachWeek: "Weekly goal",
    coachIntensity: "Intensity",
    coachImprove: "How to improve",

    annualCalendarTitle: "Yearly calendar",
    noTrainings: "You don’t have any workouts yet. Save some and I’ll be able to analyze your progress better 💪",

    noTrainings: "You don’t have any workouts yet. Save some and I’ll be able to analyze your progress better 💪",
    trainingsDay: "Workouts on",
    detailType: "Type",
    detailPlace: "Place",
    detailDuration: "Duration",
    detailMinutes: "minutes",
    detailIntensity: "Intensity",
    detailNotes: "Notes",
    noNotes: "No notes",
    editButton: "Edit",
    deleteButton: "Delete",
    deleteTitle: "Delete workout?",
    deleteText: "Are you sure you want to delete this workout?",
    cancelButton: "Cancel",
    
    typeYoga: "Yoga",
    typeRunning: "Running",
    typeOther: "Other",
    typeOtherPlaceholder: "Write your sport...",

    // EN
    navProfile: "Profile",
    profileTitle: "Your profile",
    profilePhotoAlt: "Profile photo",
    deleteRoutineTitle: "Delete routine?",
    deleteRoutineText: "Are you sure you want to delete this routine and all its exercises?",
    trainingDeleted: "Workout deleted",
    undoButton: "Undo",
    noSession: "Not signed in",
    loginPrompt: "Sign in",

    typeOtherLegend: "Other (automatic color)",

    footerCreated: "Created by Jana Pons · Training Mind",
    footerContact: "Contact:"
  }
};

function t(key) {
  return translations[currentLang][key] || key;
}

/* missatge inicial */
function mostrarWelcomeSiCal() {
  const modal = document.getElementById("welcome-modal");
  if (!modal) return;

  const jaTancat = sessionStorage.getItem("welcome-closed");

  if (!currentUser && !jaTancat) {
    modal.classList.add("show");
  }
}

function tancarWelcome() {
  const modal = document.getElementById("welcome-modal");
  if (!modal) return;

  modal.classList.remove("show");
  sessionStorage.setItem("welcome-closed", "true");
}


let currentLang = localStorage.getItem("language") || "ca";

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-i18n-alt]").forEach(element => {
  const key = element.dataset.i18nAlt;
  if (translations[lang] && translations[lang][key]) {
    element.alt = translations[lang][key];
  }
});

  if (typeof actualitzarTitolMes === "function") {
    actualitzarTitolMes();
  }

  const annualView = document.getElementById("annual-view");
  if (
    annualView &&
    annualView.style.display !== "none" &&
    typeof pintarResumAnual === "function"
  ) {
    pintarResumAnual();
  }

    if (typeof pintarGraficaIntensitat === "function") {
    pintarGraficaIntensitat();
  }

  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");

  if (!currentUser) {
    if (profileName) profileName.textContent = t("noSession");
    if (profileEmail) profileEmail.textContent = t("loginPrompt");
  }
}


const mesosPerIdioma = {
  ca: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

const mesosCurtsPerIdioma = {
  ca: ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"],
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};

function connectorMesCa(mes) {
  const inicial = mes[0].toLowerCase();
  return ["a", "e", "i", "o", "u"].includes(inicial) ? "d’" : "de ";
}

/**/
function getUserTrainingsCollection() {
  return window.collection(window.firebaseDB, "users", currentUser.uid, "trainings");
}

function getUserRoutinesCollection() {
  return window.collection(window.firebaseDB, "users", currentUser.uid, "routines");
}

async function carregarRutinesFirebase() {
  if (!currentUser) return;

  const q = window.query(
    getUserRoutinesCollection(),
    window.orderBy("createdAt", "asc")
  );

  const snapshot = await window.getDocs(q);

  routines = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  pintarRutines();
}

async function guardarRutinaFirebase(routine) {
  if (!currentUser) {
    mostrarToast(t("loginToSaveR"));
    return;
  }

  await window.addDoc(getUserRoutinesCollection(), {
    ...routine,
    createdAt: Date.now()
  });

  await carregarRutinesFirebase();
}

async function actualitzarRutinaFirebase(id, data) {
  if (!currentUser) return;

  const ref = window.doc(window.firebaseDB, "users", currentUser.uid, "routines", String(id));
  await window.updateDoc(ref, data);
  await carregarRutinesFirebase();
}

async function eliminarRutinaFirebase(id) {
  if (!currentUser) return;

  const ref = window.doc(window.firebaseDB, "users", currentUser.uid, "routines", String(id));
  await window.deleteDoc(ref);
  await carregarRutinesFirebase();
}

async function carregarEntrenamentsFirebase() {
  if (!currentUser) return;

  const q = window.query(
    getUserTrainingsCollection(),
    window.orderBy("data", "asc")
  );

  const snapshot = await window.getDocs(q);

  trainings = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  pintarCalendari();
  actualitzarProgres();
}

// WEB REAL 
async function guardarEntrenamentFirebase(training) {
  if (!currentUser) {
    mostrarToast(t("loginToSaveTrain"));
    return;
  }

  await window.addDoc(getUserTrainingsCollection(), training);
  await carregarEntrenamentsFirebase();
}

async function actualitzarEntrenamentFirebase(id, training) {
  if (!currentUser) return;

  const ref = window.doc(window.firebaseDB, "users", currentUser.uid, "trainings", String(id));
  await window.updateDoc(ref, training);
  await carregarEntrenamentsFirebase();
}

async function eliminarEntrenamentFirebase(id) {
  if (!currentUser) {
    mostrarToast(t("loginToDeleteTrain"));
    return;
  }

  const ref = window.doc(window.firebaseDB, "users", currentUser.uid, "trainings", String(id));
  await window.deleteDoc(ref);
  await carregarEntrenamentsFirebase();
}

prevMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  pintarCalendari();
  actualitzarProgres();
});

nextMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  pintarCalendari();
  actualitzarProgres();
});

const intensitySlider = document.getElementById("intensitat");
const intensityValue = document.getElementById("intensity-value");

intensitySlider.addEventListener("input", () => {
  intensityValue.textContent = intensitySlider.value;
});

/* OBJECTIU */

const weeklyGoalInput = document.getElementById("weekly-goal-input");
const saveGoalBtn = document.getElementById("save-goal-btn");

weeklyGoalInput.value = weeklyGoal;

saveGoalBtn.addEventListener("click", () => {
  weeklyGoal = Number(weeklyGoalInput.value);

  if (weeklyGoal < 1 || isNaN(weeklyGoal)) {
    weeklyGoal = 1;
    weeklyGoalInput.value = 1;
  }

  localStorage.setItem("weeklyGoal", weeklyGoal);
  actualitzarProgres();
});

/* PESTANYES */

function canviarTab(tabId, boto = null) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (boto) {
    boto.classList.add("active");
  }

  // 🔥 IMPORTANT
  if (tabId === "inici") {
    document.body.classList.remove("force-small");
  } else {
    document.body.classList.add("force-small");
  }

  const menu = document.getElementById("nav-menu");
  if (menu) menu.classList.remove("open");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* FORMULARI */

const tipusSelect = document.getElementById("tipus");
const tipusAltresInput = document.getElementById("tipus-altres");

tipusSelect.addEventListener("change", () => {
  if (tipusSelect.value === "Altres") {
    tipusAltresInput.style.display = "block";
    tipusAltresInput.required = true;
  } else {
    tipusAltresInput.style.display = "none";
    tipusAltresInput.required = false;
    tipusAltresInput.value = "";
  }
});

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const isEditing = editingId !== null;

  const training = {
    id: editingId !== null ? editingId : Date.now(),
    data: document.getElementById("data").value,
    tipus: document.getElementById("tipus").value === "Altres"
      ? document.getElementById("tipus-altres").value.trim()
      : document.getElementById("tipus").value,
    lloc: document.getElementById("lloc").value,
    durada: Number(document.getElementById("durada").value),
    intensitat: Number(document.getElementById("intensitat").value),
    notes: document.getElementById("notes").value
  };

  if (isEditing) {
  await actualitzarEntrenamentFirebase(editingId, {
    data: training.data,
    tipus: training.tipus,
    lloc: training.lloc,
    durada: training.durada,
    intensitat: training.intensitat,
    notes: training.notes
  });

  editingId = null;
  document.querySelector("#training-form .form-btn").textContent = t("saveButton");
} else {
  await guardarEntrenamentFirebase({
    data: training.data,
    tipus: training.tipus,
    lloc: training.lloc,
    durada: training.durada,
    intensitat: training.intensitat,
    notes: training.notes
  });
}
  pintarCalendari();
  actualitzarProgres();
  amagarDetall();
  form.reset();

  tipusAltresInput.style.display = "none";
  tipusAltresInput.required = false;
  tipusAltresInput.value = "";

  mostrarToast(isEditing ? t("trainingUpdated") : t("trainingSaved"));
  
});

/* CALENDARI */

function pintarCalendari() {
  calendar.innerHTML = "";

  const any = currentCalendarDate.getFullYear();
  const mes = currentCalendarDate.getMonth();

  const mesos = [
    "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
    "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
  ];

  actualitzarTitolMes();

  const diesMes = new Date(any, mes + 1, 0).getDate();
  const primerDia = new Date(any, mes, 1).getDay();
  const espaisAbans = primerDia === 0 ? 6 : primerDia - 1;

  const diesSetmana = ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"];

  diesSetmana.forEach(dia => {
    const header = document.createElement("div");
    header.classList.add("calendar-header");
    header.textContent = dia;
    calendar.appendChild(header);
  });

  for (let i = 0; i < espaisAbans; i++) {
    const empty = document.createElement("div");
    empty.classList.add("day", "empty");
    calendar.appendChild(empty);
  }

  for (let dia = 1; dia <= diesMes; dia++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");
    dayDiv.textContent = dia;

    const avui = new Date();
    if (
      dia === avui.getDate() &&
      mes === avui.getMonth() &&
      any === avui.getFullYear()
    ) {
      dayDiv.classList.add("today");
    }

    const trainingsDia = trainings.filter(t => {
      const data = new Date(t.data + "T00:00:00");
      return (
        data.getFullYear() === any &&
        data.getMonth() === mes &&
        data.getDate() === dia
      );
    });

    if (trainingsDia.length > 0) {
      dayDiv.classList.add("trained-day");

      dayDiv.innerHTML = `
        <strong class="day-number">${dia}</strong>
        <div class="training-stripes">
          ${trainingsDia.map(t => `
            <span 
              class="training-stripe"
              style="
                background:${colorTipus(t.tipus)};
                ${estilContorn(t.lloc, colorTipus(t.tipus))}
              "
            ></span>
          `).join("")}
        </div>
      `;

      const dataDia = `${any}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

      if (dataDia === lastSavedDate) {
        dayDiv.classList.add("just-saved");

        setTimeout(() => {
          dayDiv.classList.remove("just-saved");
          lastSavedDate = null;
        }, 500);
      }

      dayDiv.addEventListener("click", () => {
        mostrarDetallDia(trainingsDia, dia);
        setTimeout(() => {
          trainingDetail.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 100);
      });
    } else {
      dayDiv.addEventListener("click", () => {
        amagarDetall();

        const dataSeleccionada = `${any}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        anarARegistrarAmbData(dataSeleccionada);
      });
    }

    calendar.appendChild(dayDiv);
  }
}

function colorTipus(tipus) {
  const tipusNormalitzat = tipus.trim().toLowerCase();

  const colorsFixos = {
    "pilates": "#b99ade",
    "barre": "#f3a8bd",
    "força": "#9fb3f5",
    "forca": "#9fb3f5",
    "cardio": "#f0bc8a",
    "yoga": "#a8d8b9",
    "córrer": "#ffcf7a",
    "correr": "#ffcf7a",
    "rem": "#9fb3f5"
  };

  if (colorsFixos[tipusNormalitzat]) return colorsFixos[tipusNormalitzat];

  const colorsPersonalitzats = [
    "#cdb4db",
    "#ffc8dd",
    "#bde0fe",
    "#b8f2e6",
    "#f6d6ad",
    "#d0f4de",
    "#e4c1f9",
    "#ffcad4"
  ];

  let hash = 0;

  for (let i = 0; i < tipusNormalitzat.length; i++) {
    hash = tipusNormalitzat.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorsPersonalitzats[Math.abs(hash) % colorsPersonalitzats.length];
}

function estilContorn(lloc, color) {
  const isMobile = window.innerWidth <= 600;

  if (lloc === "gymclass") {
    return isMobile
      ? `outline: 1.5px solid ${color}; outline-offset: 1px;`
      : `outline: 3px solid ${color}; outline-offset: 2px;`;
  }

  if (lloc === "outdoor") {
    return isMobile
      ? `outline: 1.5px dotted ${color}; outline-offset: 1px;`
      : `outline: 3px dotted ${color}; outline-offset: 2px;`;
  }

  return "";
}

function classeTipus(tipus) {
  if (tipus === "Pilates") return "type-pilates";
  if (tipus === "Barre") return "type-barre";
  if (tipus === "Força") return "type-strength";
  if (tipus === "Cardio") return "type-cardio";
  if (tipus === "Yoga") return "type-yoga";
  if (tipus === "Córrer") return "type-running";
  return "type-other";
}

function classeLloc(lloc) {
  if (lloc === "home") return "place-home";
  if (lloc === "gymclass") return "place-gymclass";
  if (lloc === "outdoor") return "place-outdoor";
  return "";
}

/* DETALL */

function mostrarDetallDia(trainingsDia, dia) {
  trainingDetail.style.display = "block";

  trainingDetail.innerHTML = `
    <h3>${t("trainingsDay")} ${dia}</h3>

    ${trainingsDia.map(training => `
      <div class="training-item">
        <p><strong>${t("detailType")}:</strong> ${training.tipus}</p>
        <p><strong>${t("detailPlace")}:</strong> ${traduirLloc(training.lloc)}</p>
        <p><strong>${t("detailDuration")}:</strong> ${training.durada} ${t("detailMinutes")}</p>
        <p><strong>${t("detailIntensity")}:</strong> ${training.intensitat}/10</p>
        <p><strong>${t("detailNotes")}:</strong> ${training.notes || t("noNotes")}</p>

        <div class="detail-actions">
          <button onclick="editarEntrenament('${training.id}')" class="edit-btn">${t("editButton")}</button>
          <button onclick="eliminarEntrenament('${training.id}')" class="delete-btn">${t("deleteButton")}</button>
        </div>
      </div>
    `).join("")}
  `;
}

function amagarDetall() {
  trainingDetail.style.display = "none";
  trainingDetail.innerHTML = "";
}

function traduirLloc(lloc) {
  if (lloc === "home") return translations[currentLang].placeHome;
  if (lloc === "gymclass") return translations[currentLang].placeGym;
  if (lloc === "outdoor") return translations[currentLang].placeOutdoor;
  return lloc;
}

/* EDITAR */

function editarEntrenament(id) {
  const training = trainings.find(t => String(t.id) === String(id));
  if (!training) return;

  editingId = training.id;

  document.getElementById("data").value = training.data;
  document.getElementById("tipus").value = training.tipus;
  document.getElementById("lloc").value = training.lloc;
  document.getElementById("durada").value = training.durada;
  document.getElementById("intensitat").value = training.intensitat;
  document.getElementById("notes").value = training.notes || "";

  document.querySelector("#training-form .form-btn").textContent = t("trainingUpdateButton");

  canviarTab("inici");

  setTimeout(() => {
    document.getElementById("registre").scrollIntoView({ behavior: "smooth" });
  }, 100);
}

function anarARegistrarAmbData(data) {
  // anar a pestanya inici
  canviarTab("inici");

  setTimeout(() => {
    // posar la data al formulari
    document.getElementById("data").value = data;

    // scroll suau al formulari
    document.getElementById("registre").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 100);
}

/* ELIMINAR */

function eliminarEntrenament(id) {
  pendingDeleteId = id;
  document.getElementById("delete-modal").classList.add("show");
}

document.getElementById("cancel-delete").addEventListener("click", () => {
  pendingDeleteId = null;
  document.getElementById("delete-modal").classList.remove("show");
});

document.getElementById("confirm-delete").addEventListener("click", async () => {
  if (pendingDeleteId === null) return;

  deletedTraining = trainings.find(t => String(t.id) === String(pendingDeleteId));

  await eliminarEntrenamentFirebase(pendingDeleteId);

  amagarDetall();

  document.getElementById("delete-modal").classList.remove("show");
  mostrarUndoToast();

  pendingDeleteId = null;
});

function mostrarUndoToast() {
  const undoToast = document.getElementById("undo-toast");
  undoToast.classList.add("show");

  clearTimeout(undoTimeout);

  undoTimeout = setTimeout(() => {
    undoToast.classList.remove("show");
    deletedTraining = null;
  }, 5000);
}

document.getElementById("undo-btn").addEventListener("click", async () => {
  if (!deletedTraining || !currentUser) return;

  const trainingToRestore = { ...deletedTraining };
  delete trainingToRestore.id;

  await guardarEntrenamentFirebase(trainingToRestore);

  document.getElementById("undo-toast").classList.remove("show");
  deletedTraining = null;
  clearTimeout(undoTimeout);
});

/* PROGRÉS */

function actualitzarProgres() {
  const totalTrainings = trainings.length;

  const totalMinutes = trainings.reduce((sum, t) => {
    return sum + Number(t.durada || 0);
  }, 0);

  const avgIntensity = totalTrainings === 0
    ? 0
    : trainings.reduce((sum, t) => {
        return sum + Number(t.intensitat || 0);
      }, 0) / totalTrainings;

  document.getElementById("total-trainings").textContent = totalTrainings;
  document.getElementById("total-minutes").textContent = totalMinutes;
  document.getElementById("avg-intensity").textContent = avgIntensity.toFixed(1);

  const sessionsThisWeek = calcularSessionsSetmanaActual();
  const percent = Math.min((sessionsThisWeek / weeklyGoal) * 100, 100);

  document.getElementById("weekly-progress-text").textContent =
    `${sessionsThisWeek} / ${weeklyGoal} ${t("sessionsLabel")}`;

  document.getElementById("weekly-progress-fill").style.width = `${percent}%`;

  const monthlyGoalMessage = document.getElementById("monthly-goal-message");
if (monthlyGoalMessage) {
  monthlyGoalMessage.textContent = calcularObjectiuMensual();
}

  pintarMarquesObjectiu();
  pintarGraficaIntensitat();
}

function calcularObjectiuMensual() {
  const any = currentCalendarDate.getFullYear();
  const mes = currentCalendarDate.getMonth();

  const avui = new Date();
  const esMesActual =
    any === avui.getFullYear() &&
    mes === avui.getMonth();

  const ultimDiaMes = new Date(any, mes + 1, 0);

  let iniciMes = new Date(any, mes, 1);
  let fiMes = esMesActual ? avui : ultimDiaMes;

  // 👉 anar al dilluns anterior (inici setmana real)
  iniciMes = obtenirDilluns(iniciMes);

  const setmanes = {};

  let cursor = new Date(iniciMes);

  while (cursor <= fiMes) {
    const dilluns = obtenirDilluns(cursor);
    const clau = dilluns.toISOString().split("T")[0];

    if (!setmanes[clau]) {
      setmanes[clau] = 0;
    }

    cursor.setDate(cursor.getDate() + 7);
  }

  // comptar entrenaments
  trainings.forEach(t => {
    const data = new Date(t.data + "T00:00:00");

    if (data < iniciMes || data > fiMes) return;

    const dilluns = obtenirDilluns(data);
    const clau = dilluns.toISOString().split("T")[0];

    if (!setmanes[clau]) setmanes[clau] = 0;

    setmanes[clau]++;
  });

  const totalsSetmanes = Object.keys(setmanes).length;

  const setmanesComplertes = Object.values(setmanes)
    .filter(total => total >= weeklyGoal).length;

  return `Aquest mes has complert ${setmanesComplertes}/${totalsSetmanes} setmanes`;
}

function obtenirDilluns(data) {
  const dilluns = new Date(data);
  const diaSetmana = dilluns.getDay();
  const diferencia = diaSetmana === 0 ? -6 : 1 - diaSetmana;

  dilluns.setDate(dilluns.getDate() + diferencia);
  dilluns.setHours(0, 0, 0, 0);

  return dilluns;
}

function calcularSessionsSetmanaActual() {
  const avui = new Date();

  const primerDiaSetmana = new Date(avui);
  const diaSetmana = avui.getDay();
  const diferencia = diaSetmana === 0 ? -6 : 1 - diaSetmana;

  primerDiaSetmana.setDate(avui.getDate() + diferencia);
  primerDiaSetmana.setHours(0, 0, 0, 0);

  const ultimDiaSetmana = new Date(primerDiaSetmana);
  ultimDiaSetmana.setDate(primerDiaSetmana.getDate() + 6);
  ultimDiaSetmana.setHours(23, 59, 59, 999);

  return trainings.filter(t => {
    const data = new Date(t.data);
    return data >= primerDiaSetmana && data <= ultimDiaSetmana;
  }).length;
}


function pintarMarquesObjectiu() {
  const markersContainer = document.getElementById("progress-markers");
  if (!markersContainer) return;

  markersContainer.innerHTML = "";

  for (let i = 1; i < weeklyGoal; i++) {
    const marker = document.createElement("span");
    marker.classList.add("progress-marker");

    const position = (i / weeklyGoal) * 100;
    marker.style.left = `${position}%`;

    markersContainer.appendChild(marker);
  }
}

/* TOAST */

function mostrarToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function comprovarObjectiuSetmanalAssolit() {
  const sessionsSetmana = calcularSessionsSetmanaActual();

  if (sessionsSetmana === weeklyGoal) {
    mostrarToast(t("congratsGoal"));
  }
}

/* COACH PRO GUIAT */

const chatMessages = document.getElementById("chat-messages");

function pregunta(tipus) {
  let textPregunta = "";
  let resposta = "";

  if (tipus === "progres") {
    textPregunta = translations[currentLang].coachProgress;
    resposta = generarRespostaCoach("progres");
  }

  if (tipus === "setmana") {
    textPregunta = translations[currentLang].coachWeek;
    resposta = generarRespostaCoach("setmana");
  }

  if (tipus === "intensitat") {
    textPregunta = translations[currentLang].coachIntensity;
    resposta = generarRespostaCoach("intensitat");
  }

  if (tipus === "millora") {
    textPregunta = translations[currentLang].coachImprove;
    resposta = generarRespostaCoach("consell");
  }

  chatMessages.innerHTML += `<p class="user-message">${textPregunta}</p>`;

  setTimeout(() => {
    chatMessages.innerHTML += `<p class="ai-message">${resposta}</p>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 350);
}

/* AI COACH LOCAL */
function normalitzarText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function generarRespostaCoach(text) {
  const pregunta = normalitzarText(text);

  if (trainings.length === 0) {
    return t("noTrainings");
  }

  const total = trainings.length;
  const totalMinuts = trainings.reduce((sum, t) => sum + Number(t.durada || 0), 0);
  const intensitatMitjana = calcularMitjana(trainings.map(t => Number(t.intensitat || 0)));
  const sessionsSetmana = calcularSessionsSetmanaActual();

  const ordenats = [...trainings].sort((a, b) => new Date(a.data) - new Date(b.data));
  const ultim = ordenats[ordenats.length - 1];

  const tipusPreferit = obtenirTipusPreferit();
  const tendencia = calcularTendenciaIntensitat();

  if (currentLang === "es") {
  return generarRespostaCoachES(text);
}

if (currentLang === "en") {
  return generarRespostaCoachEN(text);
}

  if (
  pregunta.includes("progres") ||
  pregunta.includes("evolucio") ||
  pregunta.includes("rendiment") ||
  pregunta.includes("com vaig") ||
  pregunta.includes("analitza") ||
  pregunta.includes("resum")
) {
  return `Mirant les teves dades, portes ${total} entrenaments i ${totalMinuts} minuts acumulats. La teva intensitat mitjana és de ${intensitatMitjana}/10 i el tipus que més fas és ${tipusPreferit}. En general, estàs construint una base força bona.`;
}

if (
  pregunta.includes("setmana") ||
  pregunta.includes("objectiu") ||
  pregunta.includes("sessions em falten") ||
  pregunta.includes("he complert")
) {

  if (sessionsSetmana >= weeklyGoal) {
  return t("coachGoalReached")
    .replace("{current}", sessionsSetmana)
    .replace("{goal}", weeklyGoal);
}

return t("coachGoalPending")
  .replace("{current}", sessionsSetmana)
  .replace("{goal}", weeklyGoal)
  .replace("{remaining}", weeklyGoal - sessionsSetmana);

}

if (
  pregunta.includes("intensitat") ||
  pregunta.includes("fort") ||
  pregunta.includes("fluix") ||
  pregunta.includes("cansada") ||
  pregunta.includes("massa")
) {
  return `La teva intensitat mitjana és ${intensitatMitjana}/10. ${tendencia}`;
}

if (
  pregunta.includes("millor") ||
  pregunta.includes("consell") ||
  pregunta.includes("recoman") ||
  pregunta.includes("que faig") ||
  pregunta.includes("que hauria")
) {
  return generarConsell(total, Number(intensitatMitjana), sessionsSetmana, tipusPreferit);
}

if (
  pregunta.includes("ultim") ||
  pregunta.includes("darrer") ||
  pregunta.includes("ultima sessio") ||
  pregunta.includes("quan vaig entrenar")
) {
  return `El teu últim entrenament va ser ${ultim.tipus}, amb ${ultim.durada} minuts i una intensitat de ${ultim.intensitat}/10.`;
}

if (
  pregunta.includes("constant") ||
  pregunta.includes("regular") ||
  pregunta.includes("habit") ||
  pregunta.includes("disciplina") ||
  pregunta.includes("sovint")
) {
  return analitzarConstancia(sessionsSetmana);
}

if (
  pregunta.includes("tipus") ||
  pregunta.includes("faig mes") ||
  pregunta.includes("preferit") ||
  pregunta.includes("mateix") ||
  pregunta.includes("variant")
) {
  return `El tipus d’entrenament que més fas és ${tipusPreferit}. Si vols un progrés més complet, intenta combinar-lo amb altres tipus de sessió.`;
}

  return `He mirat les teves dades: tens ${total} entrenaments registrats, ${totalMinuts} minuts acumulats i una intensitat mitjana de ${intensitatMitjana}/10. Pots preguntar-me pel teu progrés, intensitat, constància o demanar-me un consell.`;
}

function generarRespostaCoachES(text) {
  const total = trainings.length;
  const totalMinuts = trainings.reduce((sum, t) => sum + Number(t.durada || 0), 0);
  const intensidadMedia = calcularMitjana(trainings.map(t => Number(t.intensitat || 0)));
  const sesionesSemana = calcularSessionsSetmanaActual();
  const tipoPreferido = obtenirTipusPreferit();

  if (text === "progres") {
    return `Llevas ${total} entrenamientos y ${totalMinuts} minutos acumulados. Tu intensidad media es de ${intensidadMedia}/10 y el tipo que más haces es ${tipoPreferido}.`;
  }

  if (text === "setmana") {
    return `Esta semana llevas ${sesionesSemana}/${weeklyGoal} sesiones. Te faltan ${Math.max(weeklyGoal - sesionesSemana, 0)} para llegar al objetivo.`;
  }

  if (text === "intensitat") {
    return `Tu intensidad media es de ${intensidadMedia}/10. Intenta alternar días suaves con días más intensos.`;
  }

  if (text === "consell") {
    return `Mi consejo es priorizar la constancia: intenta mantener ${weeklyGoal} sesiones por semana antes de subir mucho la intensidad.`;
  }
}

function generarRespostaCoachEN(text) {
  const total = trainings.length;
  const totalMinuts = trainings.reduce((sum, t) => sum + Number(t.durada || 0), 0);
  const avgIntensity = calcularMitjana(trainings.map(t => Number(t.intensitat || 0)));
  const sessionsWeek = calcularSessionsSetmanaActual();
  const favouriteType = obtenirTipusPreferit();

  if (text === "progres") {
    return `You have logged ${total} workouts and ${totalMinuts} total minutes. Your average intensity is ${avgIntensity}/10 and your most common workout type is ${favouriteType}.`;
  }

  if (text === "setmana") {
    return `This week you have completed ${sessionsWeek}/${weeklyGoal} sessions. You need ${Math.max(weeklyGoal - sessionsWeek, 0)} more to reach your goal.`;
  }

  if (text === "intensitat") {
    return `Your average intensity is ${avgIntensity}/10. Try alternating easier sessions with more intense ones.`;
  }

  if (text === "consell") {
    return `My advice is to focus on consistency first: keep ${weeklyGoal} sessions per week before increasing intensity too much.`;
  }
}


function calcularMitjana(valors) {
  if (valors.length === 0) return 0;
  const suma = valors.reduce((a, b) => a + b, 0);
  return (suma / valors.length).toFixed(1);
}

function obtenirTipusPreferit() {
  const comptador = {};

  trainings.forEach(t => {
    comptador[t.tipus] = (comptador[t.tipus] || 0) + 1;
  });

  return Object.keys(comptador).reduce((a, b) =>
    comptador[a] > comptador[b] ? a : b
  );
}

function calcularTendenciaIntensitat() {
  if (trainings.length < 4) {
    return "Encara necessito més entrenaments per veure una tendència clara.";
  }

  const ordenats = [...trainings].sort((a, b) => new Date(a.data) - new Date(b.data));

  const primeraMeitat = ordenats.slice(0, Math.floor(ordenats.length / 2));
  const segonaMeitat = ordenats.slice(Math.floor(ordenats.length / 2));

  const mitjanaPrimera = Number(calcularMitjana(primeraMeitat.map(t => Number(t.intensitat || 0))));
  const mitjanaSegona = Number(calcularMitjana(segonaMeitat.map(t => Number(t.intensitat || 0))));

  if (mitjanaSegona > mitjanaPrimera + 0.5) {
    return "La teva intensitat sembla anar pujant progressivament, bona senyal 💪";
  }

  if (mitjanaSegona < mitjanaPrimera - 0.5) {
    return "La teva intensitat ha baixat una mica últimament. Pot ser cansament o falta de recuperació.";
  }

  return "La teva intensitat es manté bastant estable.";
}

function generarConsell(total, intensitatMitjana, sessionsSetmana, tipusPreferit) {
  if (sessionsSetmana < weeklyGoal) {
    return `El millor consell ara és prioritzar constància: intenta arribar a ${weeklyGoal} sessions aquesta setmana abans de pujar intensitat.`;
  }

  if (intensitatMitjana >= 8) {
    return "Estàs entrenant amb intensitat alta. Vigila la recuperació i alterna dies suaus amb dies més exigents.";
  }

  if (intensitatMitjana <= 5) {
    return "La teva intensitat és moderada-baixa. Pots provar de pujar una mica el repte en alguna sessió, sense forçar massa.";
  }

  return `Vas força equilibrada. Com que fas molt ${tipusPreferit}, podries combinar-ho amb una sessió diferent per treballar el cos de manera més completa.`;
}

function analitzarConstancia(sessionsSetmana) {
  if (sessionsSetmana >= weeklyGoal) {
    return "Aquesta setmana estàs sent constant i has arribat al teu objectiu. Mantén aquest ritme 🔥";
  }

  if (sessionsSetmana === 0) {
    return "Aquesta setmana encara no has registrat cap sessió. Pots començar amb una sessió curta per recuperar el ritme.";
  }

  return `Aquesta setmana portes ${sessionsSetmana} sessió/ns. Vas en camí, però encara pots ser una mica més constant.`;
}

function mostrarResposta(text, tipus) {
  const chat = document.getElementById("chat-messages");

  chat.innerHTML += `<p class="ai-message">${text}</p>`;

  // suggeriments següents
  let suggeriments = "";

  if (tipus === "progres") {
    suggeriments = `
      <button onclick="pregunta('millora')">Com puc millorar?</button>
      <button onclick="pregunta('setmana')">Objectiu setmana</button>
    `;
  }

  if (tipus === "setmana") {
    suggeriments = `
      <button onclick="pregunta('progres')">Veure progrés</button>
      <button onclick="pregunta('intensitat')">Intensitat</button>
    `;
  }

  chat.innerHTML += `
    <div class="suggestions">
      ${suggeriments}
    </div>
  `;
}

/* HERO SCROLL EFFECT */

const heroScroll = document.querySelector(".hero-scroll");
const heroTitle = document.querySelector(".hero-title");
const heroText = document.querySelector(".hero-text");
const heroBtn = document.querySelector(".btn");
const aura1 = document.querySelector(".aura-1");
const aura2 = document.querySelector(".aura-2");

function animarHero() {
  if (!heroScroll || !heroTitle || !heroText || !heroBtn || !aura1 || !aura2) return;

  const rect = heroScroll.getBoundingClientRect();
  const total = rect.height - window.innerHeight;

  let progress = -rect.top / total;
  progress = Math.pow(progress, 1.2);
  progress = Math.max(0, Math.min(1, progress));

  heroTitle.style.transform = `translateY(${-progress * 40}px) scale(${1 + progress * 0.015})`;
  heroTitle.style.opacity = 1 - progress * 0.12;

  heroText.style.transform = `translateY(${-progress * 25}px)`;
  heroText.style.opacity = 1 - progress * 0.18;

  heroBtn.style.transform = `translateY(${-progress * 35}px)`;
  heroBtn.style.opacity = 1 - progress * 0.22;

  if (heroTag) {
    heroTag.style.transform = `translateY(${-progress * 25}px)`;
    heroTag.style.opacity = 1 - progress * 0.2;
  }

  aura1.style.transform = `translate(${-progress * 180}px, ${progress * 110}px) scale(${1 + progress * 0.75})`;
  aura2.style.transform = `translate(${progress * 190}px, ${-progress * 80}px) scale(${1 + progress * 0.9})`;
}

window.addEventListener("scroll", animarHero);

/* CALENDARI ANUAL */
function mostrarVistaAnual() {
  const calendarView = document.getElementById("calendar-view");
  const annualView = document.getElementById("annual-view");

  calendarView.style.display = "none";
  annualView.style.display = "block";

  document.querySelector(".calendar-controls").style.display = "none";
  document.querySelector(".goals-card").style.display = "none";

  const title = document.querySelector(".calendar-title-row h2");
  title.innerHTML = translations[currentLang].annualCalendarTitle;

  pintarResumAnual();

  setTimeout(() => {
    annualView.classList.add("active");
  }, 10);
}

function tornarCalendari() {
  const calendarView = document.getElementById("calendar-view");
  const annualView = document.getElementById("annual-view");

  annualView.classList.remove("active");

  setTimeout(() => {
    annualView.style.display = "none";
    calendarView.style.display = "block";

    document.querySelector(".calendar-controls").style.display = "flex";
    document.querySelector(".goals-card").style.display = "flex";

    actualitzarTitolMes();
  }, 250);
}

function actualitzarTitolMes() {
  const mes = currentCalendarDate.getMonth();
  const nomMes = mesosPerIdioma[currentLang][mes];
  const title = document.querySelector(".calendar-title-row h2");

  if (currentLang === "ca") {
    title.innerHTML = `Dies entrenats ${connectorMesCa(nomMes)}<span id="month-name" class="month-name">${nomMes}</span>`;
  }

  if (currentLang === "es") {
    title.innerHTML = `Días entrenados de <span id="month-name" class="month-name">${nomMes}</span>`;
  }

  if (currentLang === "en") {
    title.innerHTML = `Training days in <span id="month-name" class="month-name">${nomMes}</span>`;
  }
}

function pintarResumAnual() {
  const annualCalendar = document.getElementById("annual-calendar");
  if (!annualCalendar) return;

  annualCalendar.innerHTML = "";

  const anyActual = new Date().getFullYear();

  const mesos = mesosPerIdioma[currentLang];

  mesos.forEach((nomMes, indexMes) => {
    const diesMes = new Date(anyActual, indexMes + 1, 0).getDate();

    const monthCard = document.createElement("div");
    monthCard.classList.add("month-card");

    monthCard.innerHTML = `
      <h3>${nomMes}</h3>
      <div class="month-days"></div>
    `;

    const monthDays = monthCard.querySelector(".month-days");

    for (let dia = 1; dia <= diesMes; dia++) {
      const day = document.createElement("div");
      day.classList.add("year-day");

      const entrenat = trainings.some(t => {
        const data = new Date(t.data + "T00:00:00");

        return (
          data.getFullYear() === anyActual &&
          data.getMonth() === indexMes &&
          data.getDate() === dia
        );
      });

      if (entrenat) {
        day.classList.add("trained-year-day");
      }

      monthDays.appendChild(day);
    }

    annualCalendar.appendChild(monthCard);
  });
}

/* INTENSITAT GRAF */
function canviarGrafica(mode, boto) {
  chartMode = mode;

  document.querySelectorAll(".chart-toggle-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  boto.classList.add("active");
  pintarGraficaIntensitat();
}

function pintarGraficaIntensitat() {
  const chart = document.getElementById("intensity-chart");
  if (!chart) return;

  chart.innerHTML = "";

  let dades = [];

  if (chartMode === "last10") {
    dades = [...trainings]
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(-10)
      .map(t => {
        const data = new Date(t.data + "T00:00:00");
        return {
          label: `${data.getDate()}/${data.getMonth() + 1}`,
          value: Number(t.intensitat || 0)
        };
      });
  }

  if (chartMode === "monthly") {
    const mesos = mesosCurtsPerIdioma[currentLang];
    const anyActual = new Date().getFullYear();

    dades = mesos.map((mesNom, indexMes) => {
      const entrenamentsMes = trainings.filter(t => {
        const data = new Date(t.data + "T00:00:00");
        return data.getFullYear() === anyActual && data.getMonth() === indexMes;
      });

      const mitjana = entrenamentsMes.length === 0
        ? 0
        : entrenamentsMes.reduce((sum, t) => sum + Number(t.intensitat || 0), 0) / entrenamentsMes.length;

      return {
        label: mesNom,
        value: Number(mitjana.toFixed(1))
      };
    });
  }

  if (dades.length === 0 || dades.every(d => d.value === 0)) {
    chart.innerHTML = `<p class='chart-empty'>${t("noIntensityData")}</p>`;
    return;
  }

  dades.forEach(d => {
    const altura = Math.max((d.value / 10) * 180, d.value === 0 ? 0 : 6);

    const column = document.createElement("div");
    column.classList.add("chart-column");

    column.innerHTML = `
      <span class="chart-value">${d.value}</span>
      <div class="chart-bar" style="height: ${altura}px;"></div>
      <span class="chart-date">${d.label}</span>
    `;

    chart.appendChild(column);
  });
}

/* SCROLL NOM */
const nav = document.querySelector("nav");

function animarNavTitle() {
  if (window.scrollY > 90) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", animarNavTitle);
animarNavTitle();

function anarInici() {
  const botoInici = document.querySelector('[data-i18n="navHome"]');
  canviarTab("inici", botoInici);
}

function toggleMenu() {
  document.getElementById("nav-menu").classList.toggle("open");
}

/* LOGIN */
function login() {
  const provider = new window.GoogleAuthProvider();

  window.signInWithPopup(window.firebaseAuth, provider)
    .catch(error => {
      console.error(error);
      mostrarToast(t("loginFail"));
    });
}

function logout() {
  window.signOut(window.firebaseAuth)
    .catch(error => console.error(error));
}

window.addEventListener("firebase-ready", () => {
  window.onAuthStateChanged(window.firebaseAuth, async user => {
    currentUser = user;

    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    const profileLoginBtn = document.getElementById("profile-login-btn");
    const profileLogoutBtn = document.getElementById("profile-logout-btn");

    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profilePhoto = document.getElementById("profile-photo");

    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";

      if (profileLoginBtn) profileLoginBtn.style.display = "none";
      if (profileLogoutBtn) profileLogoutBtn.style.display = "block";

      tancarWelcome();

      if (profileName) profileName.textContent = user.displayName || "Usuari";
      if (profileEmail) profileEmail.textContent = user.email || "";
      if (profilePhoto && user.photoURL) profilePhoto.src = user.photoURL;

      await carregarEntrenamentsFirebase();
      await carregarRutinesFirebase();

    } else {
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";

      if (profileLoginBtn) profileLoginBtn.style.display = "block";
      if (profileLogoutBtn) profileLogoutBtn.style.display = "none";

      if (profileName) profileName.textContent = t("noSession");
      if (profileEmail) profileEmail.textContent = t("loginPrompt");
      if (profilePhoto) profilePhoto.src = "images/logo.jpg";

      //trainings = JSON.parse(localStorage.getItem("trainings-demo")) || [];

      trainings = [];
      routines = [];
      pintarRutines();

      pintarCalendari();
      actualitzarProgres();
      amagarDetall();
      mostrarWelcomeSiCal();
    }
  });
});

pintarCalendari();
actualitzarProgres();
pintarRutines();
comprovarObjectiuSetmanalAssolit();
animarHero();
document.body.classList.add("home-active");
setLanguage(currentLang);
