from ai_service import ResumeAnalyzer

def test_nlp_analysis():
    analyzer = ResumeAnalyzer()
    
    test_resume = """
    John Doe
    Senior Software Engineer
    
    EDUCATION
    Bachelor of Computer Science - 2020 - MIT University
    
    EXPERIENCE
    Senior Software Engineer at Tech Corp (2021-Present)
    - Led team of 8 developers to increase system performance by 45%
    - Reduced infrastructure costs by $750K through cloud optimization
    - Implemented microservices architecture serving 1M+ users
    - Mentored 5 junior engineers in best practices
    - Collaborated with product team to deliver features 30% faster
    
    Software Engineer at StartupXYZ (2020-2021)
    - Developed RESTful APIs for e-commerce platform
    - Optimized database queries improving response time by 60%
    - Built automated testing framework reducing bugs by 40%
    """
    
    print("Testing NLP-based Resume Analysis...")
    print("=" * 50)
    
    # Debug: Check keyword extraction
    print("Debug: Checking keyword extraction...")
    from nltk.tokenize import sent_tokenize
    
    sentences = sent_tokenize(test_resume)
    print(f"Total sentences: {len(sentences)}")
    
    # Check for impact keywords
    impact_keywords = ['increased', 'decreased', 'improved', 'reduced', 'optimized', 'achieved', 'delivered', 'generated', 'saved', 'cost', 'revenue', 'profit', 'growth', 'performance', 'metrics', '%', '$']
    
    for i, sentence in enumerate(sentences[:10]):
        sentence_lower = sentence.lower()
        found_keywords = [kw for kw in impact_keywords if kw in sentence_lower]
        if found_keywords:
            print(f"Sentence {i}: {sentence.strip()}")
            print(f"  Found keywords: {found_keywords}")
    
    print("\n" + "="*50)
    
    result = analyzer.analyze_resume(test_resume)
    
    print(f"Name: {result['name']}")
    print(f"Education: {result['education']}")
    print(f"Primary Type: {result['candidate_type']}")
    
    print("\nDetailed Analysis:")
    for cls_type in ['impact', 'motive', 'system']:
        details = result['classification_details'].get(cls_type, {})
        print(f"\n{cls_type.upper()}:")
        print(f"  Analysis: {details.get('analysis', 'N/A')}")
        print(f"  Evidence: {details.get('evidence', [])}")
        print(f"  Strengths: {details.get('strengths', [])}")
        print(f"  Indicators: {details.get('indicators', [])}")
        print(f"  HR Focus: {details.get('hr_focus', 'N/A')}")
    
    print("\n✅ NLP Analysis Complete!")

if __name__ == "__main__":
    test_nlp_analysis()
