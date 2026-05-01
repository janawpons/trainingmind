const form = document.getElementById("training-form");
const calendar = document.getElementById("calendar");
const trainingDetail = document.getElementById("training-detail");

let trainings = [];
let currentUser = null;
let editingId = null;
let weeklyGoal = Number(localStorage.getItem("weeklyGoal")) || 4;
let currentCalendarDate = new Date();

let pendingDeleteId = null;
let deletedTraining = null;
let undoTimeout = null;
let lastSavedDate = null;
let chartMode = "last10";
const heroTag = document.querySelector(".hero-content .tag");

const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const monthName = document.getElementById("month-name");

/* TRADUCCIÓ */
const translations = {
  ca: {
    navHome: "Inici",
    navCalendar: "Calendari",
    navEvolution: "Evolució",
    navCoach: "AI Coach",

    heroTag: "Pilates · Barre · Força · Benestar",
    heroTitle: "Registra els teus entrenaments i entén la teva evolució",
    heroText: "Guarda cada sessió, consulta el calendari i analitza el teu progrés.",
    heroButton: "Registra el teu entrenament",

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

    calendarTag: "Calendari",
    calendarTitlePrefix: "Dies entrenats d’",
    monthlyGoalDefault: "Aquest mes has complert 0/0 setmanes",
    annualSummary: "Resum anual",
    backCalendar: "Tornar al calendari",

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

    footerCreated: "Creat per Jana Pons · Training Mind",
    footerContact: "Contacte:"
  },

  es: {
    navHome: "Inicio",
    navCalendar: "Calendario",
    navEvolution: "Evolución",
    navCoach: "AI Coach",

    heroTag: "Pilates · Barre · Fuerza · Bienestar",
    heroTitle: "Registra tus entrenamientos y entiende tu evolución",
    heroText: "Guarda cada sesión, consulta el calendario y analiza tu progreso.",
    heroButton: "Registra tu entrenamiento",

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

    calendarTag: "Calendario",
    calendarTitlePrefix: "Días entrenados de ",
    monthlyGoalDefault: "Este mes has cumplido 0/0 semanas",
    annualSummary: "Resumen anual",
    backCalendar: "Volver al calendario",

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

    footerCreated: "Creado por Jana Pons · Training Mind",
    footerContact: "Contacto:"
  },

  en: {
    navHome: "Home",
    navCalendar: "Calendar",
    navEvolution: "Progress",
    navCoach: "AI Coach",

    heroTag: "Pilates · Barre · Strength · Wellness",
    heroTitle: "Log your workouts and understand your progress",
    heroText: "Save each session, check the calendar and analyze your progress.",
    heroButton: "Log your workout",

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

    calendarTag: "Calendar",
    calendarTitlePrefix: "Training days in ",
    monthlyGoalDefault: "This month you completed 0/0 weeks",
    annualSummary: "Year summary",
    backCalendar: "Back to calendar",

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
    
    footerCreated: "Created by Jana Pons · Training Mind",
    footerContact: "Contact:"
  }
};

function t(key) {
  return translations[currentLang][key] || key;
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

async function guardarEntrenamentFirebase(training) {
  if (!currentUser) {
    mostrarToast("Has de fer login per guardar entrenaments");
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
  if (!currentUser) return;

  const ref = window.doc(window.firebaseDB, "users", currentUser.uid, "trainings", String(id));
  await window.deleteDoc(ref);
  await carregarEntrenamentsFirebase();
}

prevMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  pintarCalendari();
});

nextMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  pintarCalendari();
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

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const isEditing = editingId !== null;

  const training = {
    id: editingId !== null ? editingId : Date.now(),
    data: document.getElementById("data").value,
    tipus: document.getElementById("tipus").value,
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

  mostrarToast(isEditing ? "Entrenament actualitzat" : "Entrenament guardat");
  
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
            <span class="training-stripe ${classeTipus(t.tipus)} ${classeLloc(t.lloc)}"></span>
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

function classeTipus(tipus) {
  if (tipus === "Pilates") return "type-pilates";
  if (tipus === "Barre") return "type-barre";
  if (tipus === "Força") return "type-strength";
  if (tipus === "Cardio") return "type-cardio";
  return "type-default";
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

  document.querySelector("#training-form .form-btn").textContent = "Actualitzar";

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

document.getElementById("undo-btn").addEventListener("click", () => {
  if (!deletedTraining) return;

  trainings.push(deletedTraining);
  localStorage.setItem("trainings", JSON.stringify(trainings));

  pintarCalendari();
  actualitzarProgres();

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
    `${sessionsThisWeek} / ${weeklyGoal} sessions`;

  document.getElementById("weekly-progress-fill").style.width = `${percent}%`;

  document.getElementById("monthly-goal-message").textContent =
    calcularObjectiuMensual();

  pintarMarquesObjectiu();
  pintarGraficaIntensitat();
}

function calcularObjectiuMensual() {
  const any = currentCalendarDate.getFullYear();
  const mes = currentCalendarDate.getMonth();

  const setmanes = {};

  trainings.forEach(t => {
    const data = new Date(t.data + "T00:00:00");

    if (data.getFullYear() !== any || data.getMonth() !== mes) return;

    const dilluns = new Date(data);
    const diaSetmana = data.getDay();
    const diferencia = diaSetmana === 0 ? -6 : 1 - diaSetmana;

    dilluns.setDate(data.getDate() + diferencia);
    dilluns.setHours(0, 0, 0, 0);

    const clau = dilluns.toISOString().split("T")[0];

    if (!setmanes[clau]) {
      setmanes[clau] = 0;
    }

    setmanes[clau]++;
  });

  const totalsSetmanes = Object.keys(setmanes).length;
  const setmanesComplertes = Object.values(setmanes).filter(total => total >= weeklyGoal).length;

  return `Aquest mes has complert ${setmanesComplertes}/${totalsSetmanes} setmanes`;
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
    return `Aquesta setmana portes ${sessionsSetmana}/${weeklyGoal} sessions. Has complert l’objectiu setmanal, molt bé 🔥`;
  }

  return `Aquesta setmana portes ${sessionsSetmana}/${weeklyGoal} sessions. Et falten ${weeklyGoal - sessionsSetmana} sessió/ns per arribar a l’objectiu. Encara hi ets a temps.`;
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
    chart.innerHTML = "<p class='chart-empty'>Encara no hi ha dades d'intensitat.</p>";
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
      mostrarToast("Error iniciant sessió");
    });
}

function logout() {
  window.signOut(window.firebaseAuth)
    .catch(error => console.error(error));
}

window.addEventListener("firebase-ready", () => {
  window.onAuthStateChanged(window.firebaseAuth, async user => {
    currentUser = user;

    if (user) {
      document.getElementById("login-btn").style.display = "none";
      document.getElementById("logout-btn").style.display = "inline-block";

      await carregarEntrenamentsFirebase();
    } else {
      document.getElementById("login-btn").style.display = "inline-block";
      document.getElementById("logout-btn").style.display = "none";

      trainings = [];
      pintarCalendari();
      actualitzarProgres();
      amagarDetall();
    }
  });
});

/* INICI */
pintarCalendari();
actualitzarProgres();
animarHero();
document.body.classList.add("home-active");
setLanguage(currentLang);