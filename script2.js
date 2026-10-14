"use strict";

/* =====================================================
   GESTION DES ÉTUDIANTS UNCHK
   ===================================================== */

const CLE_STOCKAGE = "etudiantsUNCHK";
const CLE_THEME = "themeUNCHK";
const NOTE_PASSAGE = 10;
const CLASSES = ["L1", "L2", "L3", "M1", "M2"];
const NOMS_CLASSES = {
  L1: "Licence 1",
  L2: "Licence 2",
  L3: "Licence 3",
  M1: "Master 1",
  M2: "Master 2",
};

/* ---------- Sélecteurs ---------- */
const $ = (id) => document.getElementById(id);

const formulaire = $("formulaireEtudiant");
const champNom = $("nom");
const champPrenom = $("prenom");
const champEmail = $("email");
const champClasse = $("classe");
const champNote = $("note");
const messageErreur = $("messageErreur");
const messageSucces = $("messageSucces");

const champRecherche = $("recherche");
const filtreClasse = $("filtreClasse");
const filtreResultat = $("filtreResultat");
const triEtudiants = $("triEtudiants");
const taillePage = $("taillePage");

const listeEtudiants = $("listeEtudiants");
const aucunEtudiant = $("aucunEtudiant");
const compteurResultats = $("compteurResultats");
const pagination = $("pagination");

const modalEdition = $("modalEdition");
const formulaireEdition = $("formulaireEdition");
const modalConfirmation = $("modalConfirmation");
const toast = $("toast");

/* ---------- État ---------- */
let etudiants = charger();
let pageCourante = 1;
let idEnEdition = null;
let idASupprimer = null;
let minuteurToast = null;
let minuteurRecherche = null;
let dernierFocus = null;

/* =====================================================
   STOCKAGE
   ===================================================== */
function charger() {
  try {
    const donnees = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

function sauvegarder() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etudiants));
  } catch {
    afficherToast("Impossible d'enregistrer les données.", true);
  }
}

function nouvelId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* =====================================================
   UTILITAIRES
   ===================================================== */
