const generator = new MysteryGenerator();
let currentMystery = null;

const generateBtn = document.getElementById('generateBtn');
const mysteryContainer = document.getElementById('mysteryContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const revealBtn = document.getElementById('revealBtn');
const solutionContent = document.getElementById('solutionContent');
const suspectModal = document.getElementById('suspectModal');
const helpBtn = document.getElementById('helpBtn');
const helpModalElement = document.getElementById('helpModal');
const closeModals = document.querySelectorAll('.close-modal');

generateBtn.addEventListener('click', () => {
    generateMystery();
});

revealBtn.addEventListener('click', () => {
    revealSolution();
});

// Help button click handler
helpBtn.addEventListener('click', () => {
    helpModalElement.classList.remove('hidden');
    // Reset clue display when opening help modal
    document.getElementById('clueDisplay').classList.add('hidden');
});

// Use event delegation for clue buttons
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('clue-btn')) {
        const clueIndex = parseInt(event.target.getAttribute('data-clue-index'));
        showClue(clueIndex);
    }
});

// Close modals when clicking the X buttons
closeModals.forEach(closeBtn => {
    closeBtn.addEventListener('click', (event) => {
        const modal = event.target.closest('.modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    });
});

// Close modals when clicking outside of them
window.addEventListener('click', (event) => {
    if (event.target === suspectModal) {
        suspectModal.classList.add('hidden');
    }
    if (event.target === helpModalElement) {
        helpModalElement.classList.add('hidden');
    }
});

async function generateMystery() {
    // Show loading
    mysteryContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    solutionContent.classList.add('hidden');
    revealBtn.style.display = 'block';
    revealBtn.textContent = 'Reveal Solution';

    try {
        // Get selected difficulty
        const difficultySelect = document.getElementById('difficultySelect');
        const difficulty = difficultySelect ? difficultySelect.value : '15-19';
        
        // Get custom topic and location (if provided)
        const topicInput = document.getElementById('mysteryTopic');
        const locationInput = document.getElementById('mysteryLocation');
        const customTopic = topicInput ? topicInput.value.trim() : '';
        const customLocation = locationInput ? locationInput.value.trim() : '';
        
        currentMystery = await generator.generateMystery(difficulty, customTopic, customLocation);
        displayMystery(currentMystery);
        loadingSpinner.classList.add('hidden');
        mysteryContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error:', error);
        loadingSpinner.classList.add('hidden');
        alert(`Error generating mystery: ${error.message || 'Please check your internet connection and try again.'}`);
    }
}

function displayMystery(mystery) {
    // Display title and metadata
    document.getElementById('mysteryTitle').textContent = mystery.title;
    document.getElementById('mysterySetting').textContent = `Location: ${mystery.setting}`;
    document.getElementById('mysteryTime').textContent = `Time: ${mystery.timePeriod}`;

    // Hide image container (image generation removed)
    const imageContainer = document.getElementById('mysteryImageContainer');
    if (imageContainer) {
        imageContainer.classList.add('hidden');
    }

    // Display case
    document.getElementById('mysteryCase').textContent = mystery.case;

    // Display suspects
    const suspectsList = document.getElementById('suspectsList');
    suspectsList.innerHTML = '';
    mystery.suspects.forEach(suspect => {
        const suspectCard = document.createElement('div');
        suspectCard.className = 'suspect-card';
        suspectCard.innerHTML = `
            <h4>${suspect.name}</h4>
            <p><strong>Role:</strong> ${suspect.role}</p>
            <p>${suspect.description}</p>
            <p><em>Alibi: ${suspect.alibi}</em></p>
            <p><em>${suspect.suspiciousBehavior}</em></p>
        `;
        // Make card clickable to show details
        suspectCard.addEventListener('click', () => {
            showSuspectDetails(suspect);
        });
        suspectsList.appendChild(suspectCard);
    });

    // Display clues
    const cluesList = document.getElementById('cluesList');
    cluesList.innerHTML = '';
    mystery.clues.forEach(clue => {
        const clueItem = document.createElement('li');
        clueItem.textContent = clue;
        cluesList.appendChild(clueItem);
    });

    // Store solution for later reveal
    const culprit = mystery.suspects.find(s => s.isCulprit);
    if (culprit && mystery.solution) {
        const revealText = mystery.solution.reveal || 'The mystery was solved through careful investigation.';
        const explanationText = mystery.solution.explanation || 'The solution required piecing together all the clues.';
        const motiveText = culprit.description ? ` The motive was ${culprit.description.toLowerCase()}.` : '';
        
        document.getElementById('solutionText').textContent = 
            `The culprit was ${culprit.name}, the ${culprit.role}. ${revealText}`;
        document.getElementById('solutionExplanation').textContent = 
            `${explanationText}${motiveText}`;
    } else {
        console.error('Missing culprit or solution:', { culprit, solution: mystery.solution });
    }
}

function revealSolution() {
    // Toggle solution visibility
    if (solutionContent.classList.contains('hidden')) {
        // Show solution
        solutionContent.classList.remove('hidden');
        revealBtn.textContent = 'Hide Solution';
    } else {
        // Hide solution
        solutionContent.classList.add('hidden');
        revealBtn.textContent = 'Reveal Solution';
    }
}

function showSuspectDetails(suspect) {
    document.getElementById('modalSuspectName').textContent = suspect.name;
    document.getElementById('modalSuspectRole').textContent = suspect.role;
    document.getElementById('modalSuspectBackground').textContent = suspect.background;
    document.getElementById('modalSuspectRelationship').textContent = suspect.relationship;
    document.getElementById('modalSuspectPersonality').textContent = suspect.personality;
    document.getElementById('modalSuspectAlibi').textContent = suspect.alibi;
    document.getElementById('modalSuspectTimeline').textContent = suspect.timeline;
    document.getElementById('modalSuspectBehavior').textContent = suspect.suspiciousBehavior;
    document.getElementById('modalSuspectObservations').textContent = suspect.observations;
    suspectModal.classList.remove('hidden');
}

function showClue(clueIndex) {
    if (!currentMystery || !currentMystery.helpClues) {
        document.getElementById('clueDisplayText').textContent = 'Please generate a mystery first!';
        document.getElementById('clueDisplay').classList.remove('hidden');
        return;
    }

    if (clueIndex < currentMystery.helpClues.length) {
        document.getElementById('clueDisplayText').textContent = currentMystery.helpClues[clueIndex];
        document.getElementById('clueDisplay').classList.remove('hidden');
    } else {
        document.getElementById('clueDisplayText').textContent = `Clue ${clueIndex + 1} is not available.`;
        document.getElementById('clueDisplay').classList.remove('hidden');
    }
}

