# Feature 5: NLP Report Analysis
# Analyzes alert descriptions using spaCy to extract structured intelligence

import spacy
from typing import Dict, List
import re

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # If model not found, download it
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

class NLPAnalyzer:
    """Extract structured intelligence from unstructured alert descriptions"""
    
    def __int__(self):
        self.nlp = nlp
        
        # Nigerian-specific entity patterns
        self.nigerian_locations = self.load_nigerian_locations()
        self.threat_keywords = {
            'critical': ['gunfire', 'shooting', 'explosion', 'bomb', 'armed', 'weapons', 'hostage', 'massacre'],
            'high': ['kidnapping', 'abduction', 'ransom', 'threat', 'attack', 'robbery', 'violence'],
            'medium': ['suspicious', 'trespassing', 'theft', 'burglary', 'vandalism'],
            'low': ['noise', 'disturbance', 'loitering', 'argument']
        }
    
    def analyze_alert(self, description: str) -> Dict:
        """
        Analyze alert description and extract intelligence
        
        Args:
            description: Raw alert description text
            
        Returns:
            Dictionary with extracted entities, keywords, and urgency level
        """
        if not description or len(description) < 10:
            return self._empty_result()
        
        # Process with spaCy
        doc = self.nlp(description.lower())
        
        # Extract entities
        entities = {
            'people': [],
            'locations': [],
            'vehicles': [],
            'organizations': [],
            'weapons': [],
            'other': []
        }
        
        for ent in doc.ents:
            if ent.label_ == 'PERSON':
                entities['people'].append(ent.text)
            elif ent.label_ in ['GPE', 'LOC', 'FAC']:  # Geopolitical, Location, Facility
                entities['locations'].append(ent.text)
            elif ent.label_ == 'ORG':
                entities['organizations'].append(ent.text)
            else:
                entities['other'].append({'text': ent.text, 'type': ent.label_})
        
        # Extract vehicle mentions (pattern matching)
        vehicle_patterns = [
            r'\b(hilux|sienna|camry|corolla|bus|truck|motorcycle|okada|keke|vehicle|car|van)\b',
            r'\b([A-Z]{3}-\d{3}[A-Z]{2})\b',  # Nigerian license plate format
        ]
        for pattern in vehicle_patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            entities['vehicles'].extend(matches)
        
        # Extract weapon mentions
        weapon_patterns = r'\b(gun|rifle|ak-47|pistol|machete|knife|weapon|grenade|bomb|explosive)\b'
        weapons = re.findall(weapon_patterns, description, re.IGNORECASE)
        entities['weapons'].extend(weapons)
        
        # Extract keywords (noun chunks + important verbs)
        keywords = []
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) <= 3:  # Only short phrases
                keywords.append(chunk.text)
        
        # Add action verbs
        for token in doc:
            if token.pos_ == 'VERB' and token.text not in ['is', 'was', 'were', 'are', 'be']:
                keywords.append(token.lemma_)
        
        # Classify urgency level
        urgency = self._classify_urgency(description)
        
        # Deduplicate
        for key in entities:
            entities[key] = list(set(entities[key]))
        keywords = list(set(keywords))[:20]  # Limit to top 20
        
        return {
            'entities': entities,
            'keywords': keywords,
            'urgency_level': urgency,
            'word_count': len(doc),
            'auto_categorized': True
        }
    
    def _classify_urgency(self, text: str) -> str:
        """Classify urgency level based on keyword presence"""
        text_lower = text.lower()
        
        # Check for critical keywords
        for keyword in self.threat_keywords['critical']:
            if keyword in text_lower:
                return 'critical'
        
        # Check for high urgency
        for keyword in self.threat_keywords['high']:
            if keyword in text_lower:
                return 'high'
        
        # Check for medium
        for keyword in self.threat_keywords['medium']:
            if keyword in text_lower:
                return 'medium'
        
        return 'low'
    
    def _empty_result(self) -> Dict:
        """Return empty analysis result"""
        return {
            'entities': {
                'people': [],
                'locations': [],
                'vehicles': [],
                'organizations': [],
                'weapons': [],
                'other': []
            },
            'keywords': [],
            'urgency_level': 'low',
            'auto_categorized': False
        }
    
    def load_nigerian_locations(self) -> List[str]:
        """Load common Nigerian location names for better entity recognition"""
        # This would ideally load from a comprehensive database
        return [
            'lagos', 'abuja', 'kano', 'ibadan', 'kaduna', 'port harcourt',
            'benin city', 'maiduguri', 'zaria', 'jos', 'ilorin', 'oyo',
            'enugu', 'abeokuta', 'aba', 'sokoto', 'owerri', 'damaturu'
        ]

# Singleton instance
analyzer = NLPAnalyzer()

def analyze_alert_description(description: str) -> Dict:
    """
    Public API for analyzing alert descriptions
    Called by the IntelligenceService when processing new alerts
    """
    return analyzer.analyze_alert(description)
