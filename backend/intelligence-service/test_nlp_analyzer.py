import unittest
from nlp_analyzer import NLPAnalyzer

class TestNLPAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.analyzer = NLPAnalyzer()

    def test_analyze_alert_empty(self):
        result = self.analyzer.analyze_alert("")
        self.assertFalse(result['auto_categorized'])
        self.assertEqual(result['urgency_level'], 'low')

    def test_analyze_alert_critical(self):
        description = "There is an active shooting and explosion at the main market. Armed men are spotted."
        result = self.analyzer.analyze_alert(description)
        self.assertEqual(result['urgency_level'], 'critical')
        # Keywords are now case-sensitive or extracted differently by NER
        self.assertTrue(any(k.lower() in [key.lower() for key in result['keywords']] for k in ['shooting', 'shoot', 'explosion', 'explode']))

    def test_analyze_alert_high(self):
        description = "Reports of a kidnapping and kidnapping for ransom near the school in Lagos."
        result = self.analyzer.analyze_alert(description)
        self.assertEqual(result['urgency_level'], 'high')
        self.assertTrue(len(result['entities']['locations']) > 0)
        self.assertTrue('lagos' in result['entities']['locations'])

    def test_analyze_alert_entities(self):
        description = "John Doe was seen in a white Hilux near Lagos. He had an AK-47."
        result = self.analyzer.analyze_alert(description)
        
        entities = result['entities']
        self.assertTrue('hilux' in [v.lower() for v in entities['vehicles']])
        self.assertTrue('ak-47' in [w.lower() for w in entities['weapons']])
        # Check if 'lagos' is caught
        self.assertTrue('lagos' in [loc.lower() for loc in entities['locations']])
        self.assertTrue(len(entities['people']) > 0)

    def test_classify_urgency(self):
        self.assertEqual(self.analyzer._classify_urgency("gunfire in the street"), 'critical')
        self.assertEqual(self.analyzer._classify_urgency("suspicious activity at night"), 'medium')
        self.assertEqual(self.analyzer._classify_urgency("loud noise from neighbors"), 'low')

if __name__ == '__main__':
    unittest.main()
