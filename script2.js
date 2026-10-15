"use strict";
const CLE_STOCKAGE = "etudiantsUNCHK";

let etudiants = charger();

let pageActuelle = 1;
let idEtudiantAModifier = null;
let idEtudiantASupprimer = null;

let taillePage = 10;

const formulaire = document.getElementById("formulaireEtudiant");
const formulaireEdition = document.getElementById("formulaireEdition");

const messageErreur = document.getElementById("messageErreur");
const messageSucces = document.getElementById("messageSucces");
const erreurEdition = document.getElementById("erreurEdition");

const listeEtudiants = document.getElementById("listeEtudiants");

const modalEdition = document.getElementById("modalEdition");
const modalConfirmation = document.getElementById("modalConfirmation");

const recherche = document.getElementById("recherche");
const filtreClasse = document.getElementById("filtreClasse");
const filtreResultat = document.getElementById("filtreResultat");
const triEtudiants = document.getElementById("triEtudiants");
const selectTaillePage = document.getElementById("taillePage");


function charger() {
  try {
    const donnees = JSON.parse(
      localStorage.getItem(CLE_STOCKAGE)
    );

    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

function sauvegarder() {
  try {
    localStorage.setItem(
      CLE_STOCKAGE,
      JSON.stringify(etudiants)
    );
    return true;
  } catch (erreur) {
    afficherToast("Impossible de sauvegarder les données.", true);
    return false;
  }
}


function echapper(texte) {
  return String(texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let minuterieToast;

function afficherToast(message, erreur = false) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.toggle("toast-erreur", erreur);
  toast.classList.add("visible");

  clearTimeout(minuterieToast);

  minuterieToast = setTimeout(() => {
    toast.classList.remove("visible");
  }, 3000);
}


function afficherErreur(message) {
  messageErreur.textContent = message;
  messageSucces.textContent = "";
}

function afficherSucces(message) {
  messageSucces.textContent = message;
  messageErreur.textContent = "";
}

function effacerMessages() {
  messageErreur.textContent = "";
  messageSucces.textContent = "";
  erreurEdition.textContent = "";
}



function validerEtudiant(nom, prenom, email, note, liste = etudiants, idIgnore = null) {
  if (!nom.trim() || !prenom.trim() || !email.trim() || note === "") {
    return "Tous les champs sont obligatoires.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Veuillez saisir une adresse email valide.";
  }

  const valeurNote = Number(note);

  if (!Number.isFinite(valeurNote) || valeurNote < 0 || valeurNote > 20) {
    return "La note doit être comprise entre 0 et 20.";
  }

  const emailExiste = liste.some((etudiant) =>
    etudiant.email.toLowerCase() === email.trim().toLowerCase()
    && etudiant.id !== idIgnore
  );

  if (emailExiste) {
    return "Cette adresse email existe déjà.";
  }

  return "";
}


formulaire.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  const nom = document.getElementById("nom").value.trim();
  const prenom = document.getElementById("prenom").value.trim();
  const email = document.getElementById("email").value.trim();
  const classe = document.getElementById("classe").value;
  const note = document.getElementById("note").value;

  const erreur = validerEtudiant(nom, prenom, email, note);

  if (erreur) {
    afficherErreur(erreur);
    return;
  }

  const nouvelEtudiant = {
    id: Date.now(),
    nom: nom,
    prenom: prenom,
    email: email,
    classe: classe,
    note: Number(note)
  };

  etudiants.push(nouvelEtudiant);

  if (!sauvegarder()) {
    etudiants.pop();
    return;
  }

  formulaire.reset();
  effacerMessages();
  pageActuelle = 1;

  afficherSucces("Étudiant ajouté avec succès !");
  afficherToast("Étudiant ajouté avec succès.");

  actualiserApplication();
});


function obtenirResultat(note) {
  if (Number(note) >= 10) {
    return "Admis";
  }

  return "Ajourné";
}


function afficherEtudiants(liste) {
  listeEtudiants.innerHTML = "";

  const debut = (pageActuelle - 1) * taillePage;
  const etudiantsPage = liste.slice(debut, debut + taillePage);

  document.getElementById("aucunEtudiant").hidden = liste.length > 0;

  etudiantsPage.forEach((etudiant, index) => {
    const ligne = document.createElement("tr");

    const resultat = obtenirResultat(etudiant.note);
    const classeResultat = resultat === "Admis" ? "admis" : "echec";

    ligne.innerHTML = `
      <td>${debut + index + 1}</td>
      <td>${echapper(etudiant.nom)}</td>
      <td>${echapper(etudiant.prenom)}</td>
      <td>${echapper(etudiant.email)}</td>
      <td>${echapper(etudiant.classe)}</td>
      <td>${Number(etudiant.note).toFixed(2)} / 20</td>
      <td>
        <span class="${classeResultat}">${resultat}</span>
      </td>
      <td>
        <div class="cellule-actions">
          <button type="button" class="btn-modifier"
            data-action="modifier" data-id="${etudiant.id}"
            aria-label="Modifier ${echapper(etudiant.prenom)}">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button type="button" class="btn-supprimer"
            data-action="supprimer" data-id="${etudiant.id}"
            aria-label="Supprimer ${echapper(etudiant.prenom)}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    listeEtudiants.appendChild(ligne);
  });

  document.getElementById("compteurResultats").textContent =
    `${liste.length} étudiant(s) trouvé(s).`;

  afficherPagination(liste.length);
}


function ouvrirEdition(id) {
  const etudiant = etudiants.find((element) => element.id === id);

  if (!etudiant) {
    afficherToast("Étudiant introuvable.", true);
    return;
  }

  idEtudiantAModifier = id;

  document.getElementById("editNom").value = etudiant.nom;
  document.getElementById("editPrenom").value = etudiant.prenom;
  document.getElementById("editEmail").value = etudiant.email;
  document.getElementById("editClasse").value = etudiant.classe;
  document.getElementById("editNote").value = etudiant.note;

  erreurEdition.textContent = "";
  modalEdition.hidden = false;

  document.getElementById("editNom").focus();
}



formulaireEdition.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  const etudiant = etudiants.find(
    (element) => element.id === idEtudiantAModifier
  );

  if (!etudiant) {
    erreurEdition.textContent = "Étudiant introuvable.";
    return;
  }

  const nom = document.getElementById("editNom").value.trim();
  const prenom = document.getElementById("editPrenom").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const classe = document.getElementById("editClasse").value;
  const note = document.getElementById("editNote").value;

  const erreur = validerEtudiant(
    nom, prenom, email, note, etudiants, idEtudiantAModifier
  );

  if (erreur) {
    erreurEdition.textContent = erreur;
    return;
  }

  
  const ancienneVersion = { ...etudiant };

  etudiant.nom = nom;
  etudiant.prenom = prenom;
  etudiant.email = email;
  etudiant.classe = classe;
  etudiant.note = Number(note);

  if (!sauvegarder()) {
    Object.assign(etudiant, ancienneVersion);
    return;
  }

  modalEdition.hidden = true;
  idEtudiantAModifier = null;

  afficherToast("Modification enregistrée.");
  actualiserApplication();
});

function ouvrirConfirmation(id) {
  const etudiant = etudiants.find(
    (element) => String(element.id) === String(id)
  );

  if (!etudiant) {
    console.log("Identifiant reçu :", id);
    console.log("Liste des étudiants :", etudiants);

    afficherToast("Étudiant introuvable. Vérifiez son identifiant.", true);
    return;
  }

  idEtudiantASupprimer = etudiant.id;

  document.getElementById("texteConfirm").textContent =
    `Voulez-vous supprimer ${etudiant.prenom} ${etudiant.nom} ?`;

  modalConfirmation.hidden = false;
}




// function ouvrirConfirmation(id) {
//   const etudiant = etudiants.find((element) => element.id === id);

//   if (!etudiant) {
//     afficherToast("Étudiant introuvable.", true);
//     return;
//   }

//   idEtudiantASupprimer = id;

//   document.getElementById("texteConfirm").textContent =
//     `Voulez-vous supprimer ${etudiant.prenom} ${etudiant.nom} ?`;

//   modalConfirmation.hidden = false;
// }


document.getElementById("btnConfirmerSuppression")
  .addEventListener("click", function () {
    const index = etudiants.findIndex(
      (element) => element.id === idEtudiantASupprimer
    );
    

    if (index === -1) {
      modalConfirmation.hidden = true;
      afficherToast("Étudiant introuvable.", true);
      return;
    }

    const etudiantSupprime = etudiants[index];

    etudiants.splice(index, 1);

    if (!sauvegarder()) {
      etudiants.splice(index, 0, etudiantSupprime);
      return;
    }

    modalConfirmation.hidden = true;
    idEtudiantASupprimer = null;

    afficherToast("Étudiant supprimé.");
    actualiserApplication();
  });
  


document.querySelectorAll("[data-fermer]").forEach((bouton) => {
  bouton.addEventListener("click", function () {
    modalEdition.hidden = true;
    idEtudiantAModifier = null;
  });
});

document.getElementById("btnAnnulerSuppression")
  .addEventListener("click", function () {
    modalConfirmation.hidden = true;
    idEtudiantASupprimer = null;
  });

document.addEventListener("keydown", function (evenement) {
  if (evenement.key === "Escape") {
    modalEdition.hidden = true;
    modalConfirmation.hidden = true;

    idEtudiantAModifier = null;
    idEtudiantASupprimer = null;
  }
});

listeEtudiants.addEventListener("click", function (evenement) {
  const bouton = evenement.target.closest("button[data-action]");

  if (!bouton) {
    return;
  }

  // On conserve l'identifiant sous forme de chaîne.
  const id = bouton.dataset.id;

  if (bouton.dataset.action === "modifier") {
    ouvrirEdition(id);
  }

  if (bouton.dataset.action === "supprimer") {
    ouvrirConfirmation(id);
  }
});


function obtenirEtudiantsFiltres() {
  
  const texte = recherche.value.trim().toLowerCase();

  
  const classeChoisie = filtreClasse.value;
  const resultatChoisi = filtreResultat.value;

  
  let resultat = etudiants.filter((etudiant) => {
    const correspondTexte =
      etudiant.nom.toLowerCase().includes(texte) ||
      etudiant.prenom.toLowerCase().includes(texte) ||
      etudiant.email.toLowerCase().includes(texte) ||
      etudiant.classe.toLowerCase().includes(texte);

    const correspondClasse =
      classeChoisie === "" || etudiant.classe === classeChoisie;

    const correspondResultat =
      resultatChoisi === "" ||
      (resultatChoisi === "admis" && Number(etudiant.note) >= 10) ||
      (resultatChoisi === "echec" && Number(etudiant.note) < 10);

    return correspondTexte && correspondClasse && correspondResultat;
  });


  switch (triEtudiants.value) {
    case "nom-az":
      resultat.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      break;

    case "nom-za":
      resultat.sort((a, b) => b.nom.localeCompare(a.nom, "fr"));
      break;

    case "note-desc":
      resultat.sort((a, b) => Number(b.note) - Number(a.note));
      break;

    case "note-asc":
      resultat.sort((a, b) => Number(a.note) - Number(b.note));
      break;

    case "classe":
      resultat.sort((a, b) => a.classe.localeCompare(b.classe, "fr"));
      break;

    case "recent":
      resultat.sort((a, b) => Number(b.id) - Number(a.id));
      break;
  }

  return resultat;
}



function actualiserTableau() {
  const resultat = obtenirEtudiantsFiltres();

  const nombrePages = Math.ceil(resultat.length / taillePage);


  if (nombrePages === 0) {
    pageActuelle = 1;
  } else if (pageActuelle > nombrePages) {
    pageActuelle = nombrePages;
  }

  afficherEtudiants(resultat);
}


recherche.addEventListener("input", function () {
  pageActuelle = 1;
  actualiserTableau();
});

filtreClasse.addEventListener("change", function () {
  pageActuelle = 1;
  actualiserTableau();
});

filtreResultat.addEventListener("change", function () {
  pageActuelle = 1;
  actualiserTableau();
});

triEtudiants.addEventListener("change", function () {
  pageActuelle = 1;
  actualiserTableau();
});

selectTaillePage.addEventListener("change", function () {
  taillePage = Number(selectTaillePage.value);
  pageActuelle = 1;
  actualiserTableau();
});


document.getElementById("btnReinitFiltres")
  .addEventListener("click", function () {
    recherche.value = "";
    filtreClasse.value = "";
    filtreResultat.value = "";
    triEtudiants.value = "recent";
    selectTaillePage.value = "10";

    taillePage = 10;
    pageActuelle = 1;

    actualiserTableau();

    afficherToast("Filtres réinitialisés.");
  });


function afficherPagination(total) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const nombrePages = Math.ceil(total / taillePage);

  if (nombrePages <= 1) {
    return;
  }

  const precedent = document.createElement("button");
  precedent.type = "button";
  precedent.textContent = "←";
  precedent.disabled = pageActuelle === 1;
  precedent.setAttribute("aria-label", "Page précédente");

  precedent.addEventListener("click", function () {
    if (pageActuelle > 1) {
      pageActuelle--;
      actualiserTableau();
    }
  });

  pagination.appendChild(precedent);

  for (let page = 1; page <= nombrePages; page++) {
    const bouton = document.createElement("button");

    bouton.type = "button";
    bouton.textContent = page;

    if (page === pageActuelle) {
      bouton.classList.add("actif");
      bouton.setAttribute("aria-current", "page");
    }

    bouton.addEventListener("click", function () {
      pageActuelle = page;
      actualiserTableau();
    });

    pagination.appendChild(bouton);
  }

  const suivant = document.createElement("button");
  suivant.type = "button";
  suivant.textContent = "→";
  suivant.disabled = pageActuelle === nombrePages;
  suivant.setAttribute("aria-label", "Page suivante");

  suivant.addEventListener("click", function () {
    if (pageActuelle < nombrePages) {
      pageActuelle++;
      actualiserTableau();
    }
  });

  pagination.appendChild(suivant);
}

function actualiserStatistiques() {
  const total = etudiants.length;

  const admis = etudiants.filter(
    (etudiant) => Number(etudiant.note) >= 10
  ).length;


  const somme = etudiants.reduce(
    (totalNotes, etudiant) => totalNotes + Number(etudiant.note),
    0
  );


  const moyenne = total > 0 ? somme / total : 0;


  const taux = total > 0 ? (admis / total) * 100 : 0;

  const meilleur = etudiants.reduce((meilleurActuel, etudiant) => {
    if (!meilleurActuel || Number(etudiant.note) > Number(meilleurActuel.note)) {
      return etudiant;
    }

    return meilleurActuel;
  }, null);

  document.getElementById("totalEtudiants").textContent = total;

  document.getElementById("moyenneGenerale").textContent =
    moyenne.toFixed(2) + " / 20";

  document.getElementById("totalAdmis").textContent = admis;

  document.getElementById("tauxReussite").textContent =
    taux.toFixed(1) + " %";

  document.getElementById("meilleurEtudiant").textContent =
    meilleur ? meilleur.prenom + " " + meilleur.nom : "-";

  document.getElementById("meilleureNote").textContent =
    meilleur ? Number(meilleur.note).toFixed(2) + " / 20" : "";


  document.getElementById("legAdmis").textContent = admis;
  document.getElementById("legEchec").textContent = total - admis;

  document.getElementById("donutPct").textContent =
    taux.toFixed(0) + " %";

  document.getElementById("graphDonut").style.setProperty("--pct", taux);

  actualiserGraphiqueClasses();
  actualiserGraphiqueNotes();
}


function actualiserGraphiqueClasses() {
  const zone = document.getElementById("graphClasses");
  zone.innerHTML = "";

  const classes = ["L1", "L2", "L3", "M1", "M2"];

  classes.forEach((classe) => {
    const nombre = etudiants.filter(
      (etudiant) => etudiant.classe === classe
    ).length;

    const ligne = document.createElement("div");
    ligne.className = "barre-ligne";

    ligne.innerHTML = `
      <span>${classe}</span>
      <div class="barre-piste">
        <div class="barre-remplie"
          style="width: ${etudiants.length ? nombre / etudiants.length * 100 : 0}%">
        </div>
      </div>
      <span class="barre-valeur">${nombre}</span>
    `;

    zone.appendChild(ligne);
  });

  if (etudiants.length === 0) {
    zone.innerHTML = '<p class="vide-graphique">Aucune donnée disponible.</p>';
  }
}


function actualiserGraphiqueNotes() {
  const zone = document.getElementById("graphNotes");
  zone.innerHTML = "";

  const tranches = [
    { nom: "0–4", min: 0, max: 5 },
    { nom: "5–9", min: 5, max: 10 },
    { nom: "10–14", min: 10, max: 15 },
    { nom: "15–20", min: 15, max: 20.01 }
  ];

  tranches.forEach((tranche) => {
    const nombre = etudiants.filter((etudiant) => {
      const note = Number(etudiant.note);
      return note >= tranche.min && note < tranche.max;
    }).length;

    const pourcentage = etudiants.length
      ? (nombre / etudiants.length) * 100
      : 0;

    const ligne = document.createElement("div");
    ligne.className = "barre-ligne";

    ligne.innerHTML = `
      <span>${tranche.nom}</span>
      <div class="barre-piste">
        <div class="barre-remplie" style="width: ${pourcentage}%"></div>
      </div>
      <span class="barre-valeur">${nombre}</span>
    `;

    zone.appendChild(ligne);
  });

  if (etudiants.length === 0) {
    zone.innerHTML = '<p class="vide-graphique">Aucune donnée disponible.</p>';
  }
}

function actualiserApplication() {
  actualiserStatistiques();
  actualiserTableau();
}

function obtenirDonneesExport() {
  return etudiants.map((etudiant) => ({
    Nom: etudiant.nom,
    Prenom: etudiant.prenom,
    Email: etudiant.email,
    Classe: etudiant.classe,
    Note: Number(etudiant.note),
    Resultat: obtenirResultat(etudiant.note)
  }));
}


function exporterCSV() {
  const donnees = obtenirDonneesExport();

  if (donnees.length === 0) {
    afficherToast("Aucun étudiant à exporter.", true);
    return;
  }

  const colonnes = Object.keys(donnees[0]);

  function formaterCSV(valeur) {
    return '"' + String(valeur).replace(/"/g, '""') + '"';
  }

  const lignes = [
    colonnes.map(formaterCSV).join(";"),
    ...donnees.map((etudiant) =>
      colonnes.map((colonne) => formaterCSV(etudiant[colonne])).join(";")
    )
  ];

  const contenu = "\uFEFF" + lignes.join("\r\n");
  const fichier = new Blob([contenu], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(fichier);
  const lien = document.createElement("a");

  lien.href = url;
  lien.download = "etudiants.csv";
  lien.click();

  URL.revokeObjectURL(url);
  afficherToast("Export CSV terminé.");
}

function exporterExcel() {
  const donnees = obtenirDonneesExport();

  if (donnees.length === 0) {
    afficherToast("Aucun étudiant à exporter.", true);
    return;
  }

  if (typeof XLSX === "undefined") {
    afficherToast("La bibliothèque Excel n'est pas chargée.", true);
    return;
  }

  const feuille = XLSX.utils.json_to_sheet(donnees);
  const classeur = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(classeur, feuille, "Étudiants");
  XLSX.writeFile(classeur, "etudiants.xlsx");

  afficherToast("Export Excel terminé.");
}


document.getElementById("btnExportCSV")
  .addEventListener("click", exporterCSV);

document.getElementById("btnExportExcel")
  .addEventListener("click", exporterExcel);


document.getElementById("btnImportCSV")
  .addEventListener("click", function () {
    document.getElementById("fichierCSV").click();
  });

function lireCSV(texte) {
  const lignes = [];
  let ligne = [];
  let valeur = "";
  let entreGuillemets = false;

  
  for (let i = 0; i < texte.length; i++) {
    const caractere = texte[i];
    const suivant = texte[i + 1];

    if (caractere === '"' && entreGuillemets && suivant === '"') {
      valeur += '"';
      i++;
    } else if (caractere === '"') {
      entreGuillemets = !entreGuillemets;
    } else if ((caractere === ";" || caractere === ",") && !entreGuillemets) {
      ligne.push(valeur);
      valeur = "";
    } else if ((caractere === "\n" || caractere === "\r") && !entreGuillemets) {
      if (caractere === "\r" && suivant === "\n") i++;

      ligne.push(valeur);

      if (ligne.some((cellule) => cellule.trim() !== "")) {
        lignes.push(ligne);
      }

      ligne = [];
      valeur = "";
    } else {
      valeur += caractere;
    }
  }

  if (valeur !== "" || ligne.length > 0) {
    ligne.push(valeur);
    lignes.push(ligne);
  }

  return lignes;
}

document.getElementById("fichierCSV")
  .addEventListener("change", async function () {
    const fichier = this.files[0];

    if (!fichier) return;

    try {
      const texte = (await fichier.text()).replace(/^\uFEFF/, "");
      const lignes = lireCSV(texte);

      if (lignes.length < 2) {
        afficherToast("Le fichier CSV est vide.", true);
        return;
      }

      const entetes = lignes[0].map((nom) =>
        nom.trim().toLowerCase().normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );

      const colonnesNecessaires = ["nom", "prenom", "email", "classe", "note"];

      if (!colonnesNecessaires.every((colonne) => entetes.includes(colonne))) {
        afficherToast("Les colonnes du fichier CSV sont incorrectes.", true);
        return;
      }

      const nouveauxEtudiants = [];
      const emails = new Set(etudiants.map(
        (etudiant) => etudiant.email.toLowerCase()
      ));

      let ignores = 0;

      lignes.slice(1).forEach((ligne) => {
        const obtenir = (nomColonne) =>
          ligne[entetes.indexOf(nomColonne)]?.trim() || "";

        const nom = obtenir("nom");
        const prenom = obtenir("prenom");
        const email = obtenir("email");
        const classe = obtenir("classe").toUpperCase();
        const note = obtenir("note").replace(",", ".");

        const erreur = validerEtudiant(
          nom, prenom, email, note, [...etudiants, ...nouveauxEtudiants]
        );

        if (
          erreur ||
          !["L1", "L2", "L3", "M1", "M2"].includes(classe) ||
          emails.has(email.toLowerCase())
        ) {
          ignores++;
          return;
        }

        nouveauxEtudiants.push({
          id: Date.now() + nouveauxEtudiants.length,
          nom,
          prenom,
          email,
          classe,
          note: Number(note)
        });

        emails.add(email.toLowerCase());
      });

      if (nouveauxEtudiants.length === 0) {
        afficherToast("Aucun nouvel étudiant valide à importer.", true);
        return;
      }

      const anciensEtudiants = etudiants;
      etudiants = [...etudiants, ...nouveauxEtudiants];

      if (!sauvegarder()) {
        etudiants = anciensEtudiants;
        return;
      }

      pageActuelle = 1;
      actualiserApplication();

      afficherToast(
        `${nouveauxEtudiants.length} étudiant(s) importé(s), ${ignores} ignoré(s).`
      );
    } catch (erreur) {
      afficherToast("Impossible de lire ce fichier CSV.", true);
    } finally {
      this.value = "";
    }
  });

const btnTheme = document.getElementById("btnTheme");
const iconeTheme = btnTheme.querySelector("i");

try {
  if (localStorage.getItem("themeUNCHK") === "sombre") {
    document.body.classList.add("sombre");
  }
} catch (erreur) {

}

function actualiserIconeTheme() {
  const modeSombre = document.body.classList.contains("sombre");

  iconeTheme.className = modeSombre
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";

  btnTheme.title = modeSombre
    ? "Passer en mode clair"
    : "Passer en mode sombre";

  btnTheme.setAttribute(
    "aria-label",
    modeSombre ? "Passer en mode clair" : "Passer en mode sombre"
  );
}

btnTheme.addEventListener("click", function () {
  document.body.classList.toggle("sombre");

  const mode = document.body.classList.contains("sombre")
    ? "sombre"
    : "clair";

  try {
    localStorage.setItem("themeUNCHK", mode);
  } catch (erreur) {
   
  }

  actualiserIconeTheme();
});

actualiserIconeTheme();

formulaire.addEventListener("reset", function () {
  effacerMessages();
});

actualiserApplication();


