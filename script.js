const CLE_STOCKAGE = "etudiantsUNCHK";
const NOTE_ADMISSION = 10;

let etudiants = chargerEtudiants();
let idEnModification = null;

const elTotal = document.getElementById("totalEtudiants");
const elMoyenne = document.getElementById("moyenneGenerale");
const elAdmis = document.getElementById("totalAdmis");
const elTaux = document.getElementById("tauxReussite");
const elMeilleurNom = document.getElementById("meilleurEtudiant");
const elMeilleurNote = document.getElementById("meilleureNote");

const formulaire = document.getElementById("formulaireEtudiant");
const titreFormulaire = document.getElementById("titreFormulaire");
const champNom = document.getElementById("nom");
const champPrenom = document.getElementById("prenom");
const champEmail = document.getElementById("email");
const champClasse = document.getElementById("classe");
const champNote = document.getElementById("note");
const btnEnregistrer = document.getElementById("btnEnregistrer");
const btnAnnuler = document.getElementById("btnAnnuler");
const messageErreur = document.getElementById("messageErreur");
const messageSucces = document.getElementById("messageSucces");

const champRecherche = document.getElementById("recherche");
const filtreClasse = document.getElementById("filtreClasse");
const choixTri = document.getElementById("triEtudiants");
const btnExportCSV = document.getElementById("btnExportCSV");
const btnExportExcel = document.getElementById("btnExportExcel");

const listeEtudiants = document.getElementById("listeEtudiants");
const aucunEtudiant = document.getElementById("aucunEtudiant");

function chargerEtudiants() {
    try {
        return JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || [];
    } catch (erreur) {
       
        return [];
    }
}

function sauvegarderEtudiants() {
     localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etudiants));
}

function estAdmis(note) {
    return note >= NOTE_ADMISSION;
}

function echapperHTML(texte) {
    const div = document.createElement("div");
    div.textContent = texte;
    return div.innerHTML;
}

function afficherMessage(element, texte) {
    messageErreur.textContent = "";
    messageSucces.textContent = "";
    element.textContent = texte;

    setTimeout(function () {
        element.textContent = "";
    }, 3000);
}

function remplirFiltreClasse() {
    const choixActuel = filtreClasse.value;

    const classes = [...new Set(etudiants.map(function (e) {
        return e.classe;
    }))].sort(function (a, b) {
        return a.localeCompare(b, "fr");
    });

    filtreClasse.innerHTML = '<option value="">Toutes les classes</option>';

    classes.forEach(function (classe) {
        const option = document.createElement("option");
        option.value = classe;
        option.textContent = classe;
        filtreClasse.appendChild(option);
    });

   
    if (classes.includes(choixActuel)) {
        filtreClasse.value = choixActuel;
    }
}

function etudiantsDeLaClasse() {
    const classeChoisie = filtreClasse.value;

    if (classeChoisie === "") {
        return etudiants;
    }
    return etudiants.filter(function (e) {
        return e.classe === classeChoisie;
    });
}



function trierEtudiants(liste) {

    const copie = [...liste];

    switch (choixTri.value) {
        case "nom-az":
            copie.sort(function (a, b) {
                return a.nom.localeCompare(b.nom, "fr");
            });
            break;
        case "nom-za":
            copie.sort(function (a, b) {
                return b.nom.localeCompare(a.nom, "fr");
            });
            break;
        case "note-desc":
            copie.sort(function (a, b) {
                return b.note - a.note;
            });
            break;
        case "note-asc":
            copie.sort(function (a, b) {
                return a.note - b.note;
            });
            break;
        case "classe":
            copie.sort(function (a, b) {
                return a.classe.localeCompare(b.classe, "fr");
            });
            break;
        default:

            copie.sort(function (a, b) {
                return b.id - a.id;
            });
    }

    return copie;
}


function obtenirEtudiantsAffiches() {

    let resultat = etudiantsDeLaClasse();

    const mot = champRecherche.value.trim().toLowerCase();

    if (mot !== "") {
        resultat = resultat.filter(function (e) {
            return (
                e.nom.toLowerCase().includes(mot) ||
                e.prenom.toLowerCase().includes(mot) ||
                e.email.toLowerCase().includes(mot) ||
                e.classe.toLowerCase().includes(mot)
            );
        });
    }

    return trierEtudiants(resultat);
}

