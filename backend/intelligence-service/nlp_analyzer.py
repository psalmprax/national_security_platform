import logging
import spacy
from typing import Dict, List, Optional
import re
import asyncio
from llm_provider import get_llm_provider

# Initialize Logger
logger = logging.getLogger("nlp_analyzer")

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if model not found (though it should be baked into Docker)
    logger.warning("spaCy model 'en_core_web_sm' not found, attempting last-resort download...")
    import subprocess
    import sys
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

class NLPAnalyzer:
    """Extract structured intelligence from unstructured alert descriptions"""
    
    def __init__(self):
        self.nlp = nlp
        self.llm = get_llm_provider()
        
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
        Tier 1: Fast spaCy Analysis (Instant, Local)
        """
        if not description or len(description) < 10:
            return self._empty_result()
        
        # Process with spaCy (using original case for better NER)
        doc = self.nlp(description)
        desc_lower = description.lower()
        
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
                entities['locations'].append(ent.text.lower())
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
        
        # Extract location mentions from nigerian_locations list
        for loc in self.nigerian_locations:
            if re.search(r'\b' + re.escape(loc) + r'\b', desc_lower):
                entities['locations'].append(loc)

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
            if key == 'other':
                # Handle list of dicts for 'other'
                seen = set()
                deduped = []
                for item in entities[key]:
                    item_tuple = (item['text'], item['type'])
                    if item_tuple not in seen:
                        seen.add(item_tuple)
                        deduped.append(item)
                entities[key] = deduped
            else:
                entities[key] = list(set(entities[key]))
        keywords = list(set(keywords))[:20]  # Limit to top 20
        
        return {
            'entities': entities,
            'keywords': keywords,
            'urgency_level': urgency,
            'word_count': len(doc),
            'auto_categorized': True,
            'analysis_tier': 'FAST_SPACY'
        }

    async def deep_analyze(self, description: str) -> Dict:
        """
        Tier 2: LLM Deep Analysis (Asynchronous, Advanced Reasoning)
        """
        if not self.llm:
            return {"error": "No LLM provider configured"}

        system_prompt = """
        You are the 'Deep Analyst' for the National Security Platform. 
        Your goal is to extract refined intelligence from alert descriptions.
        Output MUST be a JSON object with:
        - refined_severity: float (0.0 to 1.0)
        - threat_actors: list of strings
        - weapon_details: list of strings
        - tactical_prediction: string (short prediction of next likely event)
        - confidence: float
        """

        logger.info("Triggering Tier 2: LLM Deep Analysis...")
        return await self.llm.analyze(description, system_prompt)
    
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

async def deep_analyze(description: str) -> Dict:
    """
    Public API for performing deep LLM analysis on alert descriptions.
    """
    return await analyzer.deep_analyze(description)
