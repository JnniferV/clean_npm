# 🚀 NPM Clean React - Audit et Ménage de dépendances NPM

Ce projet vous permet d'analyser et de nettoyer facilement vos dépendances NPM à travers une interface React simple et mignonne. Le backend en Node.js s'occupe d'exécuter les audits NPM et de générer des rapports pour vous.

## 📦 Fonctionnalités

- Lancer un audit NPM complet (`npm ls`, `npm audit`, `depcheck`)
- Affichage des logs en temps réel dans l'interface
- Génération des fichiers de rapport pour les dépendances inutilisées et les vulnérabilités

## ⚙️ Installation

### 1. Décompressez le projet

- Téléchargez le projet et extrayez-le.

### 2. Installez les dépendances

#### Frontend (React) :

```bash
cd frontend
npm install
```

#### Backend (Node.js) :

```bash
cd backend
npm install
```

### 3. Démarrer l'application

#### Frontend (React) :

```bash
cd frontend
npm run build
```

#### Backend (Node.js) :

```bash
cd backend
npm start
```

### 4. Accéder à l'UI

Ouvrez votre navigateur et allez à : [http://localhost:3000](http://localhost:5000) pour l'interface utilisateur.

### 5. Lancer un audit

IMPORTANT : Le programme doit être exécuté dans un dossier qui contient un fichier package.json valide.
Cliquez sur "Lancer l'audit" dans l'interface pour commencer l'analyse de vos dépendances NPM. Vous verrez les résultats des commandes `npm ls`, `depcheck`, et `npm audit` dans la console.

## 📁 Fichiers générés

- **audit-installed-packages.txt** : Liste des dépendances installées
- **audit-unused-packages.txt** : Dépendances inutilisées
- **audit-security.txt** : Vulnérabilités détectées
- **git-diff-before-clean.txt** : Diff Git avant nettoyage

## 📄 Contribuer

N'hésitez pas à soumettre des pull requests si vous avez des améliorations à proposer.

## ⚠️ Avertissement

Ce projet utilise des scripts qui exécutent des commandes sur votre machine, assurez-vous de comprendre ce que chaque commande fait avant de les utiliser.