function afficherTableau() {
    const liste = obtenirEtudiantsAffiches();

    listeEtudiants.innerHTML = "";

    aucunEtudiant.hidden = liste.length > 0;
    if (liste.length === 0) {
        aucunEtudiant.textContent = etudiants.length === 0
            ? "Aucun étudiant enregistré."
            : "Aucun étudiant ne correspond à votre recherche.";
    }

    liste.forEach(function (e, index) {
        const admis = estAdmis(e.note);
        const ligne = document.createElement("tr");

        ligne.innerHTML = `
            <td>${index + 1}</td>
            <td>${echapperHTML(e.nom)}</td>
            <td>${echapperHTML(e.prenom)}</td>
            <td>${echapperHTML(e.email)}</td>
            <td>${echapperHTML(e.classe)}</td>
            <td>${e.note.toFixed(2)}</td>
            <td><span class="${admis ? "admis" : "echec"}">${admis ? "Admis" : "Échec"}</span></td>
            <td>
                <button class="btn-modifier" data-action="modifier" data-id="${e.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-supprimer" data-action="supprimer" data-id="${e.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        listeEtudiants.appendChild(ligne);
    });
}


function mettreAJourStatistiques() {
    const liste = etudiantsDeLaClasse();
    const total = liste.length;

    
    elTotal.textContent = total;


    if (total === 0) {
        elMoyenne.textContent = "0";
        elAdmis.textContent = "0";
        elTaux.textContent = "0 %";
        elMeilleurNom.textContent = "-";
        elMeilleurNote.textContent = "";
        return;
    }

    const somme = liste.reduce(function (cumul, e) {
        return cumul + e.note;
    }, 0);
    elMoyenne.textContent = (somme / total).toFixed(2);

   
    const nbAdmis = liste.filter(function (e) {
        return estAdmis(e.note);
    }).length;
    elAdmis.textContent = nbAdmis;

    
    elTaux.textContent = Math.round((nbAdmis / total) * 100) + " %";

    
    const meilleureNote = Math.max(...liste.map(function (e) {
        return e.note;
    }));
    const meilleurs = liste.filter(function (e) {
        return e.note === meilleureNote;
    });

    let texte = meilleurs[0].prenom + " " + meilleurs[0].nom;
    if (meilleurs.length > 1) {
        texte += " (+" + (meilleurs.length - 1) + " ex æquo)";
    }
    elMeilleurNom.textContent = texte;
    elMeilleurNote.textContent = meilleureNote.toFixed(2) + " / 20";
}

function actualiser() {
    remplirFiltreClasse();
    mettreAJourStatistiques();
    afficherTableau();
}




formulaire.addEventListener("submit", function (evenement) {
    evenement.preventDefault();

    const nom = champNom.value.trim();
    const prenom = champPrenom.value.trim();
    const email = champEmail.value.trim().toLowerCase();
    const classe = champClasse.value.trim();
    const note = parseFloat(champNote.value);

    if (nom === "" || prenom === "" || classe === "") {
        afficherMessage(messageErreur, "Veuillez remplir tous les champs.");
        return;
    }
    if (isNaN(note) || note < 0 || note > 20) {
        afficherMessage(messageErreur, "La note doit être comprise entre 0 et 20.");
        return;
    }

    const emailDejaUtilise = etudiants.some(function (e) {
        return e.email === email && e.id !== idEnModification;
    });
    if (emailDejaUtilise) {
        afficherMessage(messageErreur, "Cet email existe déjà.");
        return;
    }

    if (idEnModification === null) {

        etudiants.push({ id: Date.now(), nom, prenom, email, classe, note });
        afficherMessage(messageSucces, "Étudiant ajouté avec succès.");
    } else {

        const etudiant = etudiants.find(function (e) {
            return e.id === idEnModification;
        });
        Object.assign(etudiant, { nom, prenom, email, classe, note });
        afficherMessage(messageSucces, "Étudiant modifié avec succès.");
    }

    sauvegarderEtudiants();
    quitterModeModification();
    actualiser();
});

listeEtudiants.addEventListener("click", function (evenement) {
    const bouton = evenement.target.closest("button");
    if (!bouton) return;

    const id = Number(bouton.dataset.id);

    if (bouton.dataset.action === "modifier") {
        passerEnModeModification(id);
    }

    if (bouton.dataset.action === "supprimer") {
        const etudiant = etudiants.find(function (e) {
            return e.id === id;
        });
        if (confirm("Supprimer " + etudiant.prenom + " " + etudiant.nom + " ?")) {
            etudiants = etudiants.filter(function (e) {
                return e.id !== id;
            });
            sauvegarderEtudiants();
            actualiser();
            afficherMessage(messageSucces, "Étudiant supprimé.");
        }
    }
});

function passerEnModeModification(id) {
    const etudiant = etudiants.find(function (e) {
        return e.id === id;
    });

    champNom.value = etudiant.nom;
    champPrenom.value = etudiant.prenom;
    champEmail.value = etudiant.email;
    champClasse.value = etudiant.classe;
    champNote.value = etudiant.note;

    idEnModification = id;
    titreFormulaire.textContent = "Modifier un étudiant";
    btnEnregistrer.textContent = "Enregistrer les modifications";
    btnAnnuler.hidden = false;

    formulaire.scrollIntoView({ behavior: "smooth", block: "center" });
}

function quitterModeModification() {
    idEnModification = null;
    formulaire.reset();
    titreFormulaire.textContent = "Ajouter un étudiant";
    btnEnregistrer.textContent = "Ajouter l'étudiant";
    btnAnnuler.hidden = true;
}

btnAnnuler.addEventListener("click", quitterModeModification);


champRecherche.addEventListener("input", afficherTableau);
choixTri.addEventListener("change", afficherTableau);

filtreClasse.addEventListener("change", function () {
    mettreAJourStatistiques();
    afficherTableau();
});

function telechargerFichier(contenu, nomFichier, typeMime) {
    const blob = new Blob([contenu], { type: typeMime });
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(lien.href);
}

function preparerDonneesExport() {
    return obtenirEtudiantsAffiches().map(function (e) {
        return {
            "Nom": e.nom,
            "Prénom": e.prenom,
            "Email": e.email,
            "Classe": e.classe,
            "Note": e.note,
            "Résultat": estAdmis(e.note) ? "Admis" : "Échec"
        };
    });
}

btnExportCSV.addEventListener("click", function () {
    const donnees = preparerDonneesExport();

    if (donnees.length === 0) {
        afficherMessage(messageErreur, "Aucune donnée à exporter.");
        return;
    }

    const colonnes = Object.keys(donnees[0]);
    const lignes = donnees.map(function (ligne) {
        return colonnes.map(function (col) {
    
            return '"' + String(ligne[col]).replace(/"/g, '""') + '"';
        }).join(";");
    });

    const csv = [colonnes.join(";"), ...lignes].join("\n");

    telechargerFichier("\uFEFF" + csv, "etudiants_unchk.csv", "text/csv;charset=utf-8;");
    afficherMessage(messageSucces, "Export CSV terminé.");
});

btnExportExcel.addEventListener("click", function () {
    
    if (typeof XLSX === "undefined") {
        afficherMessage(messageErreur, "Bibliothèque Excel indisponible. Vérifiez votre connexion internet.");
        return;
    }

    const donnees = preparerDonneesExport();

    if (donnees.length === 0) {
        afficherMessage(messageErreur, "Aucune donnée à exporter.");
        return;
    }

    const feuille = XLSX.utils.json_to_sheet(donnees);

    feuille["!cols"] = [
        { wch: 16 }, { wch: 16 }, { wch: 28 },
        { wch: 20 }, { wch: 8 }, { wch: 10 }
    ];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Étudiants");
    XLSX.writeFile(classeur, "etudiants_unchk.xlsx");

    afficherMessage(messageSucces, "Export Excel terminé.");
});



actualiser();