const formulaire = document.getElementById("formulaireEtudiant");

const nom = document.getElementById("nom");
const prenom = document.getElementById("prenom");
const email = document.getElementById("email");
const classe = document.getElementById("classe");
const note = document.getElementById("note");

const listeEtudiants = document.getElementById("listeEtudiants");
const aucunEtudiant = document.getElementById("aucunEtudiant");

const recherche = document.getElementById("recherche");

const totalEtudiants = document.getElementById("totalEtudiants");
const moyenneGenerale = document.getElementById("moyenneGenerale");
const totalAdmis = document.getElementById("totalAdmis");

const messageErreur = document.getElementById("messageErreur");
const messageSucces = document.getElementById("messageSucces");

const btnEnregistrer = document.getElementById("btnEnregistrer");
const btnAnnuler = document.getElementById("btnAnnuler");
const titreFormulaire = document.getElementById("titreFormulaire");


let etudiants = JSON.parse(localStorage.getItem("etudiants")) || [];

let idEtudiantModifie = null;


function sauvegarderEtudiants() {

    localStorage.setItem("etudiants", JSON.stringify(etudiants));

}

function afficherEtudiants(liste = etudiants) {

    listeEtudiants.innerHTML = "";

    if (liste.length === 0) {

        aucunEtudiant.style.display = "block";

        return;

    }

    aucunEtudiant.style.display = "none";


    liste.forEach((etudiant, index) => {

        const resultat = Number(etudiant.note) >= 10
            ? "Admis"
            : "Échec";

        const classeResultat = Number(etudiant.note) >= 10
            ? "admis"
            : "echec";


        const ligne = document.createElement("tr");

        ligne.innerHTML = `
            <td>${index + 1}</td>

            <td>${etudiant.nom}</td>

            <td>${etudiant.prenom}</td>

            <td>${etudiant.email}</td>

            <td>${etudiant.classe}</td>

            <td>${etudiant.note}/20</td>

            <td>
                <span class="${classeResultat}">
                    ${resultat}
                </span>
            </td>

            <td>

                <button 
                    class="btn-modifier"
                    onclick="modifierEtudiant(${etudiant.id})">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>

                <button 
                    class="btn-supprimer"
                    onclick="supprimerEtudiant(${etudiant.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>

            </td>
        `;

        listeEtudiants.appendChild(ligne);

    });

}


function calculerStatistiques() {

    // map() récupère toutes les notes

    const notes = etudiants.map(etudiant => Number(etudiant.note));


    // reduce() calcule la somme des notes

    const somme = notes.reduce((total, note) => {
        return total + note;
    }, 0);


    // Calcul de la moyenne

    const moyenne = etudiants.length > 0
        ? somme / etudiants.length
        : 0;


    // filter() récupère uniquement les étudiants admis

    const admis = etudiants.filter(etudiant => {
        return Number(etudiant.note) >= 10;
    });


    // Affichage des statistiques

    totalEtudiants.textContent = etudiants.length;

    moyenneGenerale.textContent = moyenne.toFixed(2);

    totalAdmis.textContent = admis.length;

}


formulaire.addEventListener("submit", function(event) {

    event.preventDefault();

    const nomValue = nom.value.trim();
    const prenomValue = prenom.value.trim();
    const emailValue = email.value.trim();
    const classeValue = classe.value.trim();
    const noteValue = Number(note.value);


    messageErreur.textContent = "";
    messageSucces.textContent = "";


    if (
        nomValue === "" ||
        prenomValue === "" ||
        emailValue === "" ||
        classeValue === "" ||
        note.value === ""
    ) {

        messageErreur.textContent = "Veuillez remplir tous les champs.";

        return;

    }


    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValide.test(emailValue)) {

        messageErreur.textContent = "Veuillez entrer une adresse email valide.";

        return;

    }


    if (noteValue < 0 || noteValue > 20) {

        messageErreur.textContent = "La note doit être comprise entre 0 et 20.";

        return;

    }

    if (idEtudiantModifie !== null) {

        const etudiant = etudiants.find(
            etudiant => etudiant.id === idEtudiantModifie
        );


        if (etudiant) {

            etudiant.nom = nomValue;
            etudiant.prenom = prenomValue;
            etudiant.email = emailValue;
            etudiant.classe = classeValue;
            etudiant.note = noteValue;

        }


        messageSucces.textContent = "Étudiant modifié avec succès.";

    }

    else {

        const nouvelEtudiant = {

            id: Date.now(),

            nom: nomValue,

            prenom: prenomValue,

            email: emailValue,

            classe: classeValue,

            note: noteValue

        };


        etudiants.push(nouvelEtudiant);


        messageSucces.textContent = "Étudiant ajouté avec succès.";

    }


    sauvegarderEtudiants();


    afficherEtudiants();

    calculerStatistiques();


    // Réinitialiser le formulaire

    formulaire.reset();


    // Quitter le mode modification

    idEtudiantModifie = null;

    titreFormulaire.textContent = "Ajouter un étudiant";

    btnEnregistrer.textContent = "Ajouter l'étudiant";

    btnAnnuler.hidden = true;


    // Effacer le message après quelques secondes

    setTimeout(function() {

        messageSucces.textContent = "";

    }, 3000);

});

function modifierEtudiant(id) {

    const etudiant = etudiants.find(
        etudiant => etudiant.id === id
    );


    if (!etudiant) {
        return;
    }



    nom.value = etudiant.nom;

    prenom.value = etudiant.prenom;

    email.value = etudiant.email;

    classe.value = etudiant.classe;

    note.value = etudiant.note;


    idEtudiantModifie = id;

    titreFormulaire.textContent = "Modifier un étudiant";


    btnEnregistrer.textContent = "Enregistrer les modifications";


    btnAnnuler.hidden = false;


    formulaire.scrollIntoView({
        behavior: "smooth"
    });

}


btnAnnuler.addEventListener("click", function() {

    formulaire.reset();

    idEtudiantModifie = null;

    titreFormulaire.textContent = "Ajouter un étudiant";

    btnEnregistrer.textContent = "Ajouter l'étudiant";

    btnAnnuler.hidden = true;

    messageErreur.textContent = "";
    messageSucces.textContent = "";

});


function supprimerEtudiant(id) {

    const etudiant = etudiants.find(
        etudiant => etudiant.id === id
    );


    if (!etudiant) {
        return;
    }


    const confirmation = confirm(
        `Voulez-vous supprimer ${etudiant.prenom} ${etudiant.nom} ?`
    );


    if (!confirmation) {
        return;
    }


    etudiants = etudiants.filter(
        etudiant => etudiant.id !== id
    );


    sauvegarderEtudiants();

    afficherEtudiants();

    calculerStatistiques();


    messageSucces.textContent = "Étudiant supprimé avec succès.";


    setTimeout(function() {

        messageSucces.textContent = "";

    }, 3000);

}


recherche.addEventListener("input", function() {

    const texteRecherche = recherche.value.toLowerCase().trim();


    const resultats = etudiants.filter(etudiant => {

        return (
            etudiant.nom.toLowerCase().includes(texteRecherche) ||
            etudiant.prenom.toLowerCase().includes(texteRecherche) ||
            etudiant.email.toLowerCase().includes(texteRecherche) ||
            etudiant.classe.toLowerCase().includes(texteRecherche)
        );

    });


    afficherEtudiants(resultats);

});


afficherEtudiants();

calculerStatistiques();