function echapper(texte) {
  return String(texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function echapperRegex(texte) {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normaliser(texte) {
  return String(texte)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function surligner(texte, terme) {
  const sur = echapper(texte);
  if (!terme) return sur;
  const regex = new RegExp("(" + echapperRegex(echapper(terme)) + ")", "gi");
  return sur.replace(regex, "<mark>$1</mark>");
}

function formaterNote(note) {
  return Number(note).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function estAdmis(note) {
  return Number(note) >= NOTE_PASSAGE;
}

function emailValide(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function afficherToast(message, erreur = false) {
  toast.textContent = message;
  toast.classList.toggle("toast-erreur", erreur);
  toast.classList.add("visible");
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => toast.classList.remove("visible"), 3200);
}

/* =====================================================
   VALIDATION
   ===================================================== */
function valider(donnees, idIgnore = null) {
  const erreurs = [];
  const champsInvalides = [];

  if (donnees.nom.length < 2) {
    erreurs.push("Le nom doit contenir au moins 2 caractères.");
    champsInvalides.push("nom");
  }
  if (donnees.prenom.length < 2) {
    erreurs.push("Le prénom doit contenir au moins 2 caractères.");
    champsInvalides.push("prenom");
  }
  if (!emailValide(donnees.email)) {
    erreurs.push("L'adresse email n'est pas valide.");
    champsInvalides.push("email");
  } else if (
    etudiants.some(
      (e) =>
        e.id !== idIgnore &&
        e.email.toLowerCase() === donnees.email.toLowerCase(),
    )
  ) {
    erreurs.push("Cet email est déjà utilisé par un autre étudiant.");
    champsInvalides.push("email");
  }
  if (!CLASSES.includes(donnees.classe)) {
    erreurs.push("La classe choisie n'est pas valide.");
    champsInvalides.push("classe");
  }
  if (
    donnees.note === "" ||
    Number.isNaN(Number(donnees.note)) ||
    Number(donnees.note) < 0 ||
    Number(donnees.note) > 20
  ) {
    erreurs.push("La note doit être comprise entre 0 et 20.");
    champsInvalides.push("note");
  }

  return { erreurs, champsInvalides };
}

/* =====================================================
   AJOUT
   ===================================================== */
function lireFormulaireAjout() {
  return {
    nom: champNom.value.trim(),
    prenom: champPrenom.value.trim(),
    email: champEmail.value.trim(),
    classe: champClasse.value,
    note: champNote.value.trim(),
  };
}

function marquerInvalides(champs, prefixe = "") {
  const ids = ["nom", "prenom", "email", "classe", "note"];
  ids.forEach((nom) => {
    const el = $(
      prefixe ? prefixe + nom.charAt(0).toUpperCase() + nom.slice(1) : nom,
    );
    if (el) el.classList.toggle("invalide", champs.includes(nom));
  });
}

formulaire.addEventListener("submit", (e) => {
  e.preventDefault();
  messageErreur.textContent = "";
  messageSucces.textContent = "";

  const donnees = lireFormulaireAjout();
  const { erreurs, champsInvalides } = valider(donnees);
  marquerInvalides(champsInvalides);

  if (erreurs.length) {
    messageErreur.textContent = erreurs[0];
    return;
  }

  etudiants.push({
    id: nouvelId(),
    nom: donnees.nom,
    prenom: donnees.prenom,
    email: donnees.email,
    classe: donnees.classe,
    note: Number(donnees.note),
    creeLe: Date.now(),
  });
  sauvegarder();

  formulaire.reset();
  marquerInvalides([]);
  messageSucces.textContent = "Étudiant ajouté avec succès.";
  setTimeout(() => (messageSucces.textContent = ""), 3000);

  if (triEtudiants.value === "recent") pageCourante = 1;
  afficher();
  champNom.focus();
});

formulaire.addEventListener("reset", () => {
  messageErreur.textContent = "";
  messageSucces.textContent = "";
  marquerInvalides([]);
});

["nom", "prenom", "email", "classe", "note"].forEach((nom) => {
  $(nom).addEventListener("input", () => $(nom).classList.remove("invalide"));
});

/* =====================================================
   MODALES (gestion commune)
   ===================================================== */
function ouvrirModal(modal, focusSur) {
  dernierFocus = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  if (focusSur) setTimeout(() => focusSur.focus(), 30);
}

function fermerModal(modal) {
  modal.hidden = true;
  if (modalEdition.hidden && modalConfirmation.hidden) {
    document.body.style.overflow = "";
  }
  if (dernierFocus && typeof dernierFocus.focus === "function") {
    dernierFocus.focus();
  }
}

[modalEdition, modalConfirmation].forEach((modal) => {
  // Clic sur le fond sombre
  modal.addEventListener("mousedown", (e) => {
    if (e.target === modal) fermerModal(modal);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!modalConfirmation.hidden) fermerModal(modalConfirmation);
  else if (!modalEdition.hidden) fermerModal(modalEdition);
});

/* =====================================================
   MODIFICATION (fenêtre modale)
   ===================================================== */
function ouvrirEdition(id) {
  const etu = etudiants.find((x) => x.id === id);
  if (!etu) return;

  idEnEdition = id;
  $("editNom").value = etu.nom;
  $("editPrenom").value = etu.prenom;
  $("editEmail").value = etu.email;
  $("editClasse").value = etu.classe;
  $("editNote").value = etu.note;
  $("erreurEdition").textContent = "";
  marquerInvalides([], "edit");
  ouvrirModal(modalEdition, $("editNom"));
}

modalEdition.querySelectorAll("[data-fermer]").forEach((btn) => {
  btn.addEventListener("click", () => fermerModal(modalEdition));
});

formulaireEdition.addEventListener("submit", (e) => {
  e.preventDefault();
  const donnees = {
    nom: $("editNom").value.trim(),
    prenom: $("editPrenom").value.trim(),
    email: $("editEmail").value.trim(),
    classe: $("editClasse").value,
    note: $("editNote").value.trim(),
  };

  const { erreurs, champsInvalides } = valider(donnees, idEnEdition);
  marquerInvalides(champsInvalides, "edit");
  if (erreurs.length) {
    $("erreurEdition").textContent = erreurs[0];
    return;
  }

  const etu = etudiants.find((x) => x.id === idEnEdition);
  if (etu) {
    etu.nom = donnees.nom;
    etu.prenom = donnees.prenom;
    etu.email = donnees.email;
    etu.classe = donnees.classe;
    etu.note = Number(donnees.note);
    sauvegarder();
    afficher();
    afficherToast("Étudiant modifié avec succès.");
  }
  fermerModal(modalEdition);
});

["Nom", "Prenom", "Email", "Classe", "Note"].forEach((suffixe) => {
  $("edit" + suffixe).addEventListener("input", (e) =>
    e.target.classList.remove("invalide"),
  );
});

/* =====================================================
   SUPPRESSION (confirmation personnalisée)
   ===================================================== */
function demanderSuppression(id) {
  const etu = etudiants.find((x) => x.id === id);
  if (!etu) return;
  idASupprimer = id;
  $("texteConfirm").textContent =
    `Vous êtes sur le point de supprimer ${etu.prenom} ${etu.nom}. Cette action est irréversible.`;
  ouvrirModal(modalConfirmation, $("btnAnnulerSuppression"));
}

$("btnAnnulerSuppression").addEventListener("click", () => {
  idASupprimer = null;
  fermerModal(modalConfirmation);
});

$("btnConfirmerSuppression").addEventListener("click", () => {
  if (idASupprimer) {
    etudiants = etudiants.filter((x) => x.id !== idASupprimer);
    sauvegarder();
    afficher();
    afficherToast("Étudiant supprimé.");
  }
  idASupprimer = null;
  fermerModal(modalConfirmation);
});

/* =====================================================
   RECHERCHE / FILTRES / TRI
   ===================================================== */
function etudiantsFiltres() {
  const terme = normaliser(champRecherche.value);
  const classe = filtreClasse.value;
  const resultat = filtreResultat.value;

  let liste = etudiants.filter((e) => {
    if (classe && e.classe !== classe) return false;
    if (resultat === "admis" && !estAdmis(e.note)) return false;
    if (resultat === "echec" && estAdmis(e.note)) return false;
    if (!terme) return true;
    const texte = normaliser(
      [e.nom, e.prenom, e.email, e.classe, NOMS_CLASSES[e.classe]].join(" "),
    );
    return terme.split(/\s+/).every((mot) => texte.includes(mot));
  });

  const comparerTexte = (a, b) => a.localeCompare(b, "fr", { sensitivity: "base" });

  switch (triEtudiants.value) {
    case "nom-az":
      liste.sort((a, b) => comparerTexte(a.nom, b.nom) || comparerTexte(a.prenom, b.prenom));
      break;
    case "nom-za":
      liste.sort((a, b) => comparerTexte(b.nom, a.nom) || comparerTexte(b.prenom, a.prenom));
      break;
    case "note-desc":
      liste.sort((a, b) => b.note - a.note);
      break;
    case "note-asc":
      liste.sort((a, b) => a.note - b.note);
      break;
    case "classe":
      liste.sort(
        (a, b) =>
          CLASSES.indexOf(a.classe) - CLASSES.indexOf(b.classe) ||
          comparerTexte(a.nom, b.nom),
      );
      break;
    default: // recent
      liste.sort((a, b) => (b.creeLe || 0) - (a.creeLe || 0));
  }
  return liste;
}

champRecherche.addEventListener("input", () => {
  clearTimeout(minuteurRecherche);
  minuteurRecherche = setTimeout(() => {
    pageCourante = 1;
    afficher();
  }, 120);
});

[filtreClasse, filtreResultat, triEtudiants, taillePage].forEach((el) => {
  el.addEventListener("change", () => {
    pageCourante = 1;
    afficher();
  });
});

$("btnReinitFiltres").addEventListener("click", () => {
  champRecherche.value = "";
  filtreClasse.value = "";
  filtreResultat.value = "";
  triEtudiants.value = "recent";
  pageCourante = 1;
  afficher();
});

/* =====================================================
   AFFICHAGE : STATISTIQUES
   ===================================================== */
function afficherStatistiques() {
  const total = etudiants.length;
  const admis = etudiants.filter((e) => estAdmis(e.note)).length;
  const somme = etudiants.reduce((s, e) => s + e.note, 0);
  const moyenne = total ? somme / total : 0;
  const taux = total ? (admis / total) * 100 : 0;

  $("totalEtudiants").textContent = total;
  $("moyenneGenerale").textContent = formaterNote(moyenne);
  $("totalAdmis").textContent = admis;
  $("tauxReussite").textContent =
    taux.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %";

  if (total) {
    const meilleur = etudiants.reduce((m, e) => (e.note > m.note ? e : m));
    $("meilleurEtudiant").textContent = `${meilleur.prenom} ${meilleur.nom}`;
    $("meilleureNote").textContent = `${formaterNote(meilleur.note)} / 20`;
  } else {
    $("meilleurEtudiant").textContent = "-";
    $("meilleureNote").textContent = "";
  }
}

/* =====================================================
   AFFICHAGE : GRAPHIQUES
   ===================================================== */
function dessinerBarres(conteneur, lignes) {
  const max = Math.max(...lignes.map((l) => l.valeur), 0);
  if (!max) {
    conteneur.innerHTML = '<p class="vide-graphique">Aucune donnée.</p>';
    return;
  }
  conteneur.innerHTML = lignes
    .map(
      (l) => `
      <div class="barre-ligne">
        <span>${echapper(l.libelle)}</span>
        <div class="barre-piste"><div class="barre-remplie" style="width:${(l.valeur / max) * 100}%"></div></div>
        <span class="barre-valeur">${l.valeur}</span>
      </div>`,
    )
    .join("");
}

function afficherGraphiques() {
  // Étudiants par classe
  dessinerBarres(
    $("graphClasses"),
    CLASSES.map((c) => ({
      libelle: c,
      valeur: etudiants.filter((e) => e.classe === c).length,
    })),
  );

  // Admis / ajournés
  const total = etudiants.length;
  const admis = etudiants.filter((e) => estAdmis(e.note)).length;
  const pct = total ? Math.round((admis / total) * 100) : 0;
  $("graphDonut").style.setProperty("--pct", total ? (admis / total) * 100 : 0);
  $("donutPct").textContent = pct + " %";
  $("legAdmis").textContent = admis;
  $("legEchec").textContent = total - admis;

  // Répartition des notes
  const tranches = [
    { libelle: "0 – 5", min: 0, max: 5 },
    { libelle: "5 – 10", min: 5, max: 10 },
    { libelle: "10 – 15", min: 10, max: 15 },
    { libelle: "15 – 20", min: 15, max: 20.01 },
  ];
  dessinerBarres(
    $("graphNotes"),
    tranches.map((t) => ({
      libelle: t.libelle,
      valeur: etudiants.filter((e) => e.note >= t.min && e.note < t.max).length,
    })),
  );
}

/* =====================================================
   AFFICHAGE : TABLEAU + PAGINATION
   ===================================================== */
function pagesAAfficher(courante, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, courante, courante - 1, courante + 1]);
  const triees = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const resultat = [];
  triees.forEach((p, i) => {
    if (i > 0 && p - triees[i - 1] > 1) resultat.push("…");
    resultat.push(p);
  });
  return resultat;
}

function afficherPagination(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }
  const boutons = [];
  boutons.push(
    `<button type="button" data-page="${pageCourante - 1}" ${pageCourante === 1 ? "disabled" : ""} aria-label="Page précédente"><i class="fa-solid fa-chevron-left"></i></button>`,
  );
  pagesAAfficher(pageCourante, totalPages).forEach((p) => {
    if (p === "…") {
      boutons.push('<button type="button" disabled>…</button>');
    } else {
      boutons.push(
        `<button type="button" data-page="${p}" class="${p === pageCourante ? "actif" : ""}" ${p === pageCourante ? 'aria-current="page"' : ""}>${p}</button>`,
      );
    }
  });
  boutons.push(
    `<button type="button" data-page="${pageCourante + 1}" ${pageCourante === totalPages ? "disabled" : ""} aria-label="Page suivante"><i class="fa-solid fa-chevron-right"></i></button>`,
  );
  pagination.innerHTML = boutons.join("");
}

pagination.addEventListener("click", (e) => {
  const bouton = e.target.closest("button[data-page]");
  if (!bouton || bouton.disabled) return;
  pageCourante = Number(bouton.dataset.page);
  afficher();
  document.querySelector(".tableau").scrollIntoView({ behavior: "smooth", block: "start" });
});

function afficherTableau() {
  const liste = etudiantsFiltres();
  const parPage = Number(taillePage.value) || 10;
  const totalPages = Math.max(1, Math.ceil(liste.length / parPage));
  if (pageCourante > totalPages) pageCourante = totalPages;
  if (pageCourante < 1) pageCourante = 1;

  const debut = (pageCourante - 1) * parPage;
  const page = liste.slice(debut, debut + parPage);
  const terme = champRecherche.value.trim();

  listeEtudiants.innerHTML = page
    .map((e, i) => {
      const admis = estAdmis(e.note);
      return `
      <tr>
        <td>${debut + i + 1}</td>
        <td>${surligner(e.nom, terme)}</td>
        <td>${surligner(e.prenom, terme)}</td>
        <td>${surligner(e.email, terme)}</td>
        <td>${surligner(e.classe, terme)}</td>
        <td>${formaterNote(e.note)} / 20</td>
        <td><span class="${admis ? "admis" : "echec"}">${admis ? "Admis" : "Ajourné"}</span></td>
        <td>
          <div class="cellule-actions">
            <button type="button" class="btn-modifier" data-action="modifier" data-id="${echapper(e.id)}" title="Modifier" aria-label="Modifier ${echapper(e.prenom)} ${echapper(e.nom)}"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="btn-supprimer" data-action="supprimer" data-id="${echapper(e.id)}" title="Supprimer" aria-label="Supprimer ${echapper(e.prenom)} ${echapper(e.nom)}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  // Messages
  if (!etudiants.length) {
    aucunEtudiant.textContent = "Aucun étudiant enregistré.";
    aucunEtudiant.hidden = false;
  } else if (!liste.length) {
    aucunEtudiant.textContent = "Aucun étudiant ne correspond à votre recherche.";
    aucunEtudiant.hidden = false;
  } else {
    aucunEtudiant.hidden = true;
  }

  if (liste.length) {
    compteurResultats.textContent =
      `${liste.length} étudiant${liste.length > 1 ? "s" : ""}` +
      (liste.length !== etudiants.length ? ` sur ${etudiants.length}` : "") +
      ` — affichage ${debut + 1} à ${debut + page.length}`;
  } else {
    compteurResultats.textContent = "Consultez et gérez les inscriptions.";
  }

  afficherPagination(totalPages);
}

listeEtudiants.addEventListener("click", (e) => {
  const bouton = e.target.closest("button[data-action]");
  if (!bouton) return;
  if (bouton.dataset.action === "modifier") ouvrirEdition(bouton.dataset.id);
  if (bouton.dataset.action === "supprimer") demanderSuppression(bouton.dataset.id);
});

function afficher() {
  afficherStatistiques();
  afficherGraphiques();
  afficherTableau();
}

/* =====================================================
   EXPORTS
   ===================================================== */
function lignesExport() {
  return etudiantsFiltres().map((e, i) => ({
    "#": i + 1,
    Nom: e.nom,
    Prénom: e.prenom,
    Email: e.email,
    Classe: e.classe,
    Note: e.note,
    Résultat: estAdmis(e.note) ? "Admis" : "Ajourné",
  }));
}

function dateFichier() {
  return new Date().toISOString().slice(0, 10);
}

function telecharger(blob, nom) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$("btnExportExcel").addEventListener("click", () => {
  const lignes = lignesExport();
  if (!lignes.length) {
    afficherToast("Aucun étudiant à exporter.", true);
    return;
  }
  if (typeof XLSX === "undefined") {
    afficherToast("La bibliothèque Excel n'a pas pu être chargée.", true);
    return;
  }
  const feuille = XLSX.utils.json_to_sheet(lignes);
  feuille["!cols"] = [{ wch: 4 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, "Étudiants");
  XLSX.writeFile(classeur, `etudiants_${dateFichier()}.xlsx`);
  afficherToast("Export Excel terminé.");
});

function celluleCSV(valeur) {
  let texte = String(valeur ?? "");
  // Protection contre l'injection de formules dans Excel
  if (/^[=+\-@\t\r]/.test(texte) && Number.isNaN(Number(texte))) texte = "'" + texte;
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

$("btnExportCSV").addEventListener("click", () => {
  const lignes = lignesExport();
  if (!lignes.length) {
    afficherToast("Aucun étudiant à exporter.", true);
    return;
  }
  const entetes = ["Nom", "Prénom", "Email", "Classe", "Note", "Résultat"];
  const contenu = [
    entetes.join(";"),
    ...lignes.map((l) => entetes.map((h) => celluleCSV(l[h])).join(";")),
  ].join("\r\n");

  // BOM UTF-8 pour que Excel affiche correctement les accents
  telecharger(
    new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" }),
    `etudiants_${dateFichier()}.csv`,
  );
  afficherToast("Export CSV terminé.");
});

/* =====================================================
   IMPORT CSV
   ===================================================== */
function detecterSeparateur(texte) {
  const premiere = texte.split(/\r?\n/)[0] || "";
  const compte = (c) => premiere.split(c).length - 1;
  const choix = [";", ",", "\t"].map((c) => [c, compte(c)]).sort((a, b) => b[1] - a[1]);
  return choix[0][1] > 0 ? choix[0][0] : ";";
}

function analyserCSV(texte, sep) {
  const lignes = [];
  let ligne = [];
  let champ = "";
  let entreGuillemets = false;

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (entreGuillemets) {
      if (c === '"' && texte[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (c === '"') {
        entreGuillemets = false;
      } else {
        champ += c;
      }
    } else if (c === '"') {
      entreGuillemets = true;
    } else if (c === sep) {
      ligne.push(champ);
      champ = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      ligne.push(champ);
      lignes.push(ligne);
      ligne = [];
      champ = "";
    } else {
      champ += c;
    }
  }
  if (champ !== "" || ligne.length) {
    ligne.push(champ);
    lignes.push(ligne);
  }
  return lignes.filter((l) => l.some((c) => c.trim() !== ""));
}

function normaliserClasse(valeur) {
  const v = normaliser(valeur).replace(/\s+/g, "").toUpperCase();
  if (CLASSES.includes(v)) return v;
  const m = v.match(/^(LICENCE|MASTER)(\d)/);
  if (m) {
    const code = (m[1] === "LICENCE" ? "L" : "M") + m[2];
    if (CLASSES.includes(code)) return code;
  }
  return null;
}

function importerCSV(texte) {
  texte = texte.replace(/^\uFEFF/, "");
  const lignes = analyserCSV(texte, detecterSeparateur(texte));
  if (!lignes.length) {
    afficherToast("Le fichier est vide.", true);
    return;
  }

  // Détection de l'en-tête
  const entete = lignes[0].map((c) => normaliser(c));
  const aEntete = entete.includes("email") || entete.includes("nom");
  const colonnes = { nom: 0, prenom: 1, email: 2, classe: 3, note: 4 };
  if (aEntete) {
    Object.keys(colonnes).forEach((k) => {
      const idx = entete.indexOf(k);
      colonnes[k] = idx;
    });
    if (Object.values(colonnes).some((i) => i === -1)) {
      afficherToast("Colonnes attendues : Nom, Prénom, Email, Classe, Note.", true);
      return;
    }
  }

  const donnees = aEntete ? lignes.slice(1) : lignes;
  let ajoutes = 0;
  let doublons = 0;
  let invalides = 0;
  const emailsConnus = new Set(etudiants.map((e) => e.email.toLowerCase()));

  donnees.forEach((cols) => {
    const classe = normaliserClasse(cols[colonnes.classe] || "");
    const note = parseFloat(String(cols[colonnes.note] || "").replace(",", "."));
    const item = {
      nom: (cols[colonnes.nom] || "").trim(),
      prenom: (cols[colonnes.prenom] || "").trim(),
      email: (cols[colonnes.email] || "").trim(),
      classe,
      note,
    };

    if (
      item.nom.length < 2 ||
      item.prenom.length < 2 ||
      !emailValide(item.email) ||
      !classe ||
      Number.isNaN(note) ||
      note < 0 ||
      note > 20
    ) {
      invalides++;
      return;
    }
    if (emailsConnus.has(item.email.toLowerCase())) {
      doublons++;
      return;
    }
    emailsConnus.add(item.email.toLowerCase());
    etudiants.push({ id: nouvelId(), ...item, creeLe: Date.now() + ajoutes });
    ajoutes++;
  });

  if (ajoutes) {
    sauvegarder();
    pageCourante = 1;
    afficher();
  }

  const details = [];
  if (doublons) details.push(`${doublons} doublon${doublons > 1 ? "s" : ""} ignoré${doublons > 1 ? "s" : ""}`);
  if (invalides) details.push(`${invalides} ligne${invalides > 1 ? "s" : ""} invalide${invalides > 1 ? "s" : ""}`);
  afficherToast(
    `${ajoutes} étudiant${ajoutes > 1 ? "s" : ""} importé${ajoutes > 1 ? "s" : ""}` +
      (details.length ? ` (${details.join(", ")})` : "") +
      ".",
    ajoutes === 0,
  );
}

$("btnImportCSV").addEventListener("click", () => $("fichierCSV").click());

$("fichierCSV").addEventListener("change", (e) => {
  const fichier = e.target.files[0];
  if (!fichier) return;
  if (!/\.csv$/i.test(fichier.name) && fichier.type !== "text/csv") {
    afficherToast("Veuillez choisir un fichier .csv.", true);
    e.target.value = "";
    return;
  }
  const lecteur = new FileReader();
  lecteur.onload = () => importerCSV(String(lecteur.result));
  lecteur.onerror = () => afficherToast("Lecture du fichier impossible.", true);
  lecteur.readAsText(fichier, "UTF-8");
  e.target.value = ""; // permet de réimporter le même fichier
});

/* =====================================================
   MODE SOMBRE
   ===================================================== */
function appliquerTheme(sombre) {
  document.body.classList.toggle("sombre", sombre);
  $("btnTheme").innerHTML = sombre
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

function themeInitial() {
  try {
    const enregistre = localStorage.getItem(CLE_THEME);
    if (enregistre) return enregistre === "sombre";
  } catch {
    /* ignoré */
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

$("btnTheme").addEventListener("click", () => {
  const sombre = !document.body.classList.contains("sombre");
  appliquerTheme(sombre);
  try {
    localStorage.setItem(CLE_THEME, sombre ? "sombre" : "clair");
  } catch {
    /* ignoré */
  }
});

/* =====================================================
   DÉMARRAGE
   ===================================================== */
appliquerTheme(themeInitial());
afficher();