from nlp_analyzer import NLPAnalyzer

def run_debug_test():
    analyzer = NLPAnalyzer()
    
    print("--- TEST 1: EMPTY ---")
    print(analyzer.analyze_alert(""))
    
    print("\n--- TEST 2: CRITICAL ---")
    desc_critical = "There is an active shooting and explosion at the main market. Armed men are spotted."
    res_critical = analyzer.analyze_alert(desc_critical)
    print(res_critical)
    
    print("\n--- TEST 3: HIGH ---")
    desc_high = "Reports of a kidnapping and kidnapping for ransom near the school in Lagos."
    res_high = analyzer.analyze_alert(desc_high)
    print(res_high)
    
    print("\n--- TEST 4: ENTITIES ---")
    desc_entities = "John Doe was seen in a white Hilux near Lagos. He had an AK-47."
    res_entities = analyzer.analyze_alert(desc_entities)
    print(res_entities)

if __name__ == "__main__":
    run_debug_test()
