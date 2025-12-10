class MysteryGenerator {
    constructor() {
        this.apiKey = 'AIzaSyDz9GBRUsVK2wQbV1aMk3s3TYKRm5XF3nE';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        // Public CORS proxy for hosted sites
        // Try direct API call first, fallback to public proxy if CORS fails
        this.useDirectCall = true;
        this.corsProxy = 'https://corsproxy.io/?destination=';
        
        this.settings = [
            'Victorian Mansion', 'Abandoned Warehouse', 'Luxury Cruise Ship',
            'Remote Island', 'Art Gallery', 'University Campus', 'Mountain Lodge',
            'Theater', 'Museum', 'Country Estate', 'City Apartment', 'Beach Resort'
        ];

        this.timePeriods = [
            'Present Day'
        ];

        this.crimeTypes = [
            'Theft', 'Disappearance', 'Murder', 'Sabotage', 'Blackmail',
            'Forgery', 'Espionage', 'Kidnapping', 'Arson', 'Fraud'
        ];
    }

    async generateMystery(difficulty = '15-19', customTopic = '', customLocation = '') {
        // Use custom values if provided, otherwise use random selection
        const setting = customLocation || this.getRandomItem(this.settings);
        const crimeType = customTopic || this.getRandomItem(this.crimeTypes);
        
        // Get difficulty instructions based on age range
        const difficultyInstructions = this.getDifficultyInstructions(difficulty);
        
        // Construct the full prompt (this part remains the same)
        const prompt = `Create a mystery story with the following details:
- Setting: ${setting}
- Crime Type: ${crimeType}
- Time Period: Present Day
- Difficulty Level: ${difficulty} (${difficultyInstructions.label})

${difficultyInstructions.instructions}

Generate a complete mystery with:
1. A compelling title (${difficultyInstructions.titleComplexity})
2. A detailed case description (${difficultyInstructions.caseLength})
3. ${difficultyInstructions.suspectCount} suspects, each with:
   - Name
   - Role
   - Background (${difficultyInstructions.backgroundDetail})
   - Relationship to location/victim (${difficultyInstructions.relationshipDetail})
   - Personality traits (${difficultyInstructions.personalityDetail})
   - Alibi (${difficultyInstructions.alibiComplexity})
   - Timeline of movements (${difficultyInstructions.timelineComplexity})
   - Suspicious behavior (${difficultyInstructions.behaviorComplexity})
   - Additional observations (${difficultyInstructions.observationsComplexity})
4. ${difficultyInstructions.clueCount} main clues (${difficultyInstructions.clueComplexity})
5. 10 additional help clues (${difficultyInstructions.helpClueComplexity}, numbered 1-10)
6. A solution revealing who the culprit is and how they were caught (${difficultyInstructions.solutionComplexity})

Format the response as a JSON object with this exact structure:
{
  "title": "The Case of...",
  "setting": "${setting}",
  "timePeriod": "Present Day",
  "crimeType": "${crimeType}",
  "case": "case description here",
  "suspects": [
    {
      "name": "Full Name",
      "role": "Role",
      "description": "brief description",
      "background": "background info",
      "relationship": "relationship info",
      "personality": "personality traits",
      "alibi": "alibi description",
      "timeline": "timeline info",
      "suspiciousBehavior": "suspicious behavior",
      "observations": "additional observations"
    }
  ],
  "clues": ["clue 1", "clue 2", "clue 3", "clue 4"],
  "helpClues": ["help clue 1", "help clue 2", ... "help clue 10"],
  "solution": {
    "reveal": "how culprit was revealed - this should be a complete sentence or two explaining how they were caught",
    "explanation": "detailed explanation - this should be a complete paragraph explaining how all the clues connected and led to solving the mystery. Make sure this explanation is complete and not cut off."
  }
}

Return ONLY valid JSON, no markdown formatting. Ensure the JSON is complete and properly closed with all closing braces.`;

        
        try {
            const targetUrl = `${this.apiUrl}?key=${this.apiKey}`;
            let response;
            
            // Try direct API call first (might work on some hosting platforms)
            if (this.useDirectCall) {
                try {
                    response = await fetch(targetUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    });
                    
                    // If direct call succeeds, use it
                    if (response.ok) {
                        console.log('Using direct API call');
                    } else {
                        throw new Error('Direct call failed, trying proxy');
                    }
                } catch (directError) {
                    // If direct call fails (likely CORS), use public proxy
                    console.log('Direct call failed, using public CORS proxy:', directError.message);
                    const proxiedUrl = `${this.corsProxy}${encodeURIComponent(targetUrl)}`;
                    console.log('Proxied URL (first 150 chars):', proxiedUrl.substring(0, 150));
                    
                    response = await fetch(proxiedUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    });
                }
            } else {
                // Use proxy directly
                const proxiedUrl = `${this.corsProxy}${encodeURIComponent(targetUrl)}`;
                console.log('Using public CORS proxy');
                console.log('Proxied URL (first 150 chars):', proxiedUrl.substring(0, 150));
                
                response = await fetch(proxiedUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                });
            }

            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage += ' - ' + errorText;
                    }
                } catch (e) {
                    // Ignore if we can't read the error text
                }
                throw new Error(errorMessage);
            }

            // Handle response - the proxy might return text or JSON
            let data;
            const responseText = await response.text();
            console.log('Raw response (first 500 chars):', responseText.substring(0, 500));
            
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                // If parsing fails, the proxy might have wrapped it or returned text
                console.error('Failed to parse response as JSON:', e);
                console.error('Response text (first 1000 chars):', responseText.substring(0, 1000));
                throw new Error('Invalid response format from API - not valid JSON');
            }

            // Log the response structure for debugging
            console.log('Response structure keys:', Object.keys(data));
            if (data.candidates) {
                console.log('Candidates found:', data.candidates.length);
            }

            // Extract text from Gemini response
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Invalid API response structure.');
                console.error('Response keys:', Object.keys(data));
                console.error('Full response:', JSON.stringify(data, null, 2).substring(0, 1000));
                throw new Error('Invalid API response structure - missing candidates or content. Check console for details.');
            }
            
            const text = data.candidates[0].content.parts[0].text;
            
            // Clean up the response (remove markdown code blocks if present)
            let jsonText = text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }
            
            // Try to extract JSON if it's embedded in text
            // Use a more robust JSON extraction that handles nested braces
            let jsonMatch = null;
            let braceCount = 0;
            let startIdx = jsonText.indexOf('{');
            
            if (startIdx !== -1) {
                for (let i = startIdx; i < jsonText.length; i++) {
                    if (jsonText[i] === '{') braceCount++;
                    if (jsonText[i] === '}') braceCount--;
                    if (braceCount === 0 && i > startIdx) {
                        jsonMatch = jsonText.substring(startIdx, i + 1);
                        break;
                    }
                }
            }
            
            if (jsonMatch) {
                jsonText = jsonMatch;
            }
            
            console.log('Extracted JSON length:', jsonText.length);
            console.log('JSON ends with:', jsonText.substring(jsonText.length - 100));
            
            let mystery;
            try {
                mystery = JSON.parse(jsonText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Problematic JSON:', jsonText.substring(Math.max(0, jsonText.length - 500)));
                throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }
            
            // Validate and ensure required fields
            if (!mystery.suspects || !Array.isArray(mystery.suspects) || mystery.suspects.length === 0) {
                throw new Error('Invalid mystery: no suspects generated');
            }
            
            // Ensure one suspect is marked as culprit
            if (!mystery.suspects.some(s => s.isCulprit)) {
                const culpritIndex = Math.floor(Math.random() * mystery.suspects.length);
                mystery.suspects[culpritIndex].isCulprit = true;
            }
            
            // Ensure helpClues array exists and has 10 items
            if (!mystery.helpClues || !Array.isArray(mystery.helpClues)) {
                throw new Error('Invalid mystery: helpClues not generated');
            } else if (mystery.helpClues.length < 10) {
                // Fill up to 10 if less than 10
                while (mystery.helpClues.length < 10) {
                    mystery.helpClues.push(`Additional clue ${mystery.helpClues.length + 1}: Investigators discovered more evidence.`);
                }
            }
            
            // Validate solution exists and is complete
            if (!mystery.solution) {
                throw new Error('Invalid mystery: solution not generated');
            }
            if (!mystery.solution.reveal || !mystery.solution.explanation) {
                console.warn('Solution may be incomplete:', mystery.solution);
            }
            
            // Check if solution fields seem truncated (end abruptly)
            const reveal = mystery.solution.reveal || '';
            const explanation = mystery.solution.explanation || '';
            
            if (reveal.length > 0 && !reveal.match(/[.!?]$/)) {
                console.warn('Solution reveal may be cut off - does not end with punctuation');
            }
            if (explanation.length > 0 && !explanation.match(/[.!?]$/)) {
                console.warn('Solution explanation may be cut off - does not end with punctuation');
            }
            
            console.log('Mystery generated successfully');
            console.log('Solution reveal:', reveal.substring(0, 100) + (reveal.length > 100 ? '...' : ''));
            console.log('Solution explanation:', explanation.substring(0, 100) + (explanation.length > 100 ? '...' : ''));
            console.log('Solution reveal length:', reveal.length);
            console.log('Solution explanation length:', explanation.length);
            
            return mystery;
            
        } catch (error) {
            console.error('Error generating mystery:', error);
            throw error; // Re-throw to let the UI handle it
        }
    }

    getDifficultyInstructions(difficulty) {
        const instructions = {
            '1-4': {
                label: 'Very Easy - Ages 1-4',
                instructions: 'Make this mystery VERY SIMPLE and EASY to understand. Use simple words, short sentences, and obvious clues. The mystery should be solvable by very young children.',
                titleComplexity: 'simple and fun',
                caseLength: '1-2 very simple sentences',
                suspectCount: '2 suspects',
                backgroundDetail: 'very simple, one short phrase',
                relationshipDetail: 'very simple and clear',
                personalityDetail: 'one simple trait',
                alibiComplexity: 'very simple and easy to understand',
                timelineComplexity: 'very simple timeline',
                behaviorComplexity: 'obvious and easy to spot',
                observationsComplexity: 'very simple observations',
                clueCount: '2-3 clues',
                clueComplexity: 'very obvious and easy clues',
                helpClueComplexity: 'very simple and obvious clues',
                solutionComplexity: 'very straightforward and easy to understand'
            },
            '5-9': {
                label: 'Easy - Ages 5-9',
                instructions: 'Make this mystery SIMPLE and FUN. Use clear language, obvious clues, and make it easy to solve. Suitable for elementary school children.',
                titleComplexity: 'fun and engaging',
                caseLength: '2 simple sentences',
                suspectCount: '2-3 suspects',
                backgroundDetail: 'simple, one sentence',
                relationshipDetail: 'clear and simple',
                personalityDetail: 'one or two simple traits',
                alibiComplexity: 'simple and clear',
                timelineComplexity: 'simple timeline',
                behaviorComplexity: 'fairly obvious',
                observationsComplexity: 'simple observations',
                clueCount: '3 clues',
                clueComplexity: 'clear and obvious clues',
                helpClueComplexity: 'simple and helpful clues',
                solutionComplexity: 'clear and easy to follow'
            },
            '10-14': {
                label: 'Moderate - Ages 10-14',
                instructions: 'Make this mystery MODERATELY CHALLENGING. Use age-appropriate language and reasoning. Clues should require some thinking but not be too difficult.',
                titleComplexity: 'engaging and interesting',
                caseLength: '2-3 sentences',
                suspectCount: '3 suspects',
                backgroundDetail: 'one sentence with some detail',
                relationshipDetail: 'moderately detailed',
                personalityDetail: 'one or two traits',
                alibiComplexity: 'moderately complex',
                timelineComplexity: 'moderate complexity',
                behaviorComplexity: 'somewhat subtle',
                observationsComplexity: 'moderate observations',
                clueCount: '4 clues',
                clueComplexity: 'moderately challenging clues',
                helpClueComplexity: 'helpful clues that require some thinking',
                solutionComplexity: 'logical and moderately complex'
            },
            '15-19': {
                label: 'Challenging - Ages 15-19',
                instructions: 'Make this mystery CHALLENGING. Use more complex language and reasoning. Clues should require careful analysis and critical thinking.',
                titleComplexity: 'intriguing and sophisticated',
                caseLength: '2-3 detailed sentences',
                suspectCount: '3-4 suspects',
                backgroundDetail: 'detailed, one sentence',
                relationshipDetail: 'complex and detailed',
                personalityDetail: 'multiple traits',
                alibiComplexity: 'complex and detailed',
                timelineComplexity: 'complex timeline',
                behaviorComplexity: 'subtle and nuanced',
                observationsComplexity: 'detailed observations',
                clueCount: '4-5 clues',
                clueComplexity: 'challenging clues requiring analysis',
                helpClueComplexity: 'complex clues requiring careful thought',
                solutionComplexity: 'sophisticated and well-reasoned'
            },
            '20-24': {
                label: 'Very Challenging - Ages 20-24',
                instructions: 'Make this mystery VERY CHALLENGING. Use sophisticated language and complex reasoning. Clues should require deep analysis, red herrings are acceptable.',
                titleComplexity: 'sophisticated and compelling',
                caseLength: '3 detailed sentences',
                suspectCount: '4 suspects',
                backgroundDetail: 'detailed and nuanced',
                relationshipDetail: 'complex and multi-layered',
                personalityDetail: 'complex personality traits',
                alibiComplexity: 'complex with potential inconsistencies',
                timelineComplexity: 'very complex timeline',
                behaviorComplexity: 'very subtle and nuanced',
                observationsComplexity: 'highly detailed and complex observations',
                clueCount: '5 clues',
                clueComplexity: 'very challenging clues with potential red herrings',
                helpClueComplexity: 'highly complex clues requiring deep analysis',
                solutionComplexity: 'very sophisticated with complex reasoning'
            },
            '25-29': {
                label: 'Expert - Ages 25-29',
                instructions: 'Make this mystery EXPERT LEVEL. Use highly sophisticated language and very complex reasoning. Include red herrings, misdirection, and require expert-level deduction skills.',
                titleComplexity: 'highly sophisticated and intriguing',
                caseLength: '3-4 very detailed sentences',
                suspectCount: '4 suspects',
                backgroundDetail: 'highly detailed and nuanced',
                relationshipDetail: 'very complex and multi-layered',
                personalityDetail: 'complex and contradictory traits',
                alibiComplexity: 'very complex with subtle inconsistencies',
                timelineComplexity: 'extremely complex timeline',
                behaviorComplexity: 'extremely subtle and nuanced',
                observationsComplexity: 'extremely detailed and complex observations',
                clueCount: '5 clues',
                clueComplexity: 'expert-level clues with red herrings and misdirection',
                helpClueComplexity: 'expert-level clues requiring expert deduction',
                solutionComplexity: 'extremely sophisticated with complex logical reasoning'
            },
            'pro': {
                label: 'Pro Detective',
                instructions: 'Make this mystery PROFESSIONAL DETECTIVE LEVEL - EXTREMELY DIFFICULT. Use the most sophisticated language, include multiple red herrings, complex misdirection, require expert-level deduction, and make it as challenging as possible. This should be nearly impossible for most people to solve.',
                titleComplexity: 'highly sophisticated and mysterious',
                caseLength: '3-4 very detailed and complex sentences',
                suspectCount: '4 suspects',
                backgroundDetail: 'extremely detailed, nuanced, and potentially misleading',
                relationshipDetail: 'extremely complex, multi-layered, with hidden connections',
                personalityDetail: 'complex, contradictory, and multi-faceted traits',
                alibiComplexity: 'extremely complex with subtle inconsistencies and potential lies',
                timelineComplexity: 'extremely complex timeline with multiple overlapping events',
                behaviorComplexity: 'extremely subtle, nuanced, and potentially misleading',
                observationsComplexity: 'extremely detailed, complex observations with potential red herrings',
                clueCount: '5 clues',
                clueComplexity: 'professional-level clues with multiple red herrings, misdirection, and require expert deduction',
                helpClueComplexity: 'professional detective-level clues with red herrings and complex reasoning required',
                solutionComplexity: 'extremely sophisticated with complex logical reasoning, requiring expert-level deduction skills'
            }
        };
        
        return instructions[difficulty] || instructions['15-19'];
    }

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

