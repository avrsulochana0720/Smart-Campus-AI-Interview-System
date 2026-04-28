import os
import spacy
import nltk
from typing import Dict, List, Tuple, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
import re
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

class ConfigurableNLPClassifier:
    def __init__(self):
        # Load configuration from environment variables
        self.model_type = os.getenv("NLP_MODEL_TYPE", "spacy")
        self.spacy_model_name = os.getenv("SPACY_MODEL", "en_core_web_sm")
        self.nltk_model = os.getenv("NLTK_MODEL", "punkt")
        self.transformers_model = os.getenv("TRANSFORMERS_MODEL", "distilbert-base-uncased")
        self.confidence_threshold = float(os.getenv("CLASSIFICATION_CONFIDENCE_THRESHOLD", "0.7"))
        
        # Classification types
        self.classification_types = os.getenv("CLASSIFICATION_TYPES", "IMPACT,MOTIVE,SYSTEM").split(",")
        
        # Initialize the selected model
        self.model = self._initialize_model()
        
        # Define keyword patterns for each classification type
        self.impact_keywords = [
            'increased', 'decreased', 'improved', 'reduced', 'optimized', 'achieved', 'delivered',
            'generated', 'saved', 'cost', 'revenue', 'profit', 'growth', 'performance', 'metrics',
            'roi', 'kpi', 'results', 'outcome', 'impact', 'efficiency', 'productivity', 'sales',
            'budget', 'target', 'goal', 'quota', 'percentage', '%', '$', 'million', 'billion'
        ]
        
        self.motive_keywords = [
            'led', 'managed', 'team', 'leadership', 'mentored', 'trained', 'coached', 'guided',
            'collaborated', 'partnered', 'communicated', 'presented', 'negotiated', 'influenced',
            'motivated', 'inspired', 'people', 'staff', 'employees', 'colleagues', 'stakeholders',
            'clients', 'customers', 'relationships', 'network', 'community', 'culture', 'engagement'
        ]
        
        self.system_keywords = [
            'developed', 'designed', 'architected', 'implemented', 'built', 'created', 'engineered',
            'system', 'architecture', 'infrastructure', 'framework', 'platform', 'database',
            'algorithm', 'process', 'workflow', 'procedure', 'methodology', 'technical', 'code',
            'software', 'hardware', 'network', 'security', 'scalability', 'optimization', 'automation'
        ]
    
    def _initialize_model(self):
        """Initialize the selected NLP model based on configuration"""
        try:
            if self.model_type == "spacy":
                print(f"Loading spaCy model: {self.spacy_model_name}")
                return spacy.load(self.spacy_model_name)
            
            elif self.model_type == "nltk":
                print(f"Using NLTK with model: {self.nltk_model}")
                # Download required NLTK data
                try:
                    nltk.data.find('tokenizers/punkt')
                except LookupError:
                    nltk.download('punkt')
                try:
                    nltk.data.find('corpora/stopwords')
                except LookupError:
                    nltk.download('stopwords')
                try:
                    nltk.data.find('tokenizers/punkt_tab')
                except LookupError:
                    nltk.download('punkt_tab')
                return None  # NLTK doesn't need a model object
            
            elif self.model_type == "transformers":
                print(f"Loading Transformers model: {self.transformers_model}")
                return pipeline(
                    "text-classification",
                    model=self.transformers_model,
                    tokenizer=self.transformers_model,
                    return_all_scores=True
                )
            
            elif self.model_type == "sklearn":
                print("Using scikit-learn for classification")
                # Initialize a simple sklearn classifier
                self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
                self.sklearn_model = MultinomialNB()
                self._train_sklearn_model()
                return None
            
            else:
                raise ValueError(f"Unsupported model type: {self.model_type}")
        
        except Exception as e:
            print(f"Error initializing {self.model_type} model: {e}")
            print("Falling back to spaCy model")
            self.model_type = "spacy"
            return spacy.load("en_core_web_sm")
    
    def _train_sklearn_model(self):
        """Train a simple sklearn model for demonstration"""
        # Sample training data - in production, this would be a larger dataset
        training_texts = [
            "Increased revenue by 40% through strategic initiatives",
            "Led team of 10 developers to achieve project goals",
            "Designed scalable architecture for enterprise systems",
            "Reduced costs by $500K through optimization",
            "Mentored junior engineers in best practices",
            "Implemented microservices for better performance"
        ]
        
        training_labels = ["IMPACT", "MOTIVE", "SYSTEM", "IMPACT", "MOTIVE", "SYSTEM"]
        
        # Train the model
        X = self.vectorizer.fit_transform(training_texts)
        self.sklearn_model.fit(X, training_labels)
    
    def extract_name(self, text: str) -> str:
        """Extract candidate name using NLP patterns"""
        lines = text.split('\n')[:5]  # Check first 5 lines
        for line in lines:
            line = line.strip()
            if line and len(line.split()) <= 4 and not any(char.isdigit() for char in line):
                # Skip lines with emails, phones, or common section headers
                if not any(skip in line.lower() for skip in ['@', '.com', 'resume', 'cv', 'experience', 'education']):
                    return line
        return "Candidate"
    
    def extract_education(self, text: str) -> str:
        """Extract education information using pattern matching"""
        education_patterns = [
            r'(bachelor|master|phd|doctorate|associate|b\.s\.|m\.s\.|ph\.d\.).*?(\d{4})',
            r'university.*?(\d{4})',
            r'college.*?(\d{4})',
            r'degree.*?(\d{4})'
        ]
        
        for pattern in education_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return f"{matches[0][0]} - {matches[0][1]}"
        
        return "Education details not found"
    
    def extract_evidence(self, text: str, classification_type: str) -> List[str]:
        """Extract specific evidence sentences for each classification type"""
        evidence = []
        
        keywords = {
            'impact': self.impact_keywords,
            'motive': self.motive_keywords,
            'system': self.system_keywords
        }
        
        # Split text into lines and bullet points
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Skip empty lines or headers
            if not line or len(line) < 10 or line.isupper():
                continue
                
            # Remove bullet points and clean up
            clean_line = line.lstrip('-•*').strip()
            
            if len(clean_line) < 15 or len(clean_line) > 250:
                continue
                
            line_lower = clean_line.lower()
            # Check if line contains any keywords for this classification type
            keyword_matches = [kw for kw in keywords[classification_type] if kw in line_lower]
            
            if keyword_matches:
                evidence.append(clean_line)
                if len(evidence) >= 3:  # Limit to 3 evidence points
                    break
        
        # If no evidence from lines, try sentence tokenization as fallback
        if not evidence:
            sentences = sent_tokenize(text)
            for sentence in sentences:
                sentence_lower = sentence.lower()
                keyword_matches = [kw for kw in keywords[classification_type] if kw in sentence_lower]
                
                if keyword_matches:
                    clean_sentence = sentence.strip()
                    if len(clean_sentence) > 15 and len(clean_sentence) < 250:
                        evidence.append(clean_sentence)
                        if len(evidence) >= 3:
                            break
        
        return evidence
    
    def classify_with_spacy(self, text: str) -> Tuple[str, Dict[str, float]]:
        """Classify using spaCy model"""
        doc = self.model(text.lower())
        tokens = [token.text for token in doc if not token.is_stop and not token.is_punct]
        
        # Calculate keyword frequencies
        impact_count = sum(1 for token in tokens if token in self.impact_keywords)
        motive_count = sum(1 for token in tokens if token in self.motive_keywords)
        system_count = sum(1 for token in tokens if token in self.system_keywords)
        
        # Calculate confidence scores
        total = impact_count + motive_count + system_count
        if total == 0:
            return "SYSTEM", {"IMPACT": 0.33, "MOTIVE": 0.33, "SYSTEM": 0.34}
        
        confidence_scores = {
            "IMPACT": impact_count / total,
            "MOTIVE": motive_count / total,
            "SYSTEM": system_count / total
        }
        
        primary_type = max(confidence_scores, key=confidence_scores.get)
        return primary_type, confidence_scores
    
    def classify_with_nltk(self, text: str) -> Tuple[str, Dict[str, float]]:
        """Classify using NLTK with keyword analysis"""
        tokens = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        filtered_tokens = [token for token in tokens if token.isalpha() and token not in stop_words]
        
        # Calculate keyword frequencies
        impact_count = sum(1 for token in filtered_tokens if token in self.impact_keywords)
        motive_count = sum(1 for token in filtered_tokens if token in self.motive_keywords)
        system_count = sum(1 for token in filtered_tokens if token in self.system_keywords)
        
        # Calculate confidence scores
        total = impact_count + motive_count + system_count
        if total == 0:
            return "SYSTEM", {"IMPACT": 0.33, "MOTIVE": 0.33, "SYSTEM": 0.34}
        
        confidence_scores = {
            "IMPACT": impact_count / total,
            "MOTIVE": motive_count / total,
            "SYSTEM": system_count / total
        }
        
        primary_type = max(confidence_scores, key=confidence_scores.get)
        return primary_type, confidence_scores
    
    def classify_with_transformers(self, text: str) -> Tuple[str, Dict[str, float]]:
        """Classify using Transformers model"""
        try:
            # For transformers, we'll use a simple approach with text classification
            # In a real scenario, you'd fine-tune a model on your specific classification task
            results = self.model(text[:512])  # Limit text length for transformers
            
            # Map generic labels to our classification types
            # This is a simplified approach - in production, you'd fine-tune the model
            confidence_scores = {}
            for result in results[0]:
                label = result['label']
                score = result['score']
                
                # Map generic labels to our types (this is simplified)
                if 'POSITIVE' in label.upper():
                    confidence_scores['IMPACT'] = score
                elif 'NEUTRAL' in label.upper():
                    confidence_scores['SYSTEM'] = score
                else:
                    confidence_scores['MOTIVE'] = score
            
            # Ensure all types are present
            for cls_type in self.classification_types:
                if cls_type not in confidence_scores:
                    confidence_scores[cls_type] = 0.1
            
            primary_type = max(confidence_scores, key=confidence_scores.get)
            return primary_type, confidence_scores
            
        except Exception as e:
            print(f"Error with transformers classification: {e}")
            # Fallback to keyword-based classification
            return self.classify_with_spacy(text)
    
    def classify_with_sklearn(self, text: str) -> Tuple[str, Dict[str, float]]:
        """Classify using scikit-learn model"""
        try:
            X = self.vectorizer.transform([text])
            probabilities = self.sklearn_model.predict_proba(X)[0]
            
            confidence_scores = {}
            for i, class_name in enumerate(self.sklearn_model.classes_):
                confidence_scores[class_name] = probabilities[i]
            
            # Ensure all types are present
            for cls_type in self.classification_types:
                if cls_type not in confidence_scores:
                    confidence_scores[cls_type] = 0.1
            
            primary_type = max(confidence_scores, key=confidence_scores.get)
            return primary_type, confidence_scores
            
        except Exception as e:
            print(f"Error with sklearn classification: {e}")
            # Fallback to keyword-based classification
            return self.classify_with_spacy(text)
    
    def classify_candidate(self, text: str) -> Dict[str, Any]:
        """Main classification method that uses the configured model"""
        try:
            # Extract basic information
            name = self.extract_name(text)
            education = self.extract_education(text)
            
            # Classify using the selected model
            if self.model_type == "spacy":
                primary_type, confidence_scores = self.classify_with_spacy(text)
            elif self.model_type == "nltk":
                primary_type, confidence_scores = self.classify_with_nltk(text)
            elif self.model_type == "transformers":
                primary_type, confidence_scores = self.classify_with_transformers(text)
            elif self.model_type == "sklearn":
                primary_type, confidence_scores = self.classify_with_sklearn(text)
            else:
                primary_type, confidence_scores = self.classify_with_spacy(text)
            
            # Generate detailed analysis for each type
            classification_details = {}
            for cls_type in self.classification_types:
                evidence = self.extract_evidence(text, cls_type.lower())
                classification_details[cls_type.lower()] = self.generate_analysis(
                    evidence, cls_type.lower(), confidence_scores.get(cls_type, 0.0)
                )
            
            classification_details['primary_type'] = primary_type
            classification_details['confidence_scores'] = confidence_scores
            classification_details['model_used'] = self.model_type
            
            return {
                "name": name,
                "education": education,
                "candidate_type": primary_type,
                "confidence_scores": confidence_scores,
                "classification_details": classification_details,
                "model_used": self.model_type
            }
            
        except Exception as e:
            print(f"Error in classification: {e}")
            return {
                "name": "Candidate",
                "education": "Education details not found",
                "candidate_type": "SYSTEM",
                "confidence_scores": {"IMPACT": 0.33, "MOTIVE": 0.33, "SYSTEM": 0.34},
                "classification_details": {},
                "model_used": self.model_type
            }
    
    def generate_analysis(self, evidence: List[str], classification_type: str, confidence: float) -> Dict:
        """Generate detailed analysis for each classification type"""
        
        # Define templates for each type
        templates = {
            'impact': {
                'analysis': f"This candidate demonstrates results-orientation with focus on measurable outcomes and business impact. Their approach emphasizes quantifiable achievements, performance improvements, and delivering tangible value through data-driven decision making.",
                'strengths': [
                    "Results-driven mindset with focus on metrics and outcomes",
                    "Ability to quantify achievements and demonstrate business impact",
                    "Strong orientation toward performance improvement and efficiency",
                    "Skill in translating technical work into business value"
                ],
                'indicators': [
                    "Uses specific numbers and percentages to describe achievements",
                    "Emphasizes cost savings, revenue growth, or performance metrics",
                    "Demonstrates understanding of business value and ROI",
                    "Focuses on measurable outcomes and key performance indicators"
                ],
                'hr_focus': "Explore their approach to setting and measuring goals, ask for specific examples of how they've influenced business metrics, and discuss their methodology for prioritizing projects based on business impact and data-driven insights."
            },
            'motive': {
                'analysis': f"This candidate shows people-oriented capabilities with experience in team coordination and leadership. Their approach emphasizes collaboration, team development, and building effective relationships to achieve collective goals through interpersonal skills and motivational leadership.",
                'strengths': [
                    "Leadership and team management capabilities",
                    "Excellent communication and interpersonal abilities",
                    "Skill in motivating and developing team members",
                    "Ability to build collaborative relationships across stakeholders"
                ],
                'indicators': [
                    "Frequently mentions team leadership and collaboration experiences",
                    "Demonstrates experience with mentoring and training others",
                    "Shows awareness of interpersonal relationships and team culture",
                    "Emphasizes communication, influence, and people development"
                ],
                'hr_focus': "Assess their leadership philosophy and style, explore conflict resolution experiences, discuss their approach to team motivation and professional development, and understand how they build and maintain effective team relationships."
            },
            'system': {
                'analysis': f"This candidate exhibits technical and systems thinking capabilities with focus on architectural design and process optimization. Their approach emphasizes structured problem-solving, technical implementation, and creating scalable, maintainable solutions through analytical thinking and systematic approaches.",
                'strengths': [
                    "Technical architecture and system design skills",
                    "Strong analytical and problem-solving abilities",
                    "Expertise in process optimization and automation",
                    "Ability to create sustainable and scalable technical solutions"
                ],
                'indicators': [
                    "Focuses on technical architecture and system design principles",
                    "Discusses process optimization, automation, and efficiency",
                    "Demonstrates understanding of scalability and maintainability",
                    "Emphasizes technical implementation and systematic approaches"
                ],
                'hr_focus': "Evaluate their technical decision-making process, explore how they balance technical debt with innovation, discuss their approach to system documentation and knowledge transfer, and understand their methodology for solving complex technical challenges."
            }
        }
        
        template = templates[classification_type]
        return {
            'analysis': template['analysis'],
            'evidence': evidence,
            'strengths': template['strengths'],
            'indicators': template['indicators'],
            'hr_focus': template['hr_focus'],
            'confidence': confidence
        }
